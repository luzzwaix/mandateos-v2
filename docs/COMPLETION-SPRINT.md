# Completion sprint · 7 October 2026

Local Devnet candidate with explicit open acceptance gates. No push, merge, deployment, program/authority change or new Devnet transaction was performed.

## Repository and deployment truth

- Checkout: `C:\Users\ford5\Desktop\Solana Collosseum\mandateos-visual-pass`, branch `startup-v1-lab`.
- Starting HEAD: `ba6016bc24f0600508ad4234523bdb3820611796`. Tracked files were clean. Five existing untracked files remain untouched: `docs/GATE-0-WALLET-LAG.md`, `docs/GATE-1-PERFORMANCE-QA.md`, `docs/RELEASE-CANDIDATE-STATUS.md`, `docs/gate1-performance.json`, `scripts/qa-wallet-performance.mjs`.
- The sibling `mandateos-v2` checkout contains user modifications and was not edited. Seven implementation/showcase commits were present above `origin/devnet-integration` at entry; no upstream was configured for this branch. No remote mutation was made.
- Existing production [alias](https://mandateos-v2.vercel.app/) was inspected with Vercel tools: READY, deployment `dpl_6zwRZT42yGPaNsCVnPNJsAs6T3UN`, immutable hostname `mandateos-v2-2sapm55z0-luzzwaixs-projects.vercel.app`. Deployment metadata returned no Git SHA. Earlier reports record `7ce740a585774eb195ef8626876ae4a3db9f9000`; that SHA is historical, not freshly verified. Production does not contain this local completion work.
- Prior reports consulted: `STARTUP-V1-PERFORMANCE`, `STARTUP-V1-DEVELOPER`, `SHOWCASE-VERIFICATION`, `DEVNET-MVP-VERIFICATION`, and the preexisting Gate 0/Gate 1/release reports. Those retain their historical scope.

Scoped checkpoints: `39da2be9eea2893c8b0fb39c14da705a9792ff49` (batched verified reads/loading/outcome provenance), `a1ba9ea23ff81b896abcbedf5725f5316b8331ff` (walkthrough and operator composition), `64e7ee93f2f9d31cc0b923a00a51c74afb33406f` (documentation/media), then `fix: keep authority recording viewport stable` (recording/QA only). Runtime candidate source is `a1ba9ea`; obtain final documentation HEAD with `git rev-parse HEAD`. Every staged diff was inspected. The five initial untracked files were excluded from all checkpoints.

## Shipped local changes

| Files                                                                                                                                    | Result                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/sdk/src/client.ts`, `index.ts`, `lifecycle.ts`; `tests/sdk.ts`                                                                 | Backward-compatible optional load progress; one mint/vault RPC batch with existing SPL decoding plus organization mint/authority checks; shared provider-code-4001 wallet-decline classification; four focused cases added.                                                                                                                                  |
| `web/src/lib/use-console.ts`, `solana/client.ts`                                                                                         | Honest deployment/organization/accounts/submissions progress; useful account-read failure state; signing transport errors no longer described as a user decline. Existing deduplication, cancellation generations, shared RPC pacing, stale-action guards and unknown-result reconciliation remain.                                                          |
| `web/src/components/story-world.tsx`                                                                                                     | Prominent 20-second automatic walkthrough, Pause/Resume/Next/Replay, direct Command/Arena navigation, explicit no-transaction proof, mobile depth ledger, visibility/unmount timer cleanup. Domain state changes precede finite motion; animation never decides state. Restarting the tour restarts its first-step timer.                                    |
| `web/src/components/command-world.tsx`, `capital-authority-instrument.tsx`                                                               | Keyboard/touch inspector jump, focusable inspector, separated sibling geometry and explicit preflight-versus-chain rejection provenance.                                                                                                                                                                                                                     |
| `web/src/components/completion.css`, `web/src/app/layout.tsx`                                                                            | Geist Sans display/interface, graphite/bone palette, compact treasury band, graph beside bounded inspector, earlier action placement, rail collapse before small labels, in-flow mobile inspector/ledger and 44px controls. Proof height allows provenance/caption before the footer. Arena retains its implemented dominant mission and truthful lifecycle. |
| `scripts/sprint-performance.mjs`, `scripts/sprint-experience.mjs`                                                                        | Repeatable disconnected read-only performance samples and walkthrough/responsive/error acceptance. Uses already installed Playwright; no wallet injection.                                                                                                                                                                                                   |
| `README.md`, `packages/sdk/README.md`, this report, `COMPLETION-RECORDING.md`, `completion-performance.json`, `docs/images/completion/*` | Current app media, runnable onboarding, raw measurements, provenance and release boundaries. Previous submission media remain intact.                                                                                                                                                                                                                        |

No external community component, dependency, global tool or new rendering framework was adopted. Impeccable informed one pre-pass critique and final polish; React best practices informed hooks/cleanup/data-fetch review. Existing React, SVG, CSS and finite Web Animations carry the implementation.

## Performance · three samples per route before/after

Same Windows device, Chromium `149.0.7827.55`, 1440×900 DPR 1, production static export at port 3101, fresh context per route, same public Devnet endpoint, disconnected/no provider. No heavy test/build job ran during after samples. Network variance and low Windows disk/commit resources remain confounders. Final Story restart/ledger-order corrections do not alter sampled Command/Arena code or layout.

Values below are median (min–max). [Full paired samples](completion-performance.json). Readiness uses confirmed account-backed UI, not wallet provider completion.

| Metric                                 | Before                | After               |
| -------------------------------------- | --------------------- | ------------------- |
| Command shell / Wallet button          | 664ms (607–717)       | 953ms (896–1034)    |
| Command first organization response    | 4785ms (4727–4818)    | 5148ms (5106–5201)  |
| Command account-backed UI              | 10274ms (10114–10301) | 9566ms (9495–9604)  |
| Arena shell / Wallet button            | 574ms (563–791)       | 845ms (547–1000)    |
| Arena first organization response      | 5432ms (4689–5749)    | 5027ms (4654–5146)  |
| Arena account-backed UI                | 10913ms (10120–11889) | 9406ms (9044–9616)  |
| Warm Command → Arena                   | 171ms (149–188)       | 198ms (87–332)      |
| Warm Arena → Command                   | 235ms (152–273)       | 205ms (134–286)     |
| RPC calls before readiness · Command   | 10 / 10 / 10          | 9 / 9 / 9           |
| RPC calls before readiness · Arena     | 10 / 10 / 11          | 9 / 9 / 9           |
| 20s after-ready RPCs · Command / Arena | 12,12,12 / 12,12,11   | 12,12,12 / 12,12,12 |
| Idle RAF / running animations          | 0 / 0                 | 0 / 0               |
| Browser page errors                    | 0                     | 0                   |

The demonstrable change is one fewer paced RPC request and lower account-readiness medians (about 0.71s Command and 1.51s Arena). It does **not** establish a general speedup: shell medians regressed, Command route-switch variance widened, and CPU/layout metrics increased. CDP TaskDuration medians: Command 1.341→1.732s, Arena 1.458→1.747s; LayoutDuration 0.174→0.260s and 0.170→0.256s. Those totals include initial rendering, binary verification, progressive history and polling, not an isolated frame benchmark. React commit proxy in the 20s interval changed from 6 each to 5/8/8 Command and 8/7/8 Arena; progress updates account for additional state notifications.

Idle polling is the existing paced account freshness/history work, not animation. Long tasks occur both before and after (including existing program-binary verification); maxima were 254→418ms Command and 221→358ms Arena. After idle long tasks were 55–104ms in some runs. Attribution was not isolated sufficiently to close the “no new >50ms task” gate. Three samples cannot establish reliable interaction/frame p95. These performance gates remain open; no whole-product performance acceptance is claimed.

The measured roughly nine-second wait is account/program hydration through verified, 1000ms-paced shared public RPC, separate from Phantom provider connection. The shell stays useful while reads proceed. The provider contribution to the reported connection delay remains unmeasured: real Phantom connect/address/signature timing needs an actual accessible provider; no mock was used as proof.

## Visual and interaction verification

Exactly two focused visual passes: initial screenshots/critique, then composition/action changes; second-pass screenshots led only to specific typography, mobile height/ledger, graph separation and Proof caption fixes. No new art direction or alternative component was introduced.

- Browser states inspected: Story Genesis, Grant/Recursion, Trace, all-active copper Blast Radius, simulated Cascade, blocked Scraper/Proof, surviving Operations; Command loading, disconnected Devnet, Scraper local ACTIVE/effective BLOCKED, Operations ACTIVE, inspector focus and missing Phantom; Arena existing settlement; actual aborted-RPC error with useful shell and no demo replacement.
- Acceptance produced 65 captures at 1440×900, 1280×800, 768×1024 (reduced motion), 390×844 and 720×450 equivalent 200% reflow. Captures were opened for visual inspection, including desktop and mobile states, tablet inspector, reflow and error. Horizontal overflow and running animations were zero after each finite event. **Native 200% browser zoom is not verified**; reflow is not claimed as native zoom.
- Automatic walkthrough: 20.632s; keyboard Run/Pause/Next/Replay, no delayed model state, copper preview stays active, revoked Research blocks three descendants, Operations remains active, proof explicitly says not sent/no signature. Existing Story checks passed normal/reduced preferences. Targeted final Proof capture confirms caption and footer do not overlap.
- Existing capital-surface browser suite: 111 assertions passed, including keyboard/focus, responsive ledger, reduced motion, lifecycle and measured revoke-control contrast ≥4.5:1. The one earlier fixed-delay snapshot observing a still-running finite Arena event is excluded; acceptance waits for finite animations to end. Whole-interface contrast certification is not claimed.
- Actual current browser video was inspected at grant/trace/cascade/proof frames. Committed [recording](images/completion/authority-walkthrough.webm) shows simulated Story only. The [85-second script](COMPLETION-RECORDING.md) clearly distinguishes account observations and historical CLI evidence.

Final targeted checks passed at 1440, 1280 and 390: restart resets the first-step timer; the nested ledger orders Root → Research → Data → Scraper / Analysis, then the independent Operations sibling; keyboard Next, reduced motion, Proof/footer geometry and overflow remain correct. Current screenshots and recording were refreshed after these second-pass corrections.

Local artifacts: `target/completion-sprint/pass1-before`, `pass2`, `final`, `existing-surface-qa`, `before`, `after`. Regenerate with `node scripts/sprint-experience.mjs http://127.0.0.1:3101 target/completion-sprint/acceptance` and `node scripts/sprint-performance.mjs http://127.0.0.1:3101 target/completion-sprint/samples`. These use the already installed Playwright or an explicit `PLAYWRIGHT_MODULE` path; no new test dependency was installed. Old fixed-delay/failed runs are not passing evidence.

## Devnet evidence · read-only in this sprint

`npm run verify:devnet:read` passed at `2026-10-07T10:21:30.951Z`, finalized observation slot `508422746`. All 19 canonical historical signatures are finalized. Current accounts confirm revoked Research; Data and Scraper remain stored ACTIVE/effectively BLOCKED; Operations remains ACTIVE with 95 TOKENS available; Root available 5; vault 100; existing Arena settled 25 with two submissions and recorded winner. [Canonical signatures/accounts](devnet-mvp-proof.json).

Program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`; organization `EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A`; mint `6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9`, six decimals, classic SPL **test TOKENS, not USDC**.

- Historical included 6003 failure: `2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv`.
- Historical surviving Operations spend: `4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ`.
- Historical Arena settlement: `2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1`.

These are CLI receipts, not browser-wallet activity. The canonical flow was already complete, so repeating it would alter a settled fixture rather than finish a missing step. New CLI submissions: **0**. New browser submissions: **0**. No dedicated Devnet signer was needed/read. Accessible IAB/Playwright sessions had no real Phantom; the actual Connect Phantom attempt reported installation required. No connection, controller-mismatch or wallet-signing result was fabricated. Browser-signed lifecycle and live worker spend remain unverified.

## Developer/release checks

Frontend lint (zero warnings), typecheck and production static build passed. Root typecheck, SDK build and 99 focused TypeScript cases passed: SDK 28, worker 10, authority UI 16, Devnet client 26, RPC/evidence 19. These unit cases use stubs and are not Devnet wallet proof.

Source-only copied SDK/worker plus pinned `npm ci` succeeded; final SDK sources were recopied after the outcome fix, built, and the exact README JavaScript quickstart ran against real Devnet: `active blocked`. `npm run agent:inspect` read actual ancestry and stopped at revoked Research without attempting a spend. `npm pack` produced the framework-independent package; no React dependency or signer was added. The pinned install reports 15 existing dependency advisories (6 high, 8 moderate, 1 low); no remediation/readiness claim is made.

`cargo fmt --all -- --check` and `cargo check --locked` passed on supported Rust 1.89 Windows GNU. Protocol source/layout/IDL/program ID are unchanged. Fresh isolated SBF build completed, but its host IDL build hit ENOSPC. Only this sprint's generated Cargo outputs were cleaned with Cargo; user files were preserved. A reused isolated build was byte-compared to current Rust source (apart from its disposable `declare_id`) before validator testing. Initial retry passed batches 1–6 (48 cases), then batch 7 validator startup failed due Windows memory allocation, not a test assertion. Final validator result is recorded below after retry; resource-failed runs are not described as passing.

Final retry: `npm run test:local -- --reuse .localnet/run-1791350686016/workspace` exited 0; **all 64 cases passed across eight fresh validator banks** without competing builds/browser tests. Fresh-IDL ENOSPC remains a reproducibility limitation, not a protocol-test failure. No cached-source mismatch was accepted.

Release file secret scan passed for 233 tracked/new files; public production bundle pattern scan passed for 39 text artifacts; all README local destinations exist; `git diff --check` passed. Recognized-pattern scanning is not a comprehensive secret/security audit. No dependency/lockfile, Rust, IDL, program identity or production configuration change is in this sprint.

## Claim matrix and open gates

| Claim                                 | Status                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Visual/product interaction pass       | Two focused passes; explicit walkthrough/actions and inspected browser evidence. Native zoom / full contrast coverage remain limited.      |
| Account hydration improvement         | One fewer RPC and lower medians in three paired samples. Shell/CPU regression and attribution/p95 gates remain open.                       |
| Phantom performance                   | Unverified: real provider unavailable.                                                                                                     |
| Browser Devnet writes                 | Unverified: zero submissions, no signing bypass.                                                                                           |
| Program canonical lifecycle           | Historical CLI flow rechecked finalized; current accounts reconcile. No semantic changes.                                                  |
| SDK and safe agent onboarding         | Clean pinned build, 28/10 focused cases, real quickstart and read-only worker passed. Live agent spend unverified.                         |
| Deployment/release                    | Local candidate only; direct routes/config/binary checks work. No deployment/push/merge. Production SHA unavailable from current metadata. |
| Business/mainnet/production readiness | Not claimed; dependency, security and operations work remains.                                                                             |

Highest-impact next action: measure a real Phantom session against this candidate, showing address before hydration and retaining a manually approved supported transaction's signature/finality/post-state only if the wallet's actual role and current accounts permit it. Then isolate cold-render/binary-verification CPU and native zoom/contrast gaps before promoting any release.

## Deployment preparation

Existing static workflow: `npm ci`, `npm ci --prefix web`, preserve/configure public Devnet values from `web/.env.example`, `npm run build --prefix web`, `npm run start --prefix web`. Review `web/vercel.json` direct-route/static configuration and use the repository's already linked Vercel project for a preview only after explicit deployment authorization. Do not create a new project, alter program/authority/configuration, or promote production. No preview or paid service was created here.
