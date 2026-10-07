# Startup v1 · developer integration checkpoint

Branch `startup-v1-lab`, based on the actual `devnet-integration` candidate `80db0898b949056e6a97beebde5a47c5aaa446f1`. No tracked edits existed initially. Five pre-existing untracked QA files were preserved and excluded from commits. Performance checkpoint `cd7eef3`, two-pass experience checkpoint `7e7af15`, SDK checkpoint `039d8e8`; the agent/onboarding checkpoint follows. No push, deployment, merge or browser signature occurred.

## Delivered

- `packages/sdk`: framework independent source-derived client; explicit Devnet RPC/program configuration; exact generated ABI and binary verification; owner/discriminator-checked organization reads; typed organization/mandate snapshots; complete canonical ancestry and local/effective status; delegation, spend, revoke and reclaim; existing Core/Arena builders; structured IDL errors; typed transaction outcomes and read-only reconciliation. The app's Solana modules are thin adapters/re-exports. Build/audit scripts use the canonical SDK artifacts.
- `examples/agent-worker`: read-only inspection CLI and one caller-signed spend worker. Stops blocked ancestry before signing, checks controller/available amount/destination, invokes the SDK spend builder once, refetches confirmed changes, retains preflight versus on-chain denial provenance, and never retries unknown delivery. A failed refetch does not erase a confirmed transaction outcome.
- Short runnable onboarding: [agent quickstart](../examples/agent-worker/README.md), [SDK authority/usage/errors](../packages/sdk/README.md). `npm ci` then `npm run agent:inspect`. SDK alone: `npm run build:sdk`; package for another project with `npm pack ./packages/sdk`.

## Verification

97 focused TypeScript cases pass together: existing UI/client/transport/evidence/budget suites plus 24 SDK and 10 worker cases. Root/frontend typecheck, frontend lint, production export, SDK/agent builds, package packing/import in an independent consumer without React, secret scan and staged whitespace checks pass. Cold quickstart was executed in a separate source copy with no built SDK/agent output, fresh `npm ci`, then the documented command. It built and read real Devnet successfully.

Rust formatting and locked Cargo check pass with supported GNU Rust 1.89.0. Fresh source compilation, host cases and all 64 real local-validator cases passed before the SDK extraction; no Rust source/ABI changes followed. That isolated run is `.localnet/run-1791350686016/workspace`. The original generated source/binary and validator logs remain ignored. `local-test.mjs` now includes packages/examples when making future isolated source copies.

After extraction, 111 surface browser assertions pass again. Fresh final SDK-backed real Devnet `/app` and `/arena` reads passed at 1440×900 and 390×844, with zero overflow/page errors/writes. Public reads verified the existing Research revoke, stored-active/effectively-blocked Scraper, surviving Operations and existing settled Arena account. These are account observations of previous actions, not new transaction evidence. Historical receipts were not recreated or promoted to browser-wallet proof.

SDK and normal/cold agent CLI reads return the exact Root → Research → Data → Scraper path, local `active`, effective `blocked`, blocking ancestor `DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7`. No signer was supplied. Worker authorized spend, revocation race and transaction-outcome tests use RPC stubs. No live agent spend was attempted.

## Local evidence and remaining gate

Ignored artifacts under `target/startup-v1`: `contention-before.json`, `contention-after.json`, `performance-baseline/measurements.json`, `performance-final/measurements.json`, `visual-before`, `visual-pass1-implemented`, `visual-final-clean` (26 final screenshots), `surface-qa`, `motion-qa`, `story-qa.json`, `sdk-surface-qa`, `sdk-browser` (four real account screenshots/results), `sdk-devnet-read.json`, `agent-quickstart.txt`, `cold-quickstart.txt`, `sdk-pack-final.json`, `final-unit-tests.txt`. They are local verification outputs and are not shipped in the package or Git. Conditions/limitations: [performance](STARTUP-V1-PERFORMANCE.md), [two visual passes and exact states](STARTUP-V1-EXPERIENCE.md).

Real Phantom was unavailable: the preferred browser bridge could not connect, and the accessible browser inventory contained no Phantom/Chrome session. Headless Chromium had no provider; actual Connect Phantom reported installation required. Connected-wallet latency, provider/signing responsiveness, new browser-wallet transactions and live agent spending remain unverified. Network timing/idle call counts did not establish a general latency improvement; only demonstrated receipt contention was fixed and reproduced in controlled tests.

Highest-value next step: make a real Phantom Devnet browser session accessible, measure the same account/route/idle conditions while connected, then review each concrete transaction's signer/network/program/amount/destination/state changes/fee/rent/evidence and obtain explicit approval before signing. Reconcile any unknown signature/state before a fresh action. This is a Devnet MVP; production security and operations are not verified.

Production provenance: fresh Vercel CLI inspection resolves mandateos-v2.vercel.app to dpl_6zwRZT42yGPaNsCVnPNJsAs6T3UN (READY); matching production-list URL metadata identifies source SHA 7ce740a585774eb195ef8626876ae4a3db9f9000. Local target/startup-v1/production-provenance.json records the join. The new branch is not deployed.
