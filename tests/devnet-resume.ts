import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { MandateClient } from "../web/src/lib/solana/client";
import { PROGRAM_ADDRESS } from "../web/src/lib/solana/program";
import { bountyPda, submissionPda } from "../web/src/lib/solana/pdas";
import { fromSnapshot, statusOf } from "../web/src/lib/authority";
import { EvidenceTransport, requireAncestorFailure } from "./devnet-evidence";

const PAYER = "3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm";
const ORG = new PublicKey("EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A");
const ROOT = "8NwP1XmiQbb7gKEQLuyLSNC9Q6FVuF4NgwbfdBVKE2DQ";
const SCRAPER = "H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB";
const OPERATIONS = "HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21";
const SOURCE_MINT = "6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9";
const directory = resolve("artifacts/devnet-release/mvp-continuation");
const transport = new EvidenceTransport(directory);
const c = new MandateClient(undefined, undefined, transport.connection);
const u = (n: number) => new BN(n).mul(new BN(1_000_000));
const loadPair = (path: string, expected?: string) => {
  const root = resolve(process.env.LOCALAPPDATA!, "MandateOS/devnet-private");
  const child = relative(root, resolve(path));
  assert(
    child && !child.startsWith("..") && !isAbsolute(child),
    "Signer must remain in external private directory",
  );
  const pair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(path, "utf8"))),
  );
  if (expected) assert.equal(pair.publicKey.toBase58(), expected);
  return pair;
};
async function main() {
  const mode = process.argv.includes("--arena") ? "arena" : "core";
  await c.verifyDeployment();
  let s = await c.load(ORG);
  assert.equal(PROGRAM_ADDRESS, "125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd");
  assert.equal(s.organization.authority.toBase58(), PAYER);
  assert.equal(s.organization.mint.toBase58(), SOURCE_MINT);
  if (process.argv.includes("--check")) {
    const proof = JSON.parse(
      readFileSync("docs/devnet-mvp-proof.json", "utf8"),
    );
    assert.equal(proof.program, PROGRAM_ADDRESS);
    const intents: [
      string,
      { signature: string; expectedAncestorFailure: boolean },
    ][] = proof.transactions.map((row: { step: string; signature: string }) => [
      row.step,
      {
        signature: row.signature,
        expectedAncestorFailure: row.step === "blocked-descendant",
      },
    ]);
    const statuses = await transport.connection.getSignatureStatuses(
      intents.map(([, e]) => e.signature),
      { searchTransactionHistory: true },
    );
    transport.save("read-only-statuses", {
      statuses,
      noSignerRead: true,
      noSigning: true,
      noSubmission: true,
    });
    for (let i = 0; i < intents.length; i++) {
      const [step, entry] = intents[i];
      const receipt = await transport.connection.getTransaction(
        entry.signature,
        { commitment: "finalized", maxSupportedTransactionVersion: 0 },
      );
      transport.save(`read-only-${step}`, {
        receipt,
        status: statuses.value[i],
      });
      assert.equal(statuses.value[i]?.confirmationStatus, "finalized");
      assert(receipt?.meta);
      if (entry.expectedAncestorFailure)
        requireAncestorFailure({
          err: receipt.meta.err,
          logs: receipt.meta.logMessages,
        });
      else assert.equal(receipt.meta.err, null);
    }
    const model = fromSnapshot(s, {});
    const pd = PublicKey.findProgramAddressSync(
      [c.program.programId.toBuffer()],
      new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
    )[0];
    const accounts =
      await transport.connection.getMultipleAccountsInfoAndContext(
        [pd, new PublicKey(PAYER)],
        "finalized",
      );
    assert(accounts.value[0]);
    const authority = new PublicKey(
      accounts.value[0].data.subarray(13, 45),
    ).toBase58();
    assert.equal(authority, PAYER);
    const report = {
      time: new Date().toISOString(),
      noSignerRead: true,
      noSigning: true,
      noSubmission: true,
      program: PROGRAM_ADDRESS,
      programData: pd.toBase58(),
      upgradeAuthority: authority,
      slot: accounts.context.slot,
      payerLamports: accounts.value[1]?.lamports,
      organization: ORG.toBase58(),
      mint: SOURCE_MINT,
      isUSDC: false,
      finalizedSignatures: intents.map(([step, e]) => ({
        step,
        signature: e.signature,
      })),
      vaultBaseUnits: s.vaultBalance.toString(),
      nodes: model.nodes.map((n) => ({
        pda: n.id,
        stored: n.local,
        effective: statusOf(model, n.id),
        available: n.available.toString(),
        remaining: n.remaining.toString(),
      })),
      bounties: s.bounties.map((b) => ({
        pda: b.publicKey.toBase58(),
        status: b.account.status,
        winner: b.account.winner.toBase58(),
        reward: b.account.reward.toString(),
        submissions: b.account.submissionCount,
      })),
    };
    writeFileSync(
      join(directory, "read-only-verification.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
    return;
  }
  if (mode === "core" && transport.entries["core-complete"]?.passed) {
    console.log(
      "Core already verified; current accounts re-read. No transaction or signer read. Use --check for complete receipt reconciliation.",
    );
    return;
  }
  const identities = JSON.parse(
    readFileSync("artifacts/devnet-release/identity-local.json", "utf8"),
  );
  const privateRoot = resolve(
    process.env.LOCALAPPDATA!,
    "MandateOS/devnet-private/lifecycle-1791293314080",
  );
  const payer = loadPair(identities.files.payer, PAYER);
  const row = (id: string) => {
    const found = s.nodes.find((n) => n.publicKey.toBase58() === id);
    assert(found);
    return found;
  };
  const scraper = loadPair(
    join(privateRoot, "scraper-keypair.json"),
    row(SCRAPER).account.controller.toBase58(),
  );
  const operations = loadPair(
    join(privateRoot, "operations-keypair.json"),
    row(OPERATIONS).account.controller.toBase58(),
  );
  const research = loadPair(
    join(privateRoot, "research-keypair.json"),
    row(
      "DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7",
    ).account.controller.toBase58(),
  );
  const data = loadPair(
    join(privateRoot, "data-keypair.json"),
    row(
      "47KcPwqLcFwJBTewVrfBesKE6NVuT4PKr1zRZ921Ktad",
    ).account.controller.toBase58(),
  );
  const source = getAssociatedTokenAddressSync(
    s.organization.mint,
    payer.publicKey,
  );
  const prior = await transport.connection.getTransaction(
    "4p7r8sJPJj1uFZK4SNhqacUku6fi2VryWYPPAjUtr3i6WRaKrEnsatVYJrBGvutDWLKKXmVeSxBNKMjmpC94fKmo",
    { commitment: "finalized", maxSupportedTransactionVersion: 0 },
  );
  assert(prior?.meta && !prior.meta.err);
  const ix = prior.transaction.message.compiledInstructions[0];
  const keys = prior.transaction.message.getAccountKeys();
  const destination = keys.get(ix.accountKeyIndexes[5])!;
  assert.equal(keys.get(ix.programIdIndex)?.toBase58(), PROGRAM_ADDRESS);
  const read = async (step: string, minContextSlot?: number) => {
    s = await c.load(ORG);
    const model = fromSnapshot(s, {});
    const addresses = [
      payer.publicKey,
      scraper.publicKey,
      operations.publicKey,
      research.publicKey,
      data.publicKey,
      s.organization.vault,
      source,
      destination,
    ];
    const accounts =
      await transport.connection.getMultipleAccountsInfoAndContext(addresses, {
        commitment: "finalized",
        minContextSlot,
      });
    const result = {
      slot: accounts.context.slot,
      organization: ORG.toBase58(),
      mint: SOURCE_MINT,
      isUSDC: false,
      vault: s.vaultBalance.toString(),
      totalFunded: s.organization.totalFunded.toString(),
      totalSpent: s.organization.totalSpent.toString(),
      totalReclaimed: s.organization.totalReclaimed.toString(),
      nodes: model.nodes.map((n) => ({
        pda: n.id,
        stored: n.local,
        effective: statusOf(model, n.id),
        available: n.available.toString(),
        remaining: n.remaining.toString(),
      })),
      accounts: accounts.value.map((a, i) => ({
        address: addresses[i].toBase58(),
        lamports: a?.lamports,
        ...(a?.owner.equals(TOKEN_PROGRAM_ID)
          ? { tokenBaseUnits: a.data.readBigUInt64LE(64).toString() }
          : {}),
      })),
      bounties: s.bounties.map((b) => ({
        pda: b.publicKey.toBase58(),
        reward: b.account.reward.toString(),
        status: b.account.status,
        winner: b.account.winner.toBase58(),
        submissionCount: b.account.submissionCount,
      })),
      submissions: s.submissions.map((b) => ({
        pda: b.publicKey.toBase58(),
        agent: b.account.agent.toBase58(),
        bounty: b.account.bounty.toBase58(),
        resultHash: Array.from(b.account.resultHash),
      })),
    };
    transport.save(step, { state: result });
    return result;
  };
  await read(`${mode}-initial-read`);
  const spend = (nodeId: string, authority: Keypair, amount: number) =>
    c.program.methods
      .spend(u(amount))
      .accountsStrict({
        controller: authority.publicKey,
        organization: ORG,
        node: row(nodeId).publicKey,
        mint: s.organization.mint,
        vault: s.organization.vault,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts(c.ancestors(row(nodeId), s, true))
      .transaction();
  if (mode === "core") {
    assert(
      process.argv.includes("--submit-expected-failure"),
      "Explicit --submit-expected-failure required for the user-authorized included diagnostic failure",
    );
    if (!transport.entries["blocked-descendant"]?.verified) {
      assert.equal(row(ROOT).account.selfAvailable.toString(), "890000000");
      assert.equal(s.vaultBalance, 990_000_000n);
      const before = await read("blocked-descendant-before");
      const failed = await transport.execute(
        "blocked-descendant",
        await spend(SCRAPER, scraper, 1),
        [payer, scraper],
        true,
      );
      const after = await read("blocked-descendant-after", failed.slot);
      assert.deepEqual(after.nodes, before.nodes);
      assert.equal(after.vault, before.vault);
      const debit = before.accounts[0].lamports! - after.accounts[0].lamports!;
      transport.save("blocked-descendant", {
        payerDebitLamports: debit,
        unchangedAuthorityAndTokenState: true,
      });
      assert.equal(debit, failed.meta!.fee);
    }
    if (!transport.entries["operations-spend"]?.verified) {
      const receipt = await transport.execute(
        "operations-spend",
        await spend(OPERATIONS, operations, 5),
        [payer, operations],
      );
      await read("operations-spend-after", receipt.slot);
      assert.equal(s.vaultBalance, 985_000_000n);
      assert.equal(
        row(OPERATIONS).account.selfAvailable.toString(),
        "95000000",
      );
    }
    if (!transport.entries["root-reclaim"]?.verified) {
      const tx = await c.program.methods
        .reclaim(u(890))
        .accountsStrict({
          authority: payer.publicKey,
          organization: ORG,
          root: s.organization.rootMandate,
          mint: s.organization.mint,
          vault: s.organization.vault,
          destination: source,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();
      const receipt = await transport.execute("root-reclaim", tx, [payer]);
      await read("root-reclaim-after", receipt.slot);
      assert.equal(row(ROOT).account.selfAvailable.toString(), "0");
      assert.equal(row(ROOT).account.subtreeRemaining.toString(), "95000000");
      assert.equal(s.vaultBalance, 95_000_000n);
      assert.equal(s.organization.totalReclaimed.toString(), "890000000");
    }
    const final = await read("core-complete");
    assert.equal(final.vault, "95000000");
    transport.save("core-complete", { passed: true });
    console.log(
      "Existing Core lifecycle complete, including finalized AncestorRevoked failure and unaffected sibling/reclaim.",
    );
  } else {
    assert(
      transport.entries["core-complete"]?.passed,
      "Complete existing Core before Arena",
    );
    const bountyId = new BN(1791293314080);
    const bounty = bountyPda(c.program.programId, ORG, bountyId);
    if (!transport.entries["arena-deposit"]?.verified) {
      const tx = await c.program.methods
        .deposit(u(30))
        .accountsStrict({
          authority: payer.publicKey,
          organization: ORG,
          root: s.organization.rootMandate,
          mint: s.organization.mint,
          vault: s.organization.vault,
          source,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();
      const receipt = await transport.execute("arena-deposit", tx, [payer]);
      await read("arena-deposit-after", receipt.slot);
      assert.equal(row(ROOT).account.selfAvailable.toString(), "30000000");
      assert.equal(s.vaultBalance, 125_000_000n);
    }
    if (!transport.entries["arena-create-bounty"]?.verified) {
      const tx = await c.program.methods
        .createBounty(bountyId, u(25), payer.publicKey)
        .accountsStrict({
          authority: payer.publicKey,
          organization: ORG,
          root: s.organization.rootMandate,
          bounty,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      const receipt = await transport.execute("arena-create-bounty", tx, [
        payer,
      ]);
      await read("arena-create-bounty-after", receipt.slot);
      assert.equal(row(ROOT).account.selfAvailable.toString(), "5000000");
      assert.equal(row(ROOT).account.subtreeRemaining.toString(), "125000000");
    }
    if (!transport.entries["arena-fund-submission-rents"]?.verified) {
      const size = c.program.coder.accounts.size("submission");
      const rent =
        await transport.connection.getMinimumBalanceForRentExemption(size);
      const tx = new Transaction().add(
        ...[research, data].map((k) =>
          SystemProgram.transfer({
            fromPubkey: payer.publicKey,
            toPubkey: k.publicKey,
            lamports: rent,
          }),
        ),
      );
      transport.save("arena-fund-submission-rents", {
        submissionBytes: size,
        rentPerSubmission: rent,
        reason:
          "SubmitResult init payer is agent; existing controller retains rent floor while treasury sponsors fees",
      });
      const receipt = await transport.execute(
        "arena-fund-submission-rents",
        tx,
        [payer],
      );
      await read("arena-fund-submission-rents-after", receipt.slot);
    }
    for (const [role, agent] of [
      ["research", research],
      ["data", data],
    ] as const) {
      const step = `arena-submit-${role}`;
      if (transport.entries[step]?.verified) continue;
      const content = `MandateOS Devnet integration ${role}: deterministic test result, not an autonomous agent execution`;
      const hash = Array.from(createHash("sha256").update(content).digest());
      const submission = submissionPda(
        c.program.programId,
        bounty,
        agent.publicKey,
      );
      transport.save(step, {
        content,
        resultHash: hash,
        submission: submission.toBase58(),
      });
      const tx = await c.program.methods
        .submitResult(hash)
        .accountsStrict({
          agent: agent.publicKey,
          bounty,
          submission,
          systemProgram: SystemProgram.programId,
        })
        .transaction();
      const receipt = await transport.execute(step, tx, [payer, agent]);
      await read(`${step}-after`, receipt.slot);
      const actual = s.submissions.find((n) => n.publicKey.equals(submission));
      assert(actual);
      assert.deepEqual(Array.from(actual.account.resultHash), hash);
    }
    const winner = data.publicKey;
    const submission = submissionPda(c.program.programId, bounty, winner);
    const payout = getAssociatedTokenAddressSync(s.organization.mint, winner);
    transport.save("arena-verifier-result", {
      verifier: payer.publicKey.toBase58(),
      winner: winner.toBase58(),
      submission: submission.toBase58(),
      supportedSemantics:
        "No separate on-chain verifier-result instruction. Trusted verifier chooses submitted winner and signs atomic settle_bounty. Test result is not an on-chain quality/oracle proof.",
    });
    if (!transport.entries["arena-settlement"]?.verified) {
      const tx = await c.program.methods
        .settleBounty()
        .accountsStrict({
          verifier: payer.publicKey,
          organization: ORG,
          root: s.organization.rootMandate,
          bounty,
          submission,
          mint: s.organization.mint,
          vault: s.organization.vault,
          destination: payout,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();
      tx.instructions.unshift(
        createAssociatedTokenAccountIdempotentInstruction(
          payer.publicKey,
          payout,
          winner,
          s.organization.mint,
        ),
      );
      const receipt = await transport.execute("arena-settlement", tx, [payer]);
      await read("arena-settlement-after", receipt.slot);
      const b = s.bounties.find((n) => n.publicKey.equals(bounty));
      assert(b?.account.status.settled);
      assert(b.account.winner.equals(winner));
      assert.equal(b.account.submissionCount, 2);
      const payoutState = await transport.connection.getAccountInfoAndContext(
        payout,
        "finalized",
      );
      transport.save("arena-settlement", {
        payout: {
          address: payout.toBase58(),
          slot: payoutState.context.slot,
          owner: winner.toBase58(),
          baseUnits: payoutState.value?.data.readBigUInt64LE(64).toString(),
        },
      });
      assert.equal(payoutState.value?.data.readBigUInt64LE(64), 25_000_000n);
      assert.equal(s.vaultBalance, 100_000_000n);
      assert.equal(row(ROOT).account.selfAvailable.toString(), "5000000");
      assert.equal(row(ROOT).account.subtreeRemaining.toString(), "100000000");
    }
    await read("arena-complete");
    transport.save("arena-complete", {
      passed: true,
      bounty: bounty.toBase58(),
    });
    console.log(
      "Existing Arena lifecycle complete: reward reservation, two submissions, trusted-verifier atomic settlement.",
    );
  }
  writeFileSync(
    join(directory, `${mode}-result.json`),
    JSON.stringify(
      {
        time: new Date().toISOString(),
        passed: true,
        program: PROGRAM_ADDRESS,
        organization: ORG.toBase58(),
        newDeployment: false,
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  transport.save("stopped", {
    time: new Date().toISOString(),
    message: String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error(String(error));
  process.exitCode = 2;
});
