# MandateOS SDK · Devnet MVP

Framework independent TypeScript client extracted from the application's Solana client. The app imports this same implementation. Node ≥20.18, classic SPL Token, the source-generated nine-instruction ABI and verified Devnet binary only. No React, wallet adapter, environment variables or embedded signing material.

## Quickstart

From the repository root:

```sh
npm ci
npm run build:sdk
npm run test:sdk
```

Import `./packages/sdk/dist` in this checkout. To use in another project, run `npm pack ./packages/sdk` and install the resulting tarball. The package contains JavaScript, declarations, generated IDL and binary identity; rebuilding the Rust program updates the SDK's canonical artifacts.

```ts
import { PublicKey } from "@solana/web3.js";
import {
  MandateClient,
  PROGRAM_ADDRESS,
  inspectAuthority,
} from "@mandateos/sdk";

const client = new MandateClient({
  cluster: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  programId: PROGRAM_ADDRESS,
});
const snapshot = await client.load(new PublicKey(organizationAddress));
const authority = inspectAuthority(snapshot, new PublicKey(mandateAddress));
console.log(authority.local, authority.effective, authority.path);
```

`load` verifies Devnet genesis, executable loader and exact source-built ELF before fetching the organization, owner/discriminator-checked organization, filtered mandates, mint, shared vault, bounties and submissions. RPC errors propagate; missing ancestry yields `unknown`, never fabricated active authority. Snapshots are observations, not guarantees that authority remains valid when a transaction lands.

`load(address, onVerified?, onProgress?)` preserves the original API and optionally reports `deployment`, `organization`, `accounts`, and `submissions` phases. Mint and vault share one batched RPC read, with classic SPL owner/layout checks and matching organization mint/vault authority checks. The address of a connected wallet can be shown independently of these reads.

## Authority model

Treasury → Research → Data → Scraper; Operations can remain a Treasury sibling. Allocations are accounting authority in one shared vault. Delegate uses only the parent's `selfAvailable`. Spend updates the complete path. Revoke zeros the target, releases its subtree reservation to its parent and leaves descendants stored Active but effectively blocked. Reclaim uses Root's own available amount. Revocation does not itself move tokens. Account amounts are BN/base units; use `toBaseUnits` for exact decimal conversion.

`inspectAuthority(snapshot, target)` returns local/effective status, a validated Root-to-target path, and the revoked `blockingAncestor` when applicable. Missing, cyclic, cross-organization, duplicate, wrong-depth, noncanonical PDA, unknown-status or non-Root paths return effective `unknown`.

## SDK usage

Supply a caller-controlled `SigningWallet` as the second constructor argument to write. It exposes a public key and `signTransaction`/`signAllTransactions`; no key storage is provided. Third argument observes transaction progress; optional fourth argument injects a Connection. Genesis/binary checks still run on injected connections.

Public protocol methods: `load`, `verifyDeployment`, `ancestors`, `delegate`, `spend`, `revoke`, `reclaim`; also the existing `createOrganization`, `deposit`, `createBounty`, `submitResult`, `settleBounty`, `activity`, `send`, `reconcileSubmission`. All builders reuse the generated IDL and canonical ancestor metas. `ancestors` orders immediate parent → Root; spending makes every ancestor writable.

```ts
const result = await client.transact((c) =>
  c.spend(snapshot, mandate, toBaseUnits("1", snapshot.decimals), tokenAccount),
);
if (result.kind === "confirmed-success") {
  const updated = await client.load(snapshot.address); // refetch authoritative state
}
```

Pass exactly one supported action to `transact`. It returns a typed `TransactionOutcome`. Review/sign through the supplied wallet. Destination must be a classic SPL token account for the organization mint, never the vault itself. The program remains the final authority validator, including revocation races.

## Errors and evidence

| Kind / progress        | Meaning                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `simulation-rejection` | Preflight rejected; logs available; no submitted signature or Explorer evidence.                              |
| `wallet-rejection`     | Wallet refusal with provider code 4001; no send. Other signing exceptions stay client errors.                 |
| observer `submitting`  | Signed packet identity and expiry recorded before forwarding; delivery still uncertain.                       |
| observer `pending`     | RPC accepted the original signature; submitted, awaiting confirmation.                                        |
| `confirmed-success`    | Confirmed signature and slot; refetch state after this result.                                                |
| `on-chain-failure`     | Confirmed failed transaction; signature, available receipt logs/fee/slot retained.                            |
| `unknown`              | Send response, signature agreement or confirmation unresolved; original signed signature and expiry retained. |
| `client-rejection`     | Local prerequisite/configuration/assembly error or callback that submitted nothing.                           |

`interpretProtocolError` maps actual supplied Anchor logs to matching source-IDL name/number/message, including `AncestorRevoked` / 6003. A numeric property or error message alone is insufficient. An error code alone is not chain evidence: retain its outcome provenance. `explorer(signature, config)` is useful only for submitted/confirmed signatures, never simulated denials.

For `unknown`, persist the signature and `lastValidBlockHeight`, then use `reconcileSubmission`. It reads history and receipts and returns `confirmed`, `failed`, `expired`, or `unknown`; it never signs or resubmits. Never automatically retry an unknown action. Finalized expiry plus absent history/receipt permits review of a new action. RPC forwarding retries reuse the same signed packet; the SDK transport never replays ambiguous sends.

## Verification

28 focused SDK tests cover configuration, malformed ancestry, revoked ancestry/sibling survival, exact amounts, real IDL builders, complete writable paths, batched token decoding and all outcome distinctions. `isWalletRejection` recognizes provider code 4001; a signing transport exception is not reported as a user decline. Tests use RPC stubs and the actual locally built ELF; they are not browser-wallet evidence. A source-only pinned install, SDK/worker build, package tarball and runnable read-only quickstart are checked in the [completion report](../../docs/COMPLETION-SPRINT.md). Dependency/security/operations and real Phantom signing remain outside this MVP's verified scope.
