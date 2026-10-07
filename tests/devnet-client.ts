import { expect } from "chai";
import { utils } from "@coral-xyz/anchor";
import { readFileSync } from "node:fs";
import {
  Keypair,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
  PublicKey,
  type AccountInfo,
  type Connection,
} from "@solana/web3.js";
import {
  MandateClient,
  ProtocolRejection,
  SimulationRejection,
} from "../web/src/lib/solana/client";
import { keypairWallet } from "../web/src/lib/solana/wallet";
import {
  DEVNET_GENESIS,
  IDL_COMPATIBLE,
  PROGRAM_ADDRESS,
} from "../web/src/lib/solana/program";
import { verifyProgramBinary } from "../web/src/lib/solana/deployment";

describe("Deployment parity with actual source-built ELF (RPC stubs)", () => {
  const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
  const address = new PublicKey(PROGRAM_ADDRESS);
  function fixture() {
    const elf = readFileSync("target/deploy/mandateos.so");
    const [pda] = PublicKey.findProgramAddressSync(
      [address.toBuffer()],
      loader,
    );
    const programBytes = Buffer.alloc(36);
    programBytes.writeUInt32LE(2);
    pda.toBuffer().copy(programBytes, 4);
    const data = Buffer.alloc(45 + elf.length + 16);
    data.writeUInt32LE(3);
    data.writeBigUInt64LE(1n, 4);
    elf.copy(data, 45);
    const info = (bytes: Buffer): AccountInfo<Buffer> => ({
      data: bytes,
      executable: false,
      owner: loader,
      lamports: 0,
      rentEpoch: 0,
    });
    const state = info(data);
    return {
      program: info(programBytes),
      data,
      rpc: { getAccountInfo: async () => state } as unknown as Connection,
    };
  }
  async function rejected(f: ReturnType<typeof fixture>, message: string) {
    try {
      await verifyProgramBinary(f.rpc, address, f.program);
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains(message);
    }
  }
  it("matches the real local ELF and permits only zero deployment padding", async () => {
    const f = fixture();
    const r = await verifyProgramBinary(f.rpc, address, f.program);
    expect(r.sha256).length(64);
    expect(r.deployedSlot).eq("1");
  });
  it("rejects a modified executable byte", async () => {
    const f = fixture();
    f.data[145] ^= 1;
    await rejected(f, "binary differs");
  });
  it("rejects nonzero code appended after the expected ELF", async () => {
    const f = fixture();
    f.data[f.data.length - 1] = 1;
    await rejected(f, "binary differs");
  });
  it("rejects an unsupported program owner", async () => {
    const f = fixture();
    f.program.owner = PublicKey.default;
    await rejected(f, "Unsupported");
  });
  it("rejects a substituted ProgramData pointer", async () => {
    const f = fixture();
    PublicKey.default.toBuffer().copy(f.program.data, 4);
    await rejected(f, "Noncanonical");
  });
  it("rejects missing ProgramData", async () => {
    const f = fixture();
    f.rpc.getAccountInfo = async () => null;
    await rejected(f, "missing or invalid");
  });
  it("enables create only after binary verification even when the requested organization is absent", async () => {
    const f = fixture();
    f.program.executable = true;
    Object.assign(f.rpc, {
      getGenesisHash: async () => DEVNET_GENESIS,
      getSlot: async () => 7,
      getAccountInfo: async (key: PublicKey) =>
        key.equals(address)
          ? f.program
          : {
              ...f.program,
              executable: false,
              data: f.data,
            },
    });
    const c = new MandateClient(undefined, undefined, f.rpc);
    let verified: number | undefined;
    const read = c.rpc.getAccountInfo.bind(c.rpc);
    c.rpc.getAccountInfo = async (key, ...args) =>
      key.equals(address) ||
      key.equals(new PublicKey(f.program.data.subarray(4, 36)))
        ? read(key, ...args)
        : null;
    try {
      await c.load(Keypair.generate().publicKey, (slot) => {
        verified = slot;
      });
      throw Error("expected absent organization");
    } catch (e) {
      expect(String(e)).contains("Organization account not found");
    }
    expect(verified).eq(7);
    verified = undefined;
    f.data[145] ^= 1;
    try {
      await c.load(Keypair.generate().publicKey, (slot) => {
        verified = slot;
      });
      throw Error("expected binary rejection");
    } catch (e) {
      expect(String(e)).contains("binary differs");
    }
    expect(verified).eq(undefined);
  });
});

