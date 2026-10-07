# Repository showcase · 7 October 2026

Implementation source: `7350f67cafe3c29bedb2bc7c243b5288fc3d3a6c`, branch `startup-v1-lab`. The separate presentation commit changes documentation/media/capture tooling only. No program, UI, wallet or deployment change; no transaction assembly, signature request, submission, push, merge or promotion.

## Real media

Captured at 08:56 UTC from the local static production export, Chromium 149.0.7827.55, 1440×960, DPR 1. No provider injection. [Asset manifest with hashes, dimensions and provenance](images/showcase/manifest.json).

| Asset                                                  | Actual state                                                                                         | Encoding / size                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Story](images/showcase/story.webp)                    | Genesis / Authority Chamber, built-in DEMO                                                           | Lossless WebP, 248,162 bytes                    |
| [Command](images/showcase/command-devnet.webp)         | Real Devnet reads: revoked Research, stored-active/effectively-blocked Scraper, surviving Operations | Lossless WebP, 81,658 bytes                     |
| [Arena](images/showcase/arena-devnet.webp)             | Real Devnet reads: existing settled bounty, two submissions, selected winner, 25 test TOKENS         | Lossless WebP, 54,840 bytes                     |
| [Story recording](images/showcase/authority-story.mp4) | Actual UI controls: Genesis → grant → full recursion → Trace → Blast Radius → Cascade                | 9.72 seconds, H.264, 1280px wide, 591,438 bytes |

Total: 976,098 bytes. Screenshots are complete browser captures, encoded without visual edits. The native browser video was trimmed, resized and encoded; no frames were composited or generated. Entry, trace and cascade video frames were inspected, together with all three optimized screenshots. Story is simulated, including its USDC labels. Command/Arena observe a classic SPL test mint, not USDC; the current capture does not provide transaction receipts.

Capture assertions passed: all six Story mandates remain active in the revoke preview, three descendants become blocked after demo confirmation, Operations remains active, Command's selected Scraper is blocked, Arena shows observed settlement, no desktop horizontal overflow, no page errors and no unexpected RPC writes. `scripts/capture-showcase.mjs` accepts a local URL and output directory; it requires an existing Playwright module (`PLAYWRIGHT_MODULE` can select it). The script never installs a provider or signs.

## Clean setup

A source-only `git archive` of the implementation was expanded into an ignored, isolated NTFS checkout, with no dependencies, environment or generated app/SDK/worker output copied from the running product. Fresh `npm ci` and `npm ci --prefix web` passed. The public `web/.env.example` was copied only into that isolated checkout.

- `npm run build:sdk`: passed.
- `npm run agent:inspect`: built SDK/worker and read real Devnet successfully; local Active, effective Blocked, revoked Research ancestor.
- `npm run build --prefix web`: compiled, typechecked and exported all three routes.
- The exact README `inspect.mjs` snippet was executed in the clean checkout and returned `active blocked`.
- The exported clean app was served locally and checked in a fresh disconnected browser on all three routes, with the same read-only/state assertions as the capture.
- Root typecheck, frontend lint/typecheck, Rust formatting and locked Cargo check passed.
- All 22 unique README destinations were checked with `node scripts/check-readme-links.mjs`: 12 local files exist, six local/production routes return HTTP 200, and the older preview has its explicitly documented Vercel-login boundary. Three Solana Explorer URLs returned HTTP 429; their page availability remains unverified. Their exact signatures and Devnet receipts were independently rechecked by RPC. The checker distinguishes this limit with exit code 2; it does not report those links as passing.
- Secret/build-output scan and staged whitespace/inventory review passed before committing.

An initial isolated install on another Windows volume failed to create npm workspace links (`EISDIR`); that failed setup is excluded. The successful clean verification used NTFS. The user's running port 3101 export was not rebuilt or replaced.

Validator and transaction-building test suites were **not rerun** for this documentation-only change under the owner's no-write/no-signature-preparation instruction. The preceding implementation report records 97 TypeScript, 64 validator and 16 Rust cases; those historical checks are not represented as new showcase runs. [Implementation verification](STARTUP-V1-DEVELOPER.md).

## Current disconnected measurement

One fresh headless Chromium 149 context, 1440×900, DPR 1, current port 3101 static export, actual public Devnet RPC and public organization. No Phantom/provider/keypair injection. Same preserved read-only performance harness used at the implementation checkpoint. Raw records and trace remain ignored under `target/showcase/disconnected`.

| Observation                                                      |                             Result |
| ---------------------------------------------------------------- | ---------------------------------: |
| Cold Command → confirmed account readiness                       |                  12.268 s / 10 RPC |
| Direct Arena → account readiness                                 |                   9.887 s / 10 RPC |
| Command idle, 20 seconds after 65 seconds of history observation |                             10 RPC |
| Arena idle, 20 seconds after route switch                        |                             12 RPC |
| Direct Arena idle, 20 seconds                                    |                             12 RPC |
| Four warm route switches                                         | 79 / 78 / 85 / 79 ms; 321 ms total |

Zero page errors, blocked writes, idle RAF callbacks, idle running animations or canvas elements. Public RPC variance and one sample prevent a general speed claim. This profile is separate from the owner's browser and cannot supply a matched connected-wallet comparison. [Before/after receipt-contention diagnosis and limits](STARTUP-V1-PERFORMANCE.md).

## Receipts and deployment provenance

Read-only RPC recheck at 08:52 UTC: all 19 stored historical Devnet signatures finalized. Fresh receipts for blocked-descendant, Operations spend and Arena settlement matched the recorded slots/outcomes/fees; 6003 remains an **included on-chain failure**, not a simulated denial. [Recorded lifecycle evidence](devnet-mvp-proof.json). No new transaction was sent, and none of these receipts was relabeled as browser signing.

Fresh Vercel CLI inspect/list join verified:

- Production alias: `mandateos-v2.vercel.app`, READY/production, deployment `dpl_6zwRZT42yGPaNsCVnPNJsAs6T3UN`; metadata SHA `7ce740a585774eb195ef8626876ae4a3db9f9000`. Anonymous HTTP 200 on `/`, `/app`, `/arena`.
- Latest existing preview: `mandateos-v2-f984ud67a-luzzwaixs-projects.vercel.app`, READY/preview, deployment `dpl_6VPZTxyqzEhWfH8XskPfwcGoMHzU`; `devnet-integration`, metadata SHA `f5b7965dbac9f4b634bfb5eccc6b146046218f68`, `gitDirty: 1`. Anonymous access redirects to Vercel login; no public app access claim.
- Neither deployment contains the current unpublished `startup-v1-lab` implementation. A metadata SHA is not a full byte identity for a dirty build.

## Open gate

Accessible browser inventory contained only Codex IAB/MCP Apps and no Chrome/Phantom session. The preferred browser bridge reported an unavailable trusted native connection. Actual owner-wallet address, wallet network, connected readiness/route/idle timings and signature approval therefore remain unverified. Headless account reads do not substitute for them.

The next step is a matched read-only measurement in an accessible owner Phantom session. Before any subsequent transaction, review action, signer, Devnet/program, amount/destination, state changes, fee/rent and retained evidence, then obtain explicit approval. Reconcile a submitted or unknown signature and refetch authoritative chain state before another action.
