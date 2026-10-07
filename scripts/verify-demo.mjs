// Read-only verification of the completed Capital Cascade + Arena browser demo.
// Usage: node scripts/verify-demo.mjs [public-program-id] [public-org-pda]
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AnchorProvider, Program, AnchorError } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token";
const idl = JSON.parse(
  readFileSync(
    new URL("../packages/sdk/src/mandateos.json", import.meta.url),
    "utf8",
  ),
);
if (process.argv[2]) idl.address = new PublicKey(process.argv[2]).toBase58();
const rpc = new Connection("http://127.0.0.1:8899", "confirmed");
const program = new Program(
  idl,
  new AnchorProvider(
    rpc,
    {
      publicKey: PublicKey.default,
      signTransaction: async () => {
        throw new Error("Read only");
      },
      signAllTransactions: async () => {
        throw new Error("Read only");
      },
    },
    { commitment: "confirmed" },
  ),
);
const organizations = await program.account.organization.all();
const row = process.argv[3]
  ? organizations.find((r) =>
      r.publicKey.equals(new PublicKey(process.argv[3])),
    )
  : organizations.find(
      (r) =>
        r.account.totalFunded.toString() === "1000000000" &&
        r.account.totalReclaimed.toString() === "965000000",
    );
assert(
  row,
  "Complete the browser Cascade, 25-token Arena payout and 965-token reclaim first",
);
const org = row.account;
const root = await program.account.mandate.fetch(org.rootMandate);
const bounties = await program.account.bounty.all([
  { memcmp: { offset: 8, bytes: row.publicKey.toBase58() } },
]);
assert.equal(bounties.length, 1);
const bounty = bounties[0];
assert(bounty.account.status.settled);
assert.equal(bounty.account.submissionCount, 2);
assert.equal(bounty.account.reward.toString(), "25000000");
const submissions = await program.account.submission.all([
  { memcmp: { offset: 8, bytes: bounty.publicKey.toBase58() } },
]);
assert.equal(submissions.length, 2);
assert(submissions.some((s) => s.account.agent.equals(bounty.account.winner)));
assert.equal(
  (
    await getAccount(
      rpc,
      getAssociatedTokenAddressSync(org.mint, bounty.account.winner),
    )
  ).amount,
  25000000n,
);
assert.equal(org.totalSpent.toString(), "35000000");
assert.equal(org.totalReclaimed.toString(), "965000000");
assert.equal(root.selfAvailable.toString(), "0");
assert.equal(root.subtreeRemaining.toString(), "0");
assert.equal((await getAccount(rpc, org.vault)).amount, 0n);
assert.equal(
  (
    await getAccount(
      rpc,
      getAssociatedTokenAddressSync(org.mint, org.authority),
    )
  ).amount,
  965000000n,
);
const observed = (
  await Promise.all(
    [row.publicKey, bounty.publicKey].map((key) =>
      rpc.getSignaturesForAddress(key, { limit: 30 }),
    ),
  )
).flat();
const signatures = [
  ...new Map(observed.map((s) => [s.signature, s])).values(),
].sort((a, b) => b.slot - a.slot);
const transactions = await Promise.all(
  signatures.map(async (s) => ({
    signature: s.signature,
    slot: s.slot,
    tx: await rpc.getTransaction(s.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    }),
  })),
);
const rejected = transactions.find(
  (r) =>
    r.tx?.meta?.err &&
    AnchorError.parse(r.tx.meta.logMessages ?? [])?.error.errorCode.code ===
      "AncestorRevoked",
);
assert(rejected, "A genuine ledger-rejected descendant spend is required");
const proof = {
  network: "LOCALNET",
  program: idl.address,
  organization: row.publicKey.toBase58(),
  winner: bounty.account.winner.toBase58(),
  funded: 1000,
  spent: 35,
  reclaimed: 965,
  vault: 0,
  winnerPayout: 25,
  submissions: 2,
  rejectedPayment: rejected.signature,
  confirmedTransactions: transactions.map(({ signature, slot, tx }) => ({
    signature,
    slot,
    error: tx?.meta?.err ?? null,
  })),
};
console.log(JSON.stringify(proof, null, 2));