// Transport unit tests; stub responses are never Devnet evidence.
describe("Devnet client transport and provenance (RPC stubs)", () => {
  const logs = [
    "Program log: AnchorError occurred. Error Code: AncestorRevoked. Error Number: 6003. Error Message: An ancestor is revoked.",
  ];
  function transport() {
    const progress: { phase: string; signature?: string }[] = [];
    const c = new MandateClient(keypairWallet(Keypair.generate()), (p) =>
      progress.push(p),
    );
    c.rpc.sendRawTransaction = async (wire) =>
      utils.bytes.bs58.encode(Transaction.from(wire).signature!);
    c.verifyDeployment = async () => 1;
    c.rpc.getLatestBlockhash = async () => ({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 100,
    });
    return { c, progress };
  }
  it("targets the source IDL with all nine real instructions", () => {
    expect(IDL_COMPATIBLE).eq(true);
    expect(new MandateClient().program.programId.toBase58()).eq(
      PROGRAM_ADDRESS,
    );
    expect(new MandateClient().program.idl.instructions).length(9);
  });
  it("blocks wrong-network RPC before wallet signing", async () => {
    const c = new MandateClient();
    c.rpc.getGenesisHash = async () => "wrong-network-unit-test";
    c.rpc.getAccountInfo = async () => null;
    c.rpc.getSlot = async () => 1;
    try {
      await c.verifyDeployment();
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("Wrong network");
    }
  });
  it("blocks absent program on verified Devnet", async () => {
    const c = new MandateClient();
    c.rpc.getGenesisHash = async () => DEVNET_GENESIS;
    c.rpc.getAccountInfo = async () => null;
    c.rpc.getSlot = async () => 1;
    try {
      await c.verifyDeployment();
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("program account not found");
    }
  });
  it("requires a connected signer", async () => {
    const c = new MandateClient();
    c.verifyDeployment = async () => 1;
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("signing wallet");
    }
  });
  it("accepts every real instruction discriminator after Anchor camelCase conversion", async () => {
    const { c } = transport();

    c.rpc.confirmTransaction = async () => ({
      context: { slot: 7 },
      value: { err: null },
    });
    for (const instruction of c.program.idl.instructions) {
      await c.send(
        new Transaction().add(
          new TransactionInstruction({
            programId: c.program.programId,
            keys: [],
            data: Buffer.from(instruction.discriminator),
          }),
        ),
      );
    }
  });
  it("rejects an unknown program discriminator before signing or RPC submission", async () => {
    const { c, progress } = transport();
    try {
      await c.send(
        new Transaction().add(
          new TransactionInstruction({
            programId: c.program.programId,
            keys: [],
            data: Buffer.alloc(8),
          }),
        ),
      );
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("outside the source-generated");
    }
    expect(progress).length(0);
  });
  it("keeps preflight enabled and waits for a returned signature before pending", async () => {
    const { c, progress } = transport();
    c.rpc.sendRawTransaction = async (_tx, options) => {
      expect(options?.skipPreflight).eq(false);
      expect(options?.preflightCommitment).eq("confirmed");
      expect(progress.map((p) => p.phase)).deep.eq([
        "awaiting-signature",
        "submitting",
      ]);
      return utils.bytes.bs58.encode(Transaction.from(_tx).signature!);
    };
    c.rpc.confirmTransaction = async () => ({
      context: { slot: 7 },
      value: { err: null },
    });
    await c.send(new Transaction());
    expect(progress.map((p) => p.phase)).deep.eq([
      "awaiting-signature",
      "submitting",
      "pending",
      "confirmed",
    ]);
  });
  it("simulation rejection has program logs/code and no Explorer signature", async () => {
    const { c, progress } = transport();
    c.rpc.sendRawTransaction = async () => {
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage: "unit test",
        logs,
      });
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(e).instanceOf(SimulationRejection);
      expect(e).not.instanceOf(ProtocolRejection);
      expect((e as SimulationRejection).code).eq("AncestorRevoked");
      expect((e as SimulationRejection).signature).eq(undefined);
    }
    expect(
      progress.some((p) => p.phase === "pending" || p.phase === "confirmed"),
    ).eq(false);
  });
  it("wallet refusal does not contact send RPC", async () => {
    const { c, progress } = transport();
    c.wallet!.signTransaction = async () => {
      throw Error("Wallet approval rejected");
    };
    c.rpc.sendRawTransaction = async () => {
      throw Error("send must not run");
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("Wallet approval rejected");
    }
    expect(progress.map((p) => p.phase)).deep.eq(["awaiting-signature"]);
  });
  it("confirmed failure preserves returned signature, slot, fee and exact program error", async () => {
    const { c, progress } = transport();

    c.rpc.confirmTransaction = async () => ({
      context: { slot: 8 },
      value: { err: { InstructionError: [0, { Custom: 6003 }] } },
    });
    c.rpc.getTransaction = async () =>
      ({ slot: 8, meta: { logMessages: logs, fee: 5000 } }) as never;
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(e).instanceOf(ProtocolRejection);
      expect((e as ProtocolRejection).signature).eq(
        progress.find((p) => p.phase === "submitting")!.signature,
      );
      expect((e as ProtocolRejection).code).eq("AncestorRevoked");
      expect((e as ProtocolRejection).slot).eq(8);
      expect((e as ProtocolRejection).fee).eq(5000);
    }
  });
  it("confirmation timeout retains pending signature without confirming", async () => {
    const { c, progress } = transport();

    c.rpc.confirmTransaction = async () => {
      throw Error("timeout");
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("timeout");
    }
    expect(progress[progress.length - 1]).deep.eq({
      phase: "pending",
      signature: progress.find((p) => p.phase === "submitting")!.signature,
    });
  });
  it("retains the actual signed signature and expiry when the send response is lost", async () => {
    const { c, progress } = transport();
    let sends = 0;
    c.rpc.sendRawTransaction = async () => {
      sends++;
      throw Error("lost RPC response");
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("lost RPC response");
    }
    expect(sends).eq(1);
    const signed = progress[
      progress.length - 1
    ] as (typeof progress)[number] & { lastValidBlockHeight: number };
    expect(signed.phase).eq("submitting");
    expect(signed.signature).match(/^[1-9A-HJ-NP-Za-km-z]{80,90}$/);
    expect(signed.lastValidBlockHeight).eq(100);
  });
  it("keeps the original signed signature unresolved when RPC substitutes a signature", async () => {
    const { c, progress } = transport();
    c.rpc.sendRawTransaction = async () => "different-unit-test-signature";
    c.rpc.confirmTransaction = async () => {
      throw Error("must not confirm substituted signature");
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("different signature");
    }
    expect(progress[progress.length - 1]?.phase).eq("submitting");
    expect(progress[progress.length - 1]?.signature).not.eq(
      "different-unit-test-signature",
    );
  });
  it("rejects a wallet-modified message before RPC submission", async () => {
    const { c } = transport();
    const sign = c.wallet!.signTransaction;
    c.wallet!.signTransaction = async (tx) => {
      (tx as Transaction).recentBlockhash =
        Keypair.generate().publicKey.toBase58();
      return sign(tx);
    };
    c.rpc.sendRawTransaction = async () => {
      throw Error("must not send");
    };
    try {
      await c.send(new Transaction());
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("Wallet changed");
    }
  });
  it("journals the new organization PDA before a lost create response", async () => {
    const { c } = transport();
    const observed: { phase: string; organization?: string }[] = [];
    const client = new MandateClient(c.wallet, (p) => observed.push(p), c.rpc);
    client.verifyDeployment = async () => 1;
    c.rpc.sendRawTransaction = async () => {
      throw Error("lost RPC response");
    };
    const mint = Keypair.generate().publicKey;
    try {
      await client.createOrganization(mint);
      throw Error("expected rejection");
    } catch (e) {
      expect(String(e)).contains("lost RPC response");
    }
    expect(observed[observed.length - 1]?.phase).eq("submitting");
    expect(
      new PublicKey(observed[observed.length - 1]!.organization!).toBase58(),
    ).eq(observed[observed.length - 1]!.organization);
  });
  it("reconciles history and a confirmed receipt without signing or resending", async () => {
    const { c } = transport();
    c.wallet!.signTransaction = async () => {
      throw Error("must not sign");
    };
    c.rpc.sendRawTransaction = async () => {
      throw Error("must not send");
    };
    c.rpc.getSignatureStatuses = async (_s, options) => {
      expect(options?.searchTransactionHistory).eq(true);
      return {
        context: { slot: 8 },
        value: [
          {
            slot: 8,
            confirmations: null,
            err: null,
            confirmationStatus: "finalized",
          },
        ],
      };
    };
    c.rpc.getTransaction = async () =>
      ({ slot: 8, meta: { err: null, fee: 5000, logMessages: [] } }) as never;
    const r = await c.reconcileSubmission("unit-test-only", 100);
    expect(r.phase).eq("confirmed");
    expect("slot" in r && r.slot).eq(8);
  });
  it("reconciles the exact failed receipt and charged fee", async () => {
    const { c } = transport();
    c.rpc.getSignatureStatuses = async () => ({
      context: { slot: 8 },
      value: [
        {
          slot: 8,
          confirmations: null,
          err: { InstructionError: [0, { Custom: 6003 }] },
          confirmationStatus: "finalized",
        },
      ],
    });
    c.rpc.getTransaction = async () =>
      ({
        slot: 8,
        meta: {
          err: { InstructionError: [0, { Custom: 6003 }] },
          fee: 10000,
          logMessages: logs,
        },
      }) as never;
    const r = await c.reconcileSubmission("unit-test-only", 100);
    expect(r.phase).eq("failed");
    expect("fee" in r && r.fee).eq(10000);
    expect("logs" in r && r.logs).deep.eq(logs);
  });
  it("keeps a still-valid absent signature unresolved", async () => {
    const { c } = transport();
    c.rpc.getSignatureStatuses = async () => ({
      context: { slot: 8 },
      value: [null],
    });
    c.rpc.getBlockHeight = async (commitment) => {
      expect(commitment).eq("finalized");
      return 100;
    };
    c.rpc.getTransaction = async () => {
      throw Error("not expired");
    };
    expect((await c.reconcileSubmission("unit-test-only", 100)).phase).eq(
      "unknown",
    );
  });
  it("requires finalized expiry and absent receipt before resolving an expired intent", async () => {
    const { c } = transport();
    c.rpc.getSignatureStatuses = async () => ({
      context: { slot: 8 },
      value: [null],
    });
    c.rpc.getBlockHeight = async () => 101;
    c.rpc.getTransaction = async (_s, options) => {
      expect(options?.commitment).eq("finalized");
      return null;
    };
    expect((await c.reconcileSubmission("unit-test-only", 100)).phase).eq(
      "expired",
    );
  });
});
