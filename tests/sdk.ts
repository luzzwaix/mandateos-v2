import { authorityFixture } from "./helpers/sdk-fixture";
import { expect } from "chai";
import { BN, utils, BorshInstructionCoder } from "@coral-xyz/anchor";
import { MintLayout, AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
} from "@solana/web3.js";
import {
  MandateClient,
  PROGRAM_ADDRESS,
  inspectAuthority,
  interpretProtocolError,
  explorer,
  toBaseUnits,
  isWalletRejection,
  rootPda,
  childPda,
  type Snapshot,
  type SigningWallet,
  type ClientConfig,
} from "../packages/sdk/src";

const config: ClientConfig = {
  cluster: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  programId: PROGRAM_ADDRESS,
};
const key = () => Keypair.generate().publicKey;
const ancestorLogs = [
  "Program log: AnchorError occurred. Error Code: AncestorRevoked. Error Number: 6003. Error Message: An ancestor is revoked.",
];

function transport(walletOverride?: SigningWallet) {
  const signer = Keypair.generate();
  const wallet: SigningWallet = walletOverride ?? {
    publicKey: signer.publicKey,
    async signTransaction(tx) {
      if (tx instanceof Transaction) tx.partialSign(signer);
      else tx.sign([signer]);
      return tx;
    },
    async signAllTransactions(txs) {
      return Promise.all(txs.map((tx) => this.signTransaction(tx)));
    },
  };
  const rpc = new Connection(config.rpcUrl);
  rpc.getLatestBlockhash = async () => ({
    blockhash: key().toBase58(),
    lastValidBlockHeight: 91,
  });
  let sends = 0;
  rpc.sendRawTransaction = async (wire) => {
    sends++;
    return utils.bytes.bs58.encode(Transaction.from(wire).signature!);
  };
  rpc.confirmTransaction = async () => ({
    context: { slot: 42 },
    value: { err: null },
  });
  const client = new MandateClient(config, wallet, undefined, rpc);
  client.verifyDeployment = async () => 1;
  return { client, rpc, wallet, sends: () => sends };
}
describe("SDK explicit configuration and effective authority", () => {
  it("does not mislabel transport and signing exceptions as user declines", () => {
    expect(isWalletRejection({ code: 4001 })).eq(true);
    for (const error of [
      null,
      "declined",
      new Error("signing failed"),
      { code: "4001" },
      { code: -32603 },
    ])
      expect(isWalletRejection(error)).eq(false);
  });
  async function batchFixture(
    vaultOwner?: PublicKey,
    tokenProgram = TOKEN_PROGRAM_ID,
  ) {
    const f = transport(),
      snapshot = authorityFixture();
    const data = await f.client.program.coder.accounts.encode("organization", {
      ...snapshot.organization,
      bump: 0,
      vaultBump: 0,
    });
    f.rpc.getAccountInfo = async () => ({
      data,
      owner: new PublicKey(PROGRAM_ADDRESS),
      executable: false,
      lamports: 1,
      rentEpoch: 0,
    });
    const accounts = f.client.program.account as unknown as {
      mandate: { all: () => Promise<unknown[]> };
      bounty: { all: () => Promise<unknown[]> };
    };
    accounts.mandate.all = async () => snapshot.nodes;
    accounts.bounty.all = async () => [];
    let reads = 0;
    f.rpc.getMultipleAccountsInfo = async (keys) => {
      expect(keys.map((k) => k.toBase58())).deep.eq([
        snapshot.organization.mint.toBase58(),
        snapshot.organization.vault.toBase58(),
      ]);
      reads++;
      const mint = Buffer.alloc(MintLayout.span),
        vault = Buffer.alloc(AccountLayout.span);
      MintLayout.encode(
        {
          mintAuthorityOption: 0,
          mintAuthority: PublicKey.default,
          supply: 500n,
          decimals: 6,
          isInitialized: true,
          freezeAuthorityOption: 0,
          freezeAuthority: PublicKey.default,
        },
        mint,
      );
      AccountLayout.encode(
        {
          mint: snapshot.organization.mint,
          owner: vaultOwner ?? snapshot.address,
          amount: 500n,
          delegateOption: 0,
          delegate: PublicKey.default,
          state: 1,
          isNativeOption: 0,
          isNative: 0n,
          delegatedAmount: 0n,
          closeAuthorityOption: 0,
          closeAuthority: PublicKey.default,
        },
        vault,
      );
      return [mint, vault].map((data) => ({
        data,
        owner: tokenProgram,
        executable: false,
        lamports: 1,
        rentEpoch: 0,
      }));
    };
    return { ...f, snapshot, reads: () => reads };
  }
  it("loads mint and vault together with exact SPL decoding and truthful read phases", async () => {
    const f = await batchFixture(),
      phases: string[] = [];
    const result = await f.client.load(f.snapshot.address, undefined, (phase) =>
      phases.push(phase),
    );
    expect(f.reads()).eq(1);
    expect(result.decimals).eq(6);
    expect(result.vaultBalance).eq(500n);
    expect(phases).deep.eq([
      "deployment",
      "organization",
      "accounts",
      "submissions",
    ]);
  });
  it("rejects a batch vault controlled by another organization", async () => {
    const f = await batchFixture(key());
    try {
      await f.client.load(f.snapshot.address);
      throw Error("expected rejection");
    } catch (error) {
      expect(String(error)).contains("vault mint or authority mismatch");
    }
  });
  it("retains classic SPL owner validation for batched token accounts", async () => {
    const f = await batchFixture(undefined, key());
    try {
      await f.client.load(f.snapshot.address);
      throw Error("expected rejection");
    } catch (error) {
      expect(String(error)).contains("TokenInvalidAccountOwnerError");
    }
  });
  it("checks organization ownership before decoding or reading its mandates", async () => {
    const f = transport(),
      address = key();
    let accountReads = 0;
    f.rpc.getAccountInfo = async () => {
      accountReads++;
      return {
        data: Buffer.alloc(0),
        owner: key(),
        executable: false,
        lamports: 1,
        rentEpoch: 0,
      };
    };
    try {
      await f.client.load(address);
      throw Error("expected ownership rejection");
    } catch (error) {
      expect(String(error)).contains("not owned by the configured program");
    }
    expect(accountReads).eq(1);
  });
  it("rejects a wrong discriminator even under the configured program owner", async () => {
    const f = transport();
    f.rpc.getAccountInfo = async () => ({
      data: Buffer.alloc(100),
      owner: new PublicKey(PROGRAM_ADDRESS),
      executable: false,
      lamports: 1,
      rentEpoch: 0,
    });
    try {
      await f.client.load(key());
      throw Error("expected discriminator rejection");
    } catch (error) {
      expect(String(error)).contains("discriminator");
    }
  });
  it("rejects unsupported cluster and a different program before any RPC", () => {
    expect(
      () =>
        new MandateClient({
          ...config,
          cluster: "mainnet-beta",
        } as unknown as ClientConfig),
    ).throws("Devnet only");
    expect(() => new MandateClient({ ...config, programId: key() })).throws(
      "source-generated IDL",
    );
    expect(
      () => new MandateClient({ ...config, rpcUrl: "file:///tmp/rpc" }),
    ).throws("HTTP(S)");
  });
  it("derives the whole Root-to-Scraper path without mutation", () => {
    const s = authorityFixture(),
      before = JSON.stringify(s, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      );
    const result = inspectAuthority(s, s.nodes[3].publicKey);
    expect(result.effective).eq("active");
    expect(result.path.map((n) => n.account.depth)).deep.eq([0, 1, 2, 3]);
    expect(
      JSON.stringify(s, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ).eq(before);
  });
  it("keeps stored-active descendants blocked after ancestor revoke and sibling active", () => {
    const s = authorityFixture();
    s.nodes[1].account.status = { revoked: {} };
    s.nodes[1].account.selfAvailable = new BN(0);
    s.nodes[1].account.subtreeRemaining = new BN(0);
    const result = inspectAuthority(s, s.nodes[3].publicKey);
    expect(result.local).eq("active");
    expect(result.effective).eq("blocked");
    expect(result.blockingAncestor?.equals(s.nodes[1].publicKey)).eq(true);
    expect(inspectAuthority(s, s.nodes[1].publicKey).effective).eq("revoked");
    expect(inspectAuthority(s, s.nodes[4].publicKey).effective).eq("active");
  });
  for (const corruption of [
    "missing",
    "cycle",
    "foreign",
    "depth",
    "root",
    "duplicate",
    "status",
    "root-parent",
  ] as const) {
    it(`never declares malformed ancestry active: ${corruption}`, () => {
      const s = authorityFixture(),
        target = s.nodes[3].publicKey;
      if (corruption === "missing") s.nodes.splice(1, 1);
      if (corruption === "cycle") s.nodes[2].account.parent = target;
      if (corruption === "foreign") s.nodes[1].account.organization = key();
      if (corruption === "depth") s.nodes[2].account.depth = 1;
      if (corruption === "root") s.organization.rootMandate = key();
      if (corruption === "duplicate") s.nodes.push(s.nodes[1]);
      if (corruption === "status") s.nodes[1].account.status = {};
      if (corruption === "root-parent") s.nodes[0].account.parent = key();
      expect(inspectAuthority(s, target).effective).eq("unknown");
    });
  }
  it("converts exact token units, rejects precision/zero/u64 overflow, links Devnet", () => {
    expect(toBaseUnits("12.000001", 6).toString()).eq("12000001");
    for (const value of ["0", "1.0000001", "18446744073709.551616"])
      expect(() => toBaseUnits(value, 6)).throws();
    expect(explorer("signature", config)).eq(
      "https://explorer.solana.com/tx/signature?cluster=devnet",
    );
  });
});
describe("SDK reuses the source ABI and complete ancestor metas", () => {
  it("builds delegate/spend/revoke/reclaim with actual IDL and writable spend ancestry", async () => {
    const { client } = transport(),
      s = authorityFixture(),
      txs: Transaction[] = [];
    client.send = async (tx) => {
      txs.push(tx);
      return "unit-only";
    };
    const amount = new BN("9007199254740993"),
      destination = key();
    await client.delegate(s, s.nodes[2], key(), amount);
    await client.spend(s, s.nodes[3], amount, destination);
    await client.revoke(s, s.nodes[1]);
    await client.reclaim(s, amount, destination);
    expect(txs).length(4);
    const decoded = txs.map((tx) =>
      (client.program.coder.instruction as BorshInstructionCoder).decode(
        tx.instructions[0].data,
      ),
    );
    expect(decoded.map((d) => d?.name)).deep.eq([
      "delegate",
      "spend",
      "revokeBranch",
      "reclaim",
    ]);
    expect((decoded[1]?.data as { amount: BN }).amount.eq(amount)).eq(true);
    expect(
      txs[0].instructions[0].keys
        .slice(-2)
        .map((m) => [m.pubkey.toBase58(), m.isWritable]),
    ).deep.eq(
      s.nodes
        .slice(0, 2)
        .reverse()
        .map((n) => [n.publicKey.toBase58(), false]),
    );
    expect(
      txs[1].instructions[0].keys
        .slice(-3)
        .map((m) => [m.pubkey.toBase58(), m.isWritable]),
    ).deep.eq(
      s.nodes
        .slice(0, 3)
        .reverse()
        .map((n) => [n.publicKey.toBase58(), true]),
    );
    expect(
      txs[2].instructions[0].keys.find((m) =>
        m.pubkey.equals(s.nodes[1].publicKey),
      )?.isWritable,
    ).eq(true);
    expect(
      txs[3].instructions[0].keys.some((m) =>
        m.pubkey.equals(s.organization.rootMandate),
      ),
    ).eq(true);
  });
});
describe("SDK transaction evidence (RPC stubs, never chain evidence)", () => {
  it("returns confirmed success only after confirmation", async () => {
    const f = transport();
    const result = await f.client.transact((c) => c.send(new Transaction()));
    expect(result.kind).eq("confirmed-success");
    if (result.kind === "confirmed-success") {
      expect(result.slot).eq(42);
      expect(result.signature).eq(result.value);
    }
    expect(f.sends()).eq(1);
  });
  it("does not label an action that never submitted as a confirmed transaction", async () => {
    const f = transport();
    expect((await f.client.transact(async () => "no transaction")).kind).eq(
      "client-rejection",
    );
    expect(f.sends()).eq(0);
  });
  it("preserves simulation 6003 logs without signature or Explorer evidence", async () => {
    const f = transport();
    f.rpc.sendRawTransaction = async () => {
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage: "denied",
        logs: ancestorLogs,
      });
    };
    const result = await f.client.transact((c) => c.send(new Transaction()));
    expect(result.kind).eq("simulation-rejection");
    expect(result).not.property("signature");
    if (result.kind === "simulation-rejection")
      expect(result.protocol?.number).eq(6003);
  });
  it("never invents 6003 from a message, numeric property or mismatched IDL code", () => {
    expect(
      interpretProtocolError({ message: "6003 AncestorRevoked", code: 6003 }),
    ).eq(undefined);
    expect(
      interpretProtocolError({
        logs: ancestorLogs.map((l) => l.replace("6003", "6004")),
      }),
    ).eq(undefined);
  });
  it("returns a wallet rejection without sending", async () => {
    const wallet: SigningWallet = {
      publicKey: key(),
      signTransaction: async () => {
        throw Object.assign(new Error("refused"), { code: 4001 });
      },
      signAllTransactions: async () => {
        throw Error("unused");
      },
    };
    const f = transport(wallet);
    expect((await f.client.transact((c) => c.send(new Transaction()))).kind).eq(
      "wallet-rejection",
    );
    expect(f.sends()).eq(0);
  });
  it("distinguishes a confirmed on-chain failure with signed identity and logs", async () => {
    const f = transport();
    f.rpc.confirmTransaction = async () => ({
      context: { slot: 42 },
      value: { err: { InstructionError: [0, { Custom: 6003 }] } },
    });
    f.rpc.getTransaction = async () =>
      ({ slot: 42, meta: { fee: 5000, logMessages: ancestorLogs } }) as never;
    const result = await f.client.transact((c) => c.send(new Transaction()));
    expect(result.kind).eq("on-chain-failure");
    if (result.kind === "on-chain-failure") {
      expect(result.signature).length.greaterThan(64);
      expect(result.fee).eq(5000);
      expect(result.protocol?.number).eq(6003);
    }
  });
  for (const stage of ["send", "confirm", "mismatched-signature"] as const) {
    it(`retains unknown ${stage} outcome without replaying any submission`, async () => {
      const f = transport();
      let attempts = 0;
      const send = f.rpc.sendRawTransaction;
      f.rpc.sendRawTransaction = async (...args) => {
        attempts++;
        if (stage === "send") throw Error("connection lost");
        return stage === "mismatched-signature"
          ? "wrong"
          : send.apply(f.rpc, args);
      };
      if (stage === "confirm")
        f.rpc.confirmTransaction = async () => {
          throw Error("timeout");
        };
      const result = await f.client.transact((c) => c.send(new Transaction()));
      expect(result.kind).eq("unknown");
      expect(attempts).eq(1);
      if (result.kind === "unknown") {
        expect(result.lastValidBlockHeight).eq(91);
        expect(result.signature).length.greaterThan(64);
      }
    });
  }
});
