# Reference agent worker

One small SDK consumer: load authority → check its complete ancestry → attempt one authorized spend → retain the outcome → refetch confirmed changes. A locally Active Scraper under revoked Research stops before signing. If revocation races a read, actual preflight/on-chain 6003 evidence remains distinct. Unknown delivery never triggers a second attempt; reconcile its original signature first.

## Run

From the repository root, Node ≥20.18:

```sh
npm ci
npm run agent:inspect
```

The command builds SDK + worker, then reads the recorded Devnet organization/Scraper using real RPC. No signing wallet is loaded or requested. Expected current fixture: local `active`, effective `blocked`, Research as `blockingAncestor`. The output is computed from account state and may change. Public RPC outages fail visibly.

Custom account/endpoint:

```sh
npm run agent:inspect -- --organization YOUR_ORG --mandate YOUR_MANDATE --rpc YOUR_DEVNET_RPC
```

## Authorized action

Integrators call `runAuthorizedSpend(client, job)` from `dist/worker`. Construct the SDK client with your existing `SigningWallet`; provide organization, mandate, classic SPL destination token account and an exact BN amount. The worker checks controller identity, own available capital and destination, then calls the SDK's existing spend builder through `transact`. The program still checks current ancestry, mint and accounting atomically. This example stores no signer material and has no spending CLI.

```ts
import { MandateClient, PROGRAM_ADDRESS, toBaseUnits } from "@mandateos/sdk";
import { runAuthorizedSpend } from "./dist/worker";

const client = new MandateClient(
  {
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    programId: PROGRAM_ADDRESS,
  },
  yourSigningWallet,
);
const result = await runAuthorizedSpend(client, {
  organization,
  mandate,
  destination: destinationTokenAccount,
  amount: toBaseUnits("1", 6), // use your mint's actual decimals
});
```

`attempted` retains the SDK outcome even if refetch fails, preventing a confirmed spend from being misreported as an unsubmitted job. Persist unknown signatures/expiry and use `client.reconcileSubmission`; never blindly retry. See the [SDK authority, usage and error guide](../../packages/sdk/README.md).

Tests verify active spend with the real IDL builder, refetch after confirmation, blocked ancestry without signing, revocation races, prerequisites and unknown-outcome handling. Authorized-spend tests use RPC stubs; the runnable CLI verification is a real Devnet read. Neither is browser-wallet transaction evidence.
