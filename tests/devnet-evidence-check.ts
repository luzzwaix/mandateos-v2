import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { DEVNET_GENESIS } from "../web/src/lib/solana/program";
import {
  EvidenceTransport,
  retryAfter,
  requireAncestorFailure,
} from "./devnet-evidence";

const error = { InstructionError: [0, { Custom: 6003 }] };
const logs = [
  "Program log: AnchorError thrown in programs/mandateos/src/validation.rs:124. Error Code: AncestorRevoked. Error Number: 6003. Error Message: An ancestor is revoked.",
];
function fixture(
  simulationError: unknown = null,
  receiptError: unknown = null,
) {
  const transport = new EvidenceTransport(
    mkdtempSync(join(tmpdir(), "mandate-evidence-")),
    0,
  );
  const payer = Keypair.generate();
  let sends = 0,
    simulations = 0;
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: PublicKey.default,
      lamports: 1,
    }),
  );
  Object.assign(transport.connection, {
    getGenesisHash: async () => DEVNET_GENESIS,
    getLatestBlockhash: async () => ({
      blockhash: PublicKey.default.toBase58(),
      lastValidBlockHeight: 100,
    }),
    getFeeForMessage: async () => ({ context: { slot: 1 }, value: 5000 }),
    getBalance: async () => 1_000_000,
    getMinimumBalanceForRentExemption: async () => 650_240,
    simulateTransaction: async (signed: any, config: any) => {
      simulations++;
      assert.equal(config.sigVerify, true);
      assert.equal(config.replaceRecentBlockhash, false);
      assert.equal(signed.signatures.length, 1);
      return {
        context: { slot: 2 },
        value: { err: simulationError, logs: simulationError ? logs : [] },
      };
    },
    getSignatureStatuses: async () => ({
      context: { slot: 3 },
      value: [{ confirmationStatus: "finalized", err: receiptError, slot: 3 }],
    }),
    getTransaction: async () => ({
      slot: 3,
      meta: {
        err: receiptError,
        fee: 5000,
        logMessages: receiptError ? logs : [],
      },
    }),
    sendRawTransaction: async () => {
      sends++;
      throw Error("Unexpected send in finalized fixture");
    },
  });
  return {
    transport,
    payer,
    tx,
    sends: () => sends,
    simulations: () => simulations,
  };
}
describe("Durable Devnet evidence and recovery (no-network stubs)", () => {
  it("accepts only the exact expected ancestor error and logs", () => {
    requireAncestorFailure({ err: error, logs });
    assert.throws(() =>
      requireAncestorFailure({
        err: { InstructionError: [0, { Custom: 6004 }] },
        logs,
      }),
    );
    assert.throws(() => requireAncestorFailure({ err: error, logs: [] }));
  });
  it("honors Retry-After seconds/date and rejects a wrong genesis before signing", async () => {
    assert.equal(retryAfter("1.25"), 1250);
    assert.equal(retryAfter("Thu, 01 Jan 1970 00:00:10 GMT", 9000), 1000);
    const f = fixture();
    Object.assign(f.transport.connection, {
      getGenesisHash: async () => "wrong",
    });
    await assert.rejects(f.transport.execute("wrong", f.tx, [f.payer]));
    assert.equal(f.transport.entries.wrong, undefined);
  });
  it("saves signed simulation rejection before asserting and never submits it by default", async () => {
    const f = fixture(error);
    await assert.rejects(f.transport.execute("rejected", f.tx, [f.payer]));
    assert.deepEqual(f.transport.entries.rejected.simulation.value.err, error);
    assert(f.transport.entries.rejected.signature);
    assert.equal(f.sends(), 0);
    assert.equal(f.transport.entries.rejected.signingIntents, 1);
  });
  it("saves unexpected finalized failure receipt before asserting", async () => {
    const f = fixture(null, error);
    await assert.rejects(f.transport.execute("failed", f.tx, [f.payer]));
    assert.deepEqual(f.transport.entries.failed.receipt.meta.err, error);
    assert.equal(f.transport.entries.failed.verified, undefined);
  });
  it("recovers finalized signature without simulating or signing again", async () => {
    const f = fixture();
    await f.transport.execute("recovery", f.tx, [f.payer]);
    const signature = f.transport.entries.recovery.signature;
    await f.transport.execute("recovery", new Transaction(), [f.payer]);
    assert.equal(f.transport.entries.recovery.signature, signature);
    assert.equal(f.simulations(), 1);
    assert.equal(f.sends(), 0);
  });
  it("requires saved 6003 simulation and matching finalized failure for diagnostic exception", async () => {
    const f = fixture(error, error);
    await f.transport.execute("included-failure", f.tx, [f.payer], true);
    assert.equal(f.transport.entries["included-failure"].verified, true);
    assert.equal(
      f.transport.entries["included-failure"].receipt.meta.fee,
      5000,
    );
  });
  it("stops expired absent signature before forwarding or creating another signature", async () => {
    const f = fixture();
    Object.assign(f.transport.connection, {
      getSignatureStatuses: async () => ({
        context: { slot: 200 },
        value: [null],
      }),
      getBlockHeight: async () => 101,
    });
    await assert.rejects(
      f.transport.execute("expired", f.tx, [f.payer]),
      /reconcile account state/,
    );
    assert.equal(f.sends(), 0);
    assert.equal(f.transport.entries.expired.signingIntents, 1);
    assert.equal(f.transport.entries.expired.phase, "expired-unresolved");
  });
});
