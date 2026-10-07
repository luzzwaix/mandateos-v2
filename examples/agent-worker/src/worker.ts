import { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import {
  inspectAuthority,
  type MandateClient,
  type AuthorityInspection,
  type TransactionOutcome,
} from "@mandateos/sdk";

export async function inspectWork(
  client: MandateClient,
  organization: PublicKey,
  mandate: PublicKey,
) {
  const snapshot = await client.load(organization);
  return { snapshot, authority: inspectAuthority(snapshot, mandate) };
}
export interface SpendJob {
  organization: PublicKey;
  mandate: PublicKey;
  /** Classic SPL token account for the organization mint, not a wallet address. */
  destination: PublicKey;
  amount: BN;
}
export type WorkResult =
  | { kind: "authority-unavailable"; authority: AuthorityInspection }
  | { kind: "prerequisite-rejection"; reason: string }
  | {
      kind: "attempted";
      outcome: TransactionOutcome<string>;
      authorityAfter?: AuthorityInspection;
      refreshError?: string;
    };

/** Caller supplies its signer and explicit job. One attempt; never retry unknown outcomes. */
export async function runAuthorizedSpend(
  client: MandateClient,
  job: SpendJob,
): Promise<WorkResult> {
  const { snapshot, authority } = await inspectWork(
    client,
    job.organization,
    job.mandate,
  );
  if (authority.effective !== "active")
    return { kind: "authority-unavailable", authority };
  const target = snapshot.nodes.find((node) =>
    node.publicKey.equals(job.mandate),
  )!;
  if (!client.wallet?.publicKey.equals(target.account.controller))
    return {
      kind: "prerequisite-rejection",
      reason: "The supplied signer must control this mandate",
    };
  if (
    job.amount.lten(0) ||
    job.amount.gt(new BN("18446744073709551615")) ||
    job.amount.gt(target.account.selfAvailable)
  )
    return {
      kind: "prerequisite-rejection",
      reason:
        "Amount must fit the mandate's own available capital and positive u64",
    };
  if (job.destination.equals(snapshot.organization.vault))
    return {
      kind: "prerequisite-rejection",
      reason: "The shared vault cannot be its own spending destination",
    };
  const outcome = await client.transact((c) =>
    c.spend(snapshot, target, job.amount, job.destination),
  );
  // Authority can change between reading and preflight/landing. Preserve provenance
  // while refetching confirmed changes or a real 6003 denial; never infer revocation.
  const refresh =
    outcome.kind === "confirmed-success" ||
    outcome.kind === "on-chain-failure" ||
    (outcome.kind === "simulation-rejection" &&
      outcome.protocol?.number === 6003);
  if (refresh) {
    try {
      const latest = await inspectWork(client, job.organization, job.mandate);
      return { kind: "attempted", outcome, authorityAfter: latest.authority };
    } catch (error) {
      return {
        kind: "attempted",
        outcome,
        refreshError: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { kind: "attempted", outcome };
}
