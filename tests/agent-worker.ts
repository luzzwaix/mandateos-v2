import { expect } from "chai";
import { BN, BorshInstructionCoder, utils } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  SendTransactionError,
  Transaction,
} from "@solana/web3.js";
import {
  MandateClient,
  PROGRAM_ADDRESS,
  type SigningWallet,
  type Snapshot,
} from "@mandateos/sdk";
import {
  inspectWork,
  runAuthorizedSpend,
} from "../examples/agent-worker/src/worker";
import { authorityFixture } from "./helpers/sdk-fixture";

const logs = [
  "Program log: AnchorError occurred. Error Code: AncestorRevoked. Error Number: 6003. Error Message: An ancestor is revoked.",
];
function fixture() {
  const snapshot = authorityFixture(),
    signer = Keypair.generate();
  snapshot.nodes.forEach((row) => (row.account.controller = signer.publicKey));
  let reads = 0,
    signatures = 0,
    sends = 0;
  const transactions: Transaction[] = [];
  const wallet: SigningWallet = {
    publicKey: signer.publicKey,
    async signTransaction(tx) {
      signatures++;
      if (tx instanceof Transaction) tx.partialSign(signer);
      else tx.sign([signer]);
      return tx;
    },
    async signAllTransactions(txs) {
      return Promise.all(txs.map((tx) => this.signTransaction(tx)));
    },
  };
  const config = {
    cluster: "devnet" as const,
    rpcUrl: "https://api.devnet.solana.com",
    programId: PROGRAM_ADDRESS,
  };
  const rpc = new Connection(config.rpcUrl);
  rpc.getLatestBlockhash = async () => ({
    blockhash: Keypair.generate().publicKey.toBase58(),
    lastValidBlockHeight: 82,
  });
  rpc.sendRawTransaction = async (wire) => {
    sends++;
    const tx = Transaction.from(wire);
    transactions.push(tx);
    return utils.bytes.bs58.encode(tx.signature!);
  };
  rpc.confirmTransaction = async () => ({
    context: { slot: 48 },
    value: { err: null },
  });
  const client = new MandateClient(config, wallet, undefined, rpc);
  client.verifyDeployment = async () => 1;
  client.load = async () => {
    reads++;
    return snapshot;
  };
  const job = {
    organization: snapshot.address,
    mandate: snapshot.nodes[3].publicKey,
    destination: Keypair.generate().publicKey,
    amount: new BN(10),
  };
  return {
    client,
    snapshot,
    rpc,
    job,
    transactions,
    counts: () => ({ reads, signatures, sends }),
  };
}
function revokeResearch(snapshot: Snapshot) {
  snapshot.nodes[1].account.status = { revoked: {} };
  snapshot.nodes[1].account.selfAvailable = new BN(0);
  snapshot.nodes[1].account.subtreeRemaining = new BN(0);
}
describe("Reference worker uses the SDK (RPC stubs)", () => {
  it("inspects complete real-account-shaped ancestry without signing", async () => {
    const f = fixture();
    const result = await inspectWork(
      f.client,
      f.job.organization,
      f.job.mandate,
    );
    expect(result.authority.effective).eq("active");
    expect(result.authority.path).length(4);
    expect(f.counts()).deep.eq({ reads: 1, signatures: 0, sends: 0 });
  });
  it("stops locally Active Scraper under revoked Research before signing", async () => {
    const f = fixture();
    revokeResearch(f.snapshot);
    const result = await runAuthorizedSpend(f.client, f.job);
    expect(result.kind).eq("authority-unavailable");
    if (result.kind === "authority-unavailable") {
      expect(result.authority.local).eq("active");
      expect(result.authority.effective).eq("blocked");
      expect(
        result.authority.blockingAncestor?.equals(
          f.snapshot.nodes[1].publicKey,
        ),
      ).eq(true);
    }
    expect(f.counts()).deep.eq({ reads: 1, signatures: 0, sends: 0 });
  });
  it("executes the SDK spend builder once and refetches after confirmation", async () => {
    const f = fixture();
    const result = await runAuthorizedSpend(f.client, f.job);
    expect(result.kind).eq("attempted");
    if (result.kind === "attempted") {
      expect(result.outcome.kind).eq("confirmed-success");
      expect(result.authorityAfter?.effective).eq("active");
    }
    expect(f.counts()).deep.eq({ reads: 2, signatures: 1, sends: 1 });
    const instruction = f.transactions[0].instructions[0];
    const decoded = (
      f.client.program.coder.instruction as BorshInstructionCoder
    ).decode(instruction.data);
    expect(decoded?.name).eq("spend");
    expect((decoded?.data as { amount: BN }).amount.toString()).eq("10");
    expect(
      instruction.keys
        .slice(-3)
        .map((m) => [m.pubkey.toBase58(), m.isWritable]),
    ).deep.eq(
      f.snapshot.nodes
        .slice(0, 3)
        .reverse()
        .map((n) => [n.publicKey.toBase58(), true]),
    );
  });
  it("retains preflight-only 6003 and reads revoked ancestry after a race", async () => {
    const f = fixture();
    let attempts = 0;
    f.rpc.sendRawTransaction = async () => {
      attempts++;
      revokeResearch(f.snapshot);
      throw new SendTransactionError({
        action: "simulate",
        signature: "",
        transactionMessage: "revoked",
        logs,
      });
    };
    const result = await runAuthorizedSpend(f.client, f.job);
    expect(result.kind).eq("attempted");
    if (result.kind === "attempted") {
      expect(result.outcome.kind).eq("simulation-rejection");
      expect(result.outcome).not.property("signature");
      expect(result.authorityAfter?.effective).eq("blocked");
    }
    expect(attempts).eq(1);
    expect(f.counts().reads).eq(2);
  });
  it("preserves a confirmed on-chain denial separately from preflight", async () => {
    const f = fixture();
    f.rpc.confirmTransaction = async () => {
      revokeResearch(f.snapshot);
      return {
        context: { slot: 48 },
        value: { err: { InstructionError: [0, { Custom: 6003 }] } },
      };
    };
    f.rpc.getTransaction = async () =>
      ({ slot: 48, meta: { fee: 5000, logMessages: logs } }) as never;
    const result = await runAuthorizedSpend(f.client, f.job);
    if (result.kind !== "attempted") throw Error("expected an attempt");
    expect(result.outcome.kind).eq("on-chain-failure");
    expect(result.outcome).property("signature");
    expect(result.authorityAfter?.effective).eq("blocked");
    expect(f.counts().reads).eq(2);
  });
  it("never retries an unknown submission and retains its original identity", async () => {
    const f = fixture();
    let attempts = 0;
    f.rpc.sendRawTransaction = async () => {
      attempts++;
      throw Error("delivery unknown");
    };
    const result = await runAuthorizedSpend(f.client, f.job);
    if (result.kind !== "attempted") throw Error("expected an attempt");
    expect(result.outcome.kind).eq("unknown");
    expect(result.outcome).property("signature");
    expect(attempts).eq(1);
    expect(f.counts().reads).eq(1);
  });
  it("does not erase confirmed success when authoritative refetch fails", async () => {
    const f = fixture();
    let loads = 0;
    f.client.load = async () => {
      if (++loads > 1) throw Error("refetch unavailable");
      return f.snapshot;
    };
    const result = await runAuthorizedSpend(f.client, f.job);
    if (result.kind !== "attempted") throw Error("expected an attempt");
    expect(result.outcome.kind).eq("confirmed-success");
    expect(result.refreshError).eq("refetch unavailable");
    expect(f.counts().sends).eq(1);
  });
  for (const reason of ["controller", "amount", "vault"] as const) {
    it(`rejects invalid ${reason} before signing`, async () => {
      const f = fixture();
      if (reason === "controller")
        f.snapshot.nodes[3].account.controller = Keypair.generate().publicKey;
      if (reason === "amount") f.job.amount = new BN(101);
      if (reason === "vault") f.job.destination = f.snapshot.organization.vault;
      expect((await runAuthorizedSpend(f.client, f.job)).kind).eq(
        "prerequisite-rejection",
      );
      expect(f.counts()).deep.eq({ reads: 1, signatures: 0, sends: 0 });
    });
  }
});
