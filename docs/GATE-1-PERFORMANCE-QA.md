# Gate 1 — current truth and read-only performance QA

Historical report for `80db089`; its old gate order is not the current sprint's instruction. See [current procedure](OVERNIGHT-RELEASE.md) and the generated morning handoff for fresh checks and preview provenance.

7 October 2026. **Gate 1 remains OPEN: genuine connected Phantom performance is not yet measured.** Gates 2–5 have not started. The owner's latest gate order overrides the attachment's early safety-tag/startup-branch instruction.

## Current repository and deployment truth

Verified from commands, not selected from an old prompt:

- Root: `C:/Users/ford5/Desktop/Solana Collosseum/mandateos-visual-pass`.
- Branch: `devnet-integration`.
- HEAD: `80db0898b949056e6a97beebde5a47c5aaa446f1`.
- Initial working tree: `?? docs/RELEASE-CANDIDATE-STATUS.md`; no staged or tracked modifications. That report was preserved.
- Latest commits: `80db089` QA documentation; `67ccb16` read/cache/evidence fixes; `bd64b1f` public verification/browser gate; `7ce740a` previously published static routes.
- Vercel project `prj_v4gBCH12utH88xbMagyDNMKYieG6`, existing `mandateos-v2`, confirmed before inspecting production.
- Fresh Vercel GET at `2026-10-06T22:00:21.259Z`: production **READY**, deployment `dpl_6zwRZT42yGPaNsCVnPNJsAs6T3UN`.
- Deployment Git metadata: **`7ce740a585774eb195ef8626876ae4a3db9f9000`**, ref `devnet-integration`. CLI summary omitted provenance, so its read-only deployment API supplied the Git metadata. No deployment/env mutation occurred.
- Public alias: <https://mandateos-v2.vercel.app>; immutable deployment URL: <https://mandateos-v2-2sapm55z0-luzzwaixs-projects.vercel.app>.
- Pending publication: `67ccb16` runtime/performance/evidence fixes and tests; `bd64b1f`/`80db089` documentation, measurements and captures. The source diff from production includes 27 files; it is already committed locally, not new work in this gate.
- Existing `submission-v1` branch and `submission-v1.0.0`–`.3` tags were read and preserved. **No new branch, safety tag, freeze or startup-v1 was created.**

Latest documents read: [release status](RELEASE-CANDIDATE-STATUS.md), [final adversarial QA](FINAL-ADVERSARIAL-QA.md), [Devnet verification](DEVNET-MVP-VERIFICATION.md), [browser handoff](DEVNET-BROWSER-HANDOFF.md), and public proof/measurement files. The fresh IDL/SBF build gate is already closed with exact schema/ELF parity; no recompilation or redeployment was needed here.

## Browser scope and limits

The live browser inventory exposed only Codex IAB and MCP Apps; no extension-enabled Chrome. The installed browser-use connection could not be established; its safety restriction was not bypassed. The supported fallback browser displayed the actual public Devnet account state, generic mandate labels and real historical Explorer links. Its temporary tab was then closed.

The new profiling runs use **disconnected headless Chromium 149.0.7827.55**, 1440×900, DPR 1, fresh contexts, the real public Devnet RPC and actual accounts. **No Phantom provider, mock adapter, keypair or wallet address was injected.** Forbidden transaction/airdrop requests were blocked by the harness; none was attempted. Zero runtime/console errors. Both Command routes returned HTTP 200. Public/local hosting and variable RPC latency make these observed samples, not a statistical INP/FPS benchmark or genuine Phantom proof.

Each run sampled cold account reads, 75 s history/loading, 20 s steady Command idle, Arena navigation, 20 s Arena idle, four repeated App/Arena transitions, Story idle and reduced-motion Story idle. CPU/layout/style data came from browser Performance metrics; long tasks and React commits were observed by the same instrumentation in both runs.

## Fresh before → after measurements

Before is the CURRENT public frontend; after is the CURRENT local candidate. The candidate fixes already exist in `67ccb16`; no new runtime patch was introduced during this read-only gate.

| Observation                                                | Public production | Local candidate |
| ---------------------------------------------------------- | ----------------: | --------------: |
| Account-read phase, after initial document navigation      |          15.622 s |         9.514 s |
| Navigation through account readiness, including hosting    |          19.395 s |         9.855 s |
| RPC through first account readiness                        |                14 |              10 |
| Cold main-thread task time                                 |        435.064 ms |      299.849 ms |
| Cold layout time                                           |         34.220 ms |       34.340 ms |
| Cold long tasks                                            |        One: 87 ms |      One: 65 ms |
| History/loading + 75 s: RPC / getTransaction               |           34 / 16 |         38 / 16 |
| Same window: React commits / long tasks                    |             4 / 0 |          20 / 0 |
| Steady Command 20 s: RPC / task time                       |   15 / 185.277 ms | 12 / 104.362 ms |
| Arena route readiness                                      |            136 ms |           89 ms |
| Arena idle 20 s: RPC / task time                           |   17 / 168.062 ms |   8 / 76.772 ms |
| Four repeated route transitions, total                     |            320 ms |          274 ms |
| Story idle 10 s: React commits / RAF / canvas / animations |     0 / 0 / 0 / 0 |   0 / 0 / 0 / 0 |
| Reduced-motion Story idle 10 s: same counters              |     0 / 0 / 0 / 0 |   0 / 0 / 0 / 0 |

History is progressively published in the candidate while account freshness continues independently. Its increased cold history-window requests/commits are explicitly retained; this is **not** a claim that every network or render count improved. Neither history/steady-idle window had a long task. Route-entry animations finish: one animation was briefly present during navigation, zero during subsequent idle. No horizontal overflow was observed.

Raw phase measurements are preserved in [gate1-performance.json](gate1-performance.json). Temporary harness, full request/error records and four fresh Command/Arena screenshots are in ignored `target/gate1-20261007/`; no existing captures were overwritten.

All four fresh screenshots were opened and visually reviewed: public/local Command and public/local Arena. They confirm the previously committed candidate's graph, identity and receipt readability changes. These are read-only baseline captures of actual account reads and historical receipts, not a new visual pass or browser-signing proof.

## Cause assessment

| Candidate cause                                       | What is established now                                                                                                                                                                                                                                                |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RPC waterfall / repeated deployment reads             | Confirmed in the old public source and fresh 14-request read; the existing candidate uses one verification and 10 requests. Most cold elapsed time is network/pacing, not main-thread execution.                                                                       |
| Blocking history / cache churn on connect             | Confirmed by previous source audit; the unpublished stable-reader/progressive-history fix exists. Its effect with REAL Phantom still requires reproduction. Older mock-connect measurements are not promoted to genuine proof.                                         |
| Polling / stale scheduling                            | Current source uses single-flight reads, completion-based 15/30 s timers, hidden-tab pause and cancellation checks. Measured idle shows bounded reads rather than a tight refetch loop. Background/foreground with the owner's connected extension remains unverified. |
| React loop                                            | Not observed disconnected. History commits correspond to progressive receipts; no permanent commit loop demonstrated.                                                                                                                                                  |
| Motion / SVG / WebGL                                  | No idle RAF, running animation or canvas in sampled states. Current Story is SVG; it does not run an R3F renderer. Layout remained tens of milliseconds, not multi-second freezes.                                                                                     |
| Duplicate wallet subscriptions / provider event storm | Genuine extension unavailable; cannot confirm or rule out provider-specific behavior from disconnected measurements. Source cleanup exists, but source inspection is not native-wallet evidence.                                                                       |
| Genuine after-connect UI freeze                       | **Not reproduced or ruled out.** Needs the owner's actual Chrome/Phantom session.                                                                                                                                                                                      |

No additional runtime correction is justified by this run alone. No indexer/database/API, SDK, reference-agent work, visual refinement or speculative memoization was added.

## Gate status and next single step

**Proven:** current repo/production provenance; preserved submission/production; fresh disconnected comparisons for App/Arena, route switching and idle; no new on-chain writes; existing candidate improves the confirmed read waterfall.

**Not proven:** genuine Phantom connected/disconnected comparison, wallet-provider behavior, connect stabilization, or fresh browser signing. Gate 1 cannot be closed or called fully passing without the missing connected observation. No Gate-completion checkpoint or immutable submission tag is created while this remains open; HEAD is preserved and these audit documents await that checkpoint.

**Next single step:** expose the owner's Chrome/Phantom to the browser tooling and compare the public baseline with `http://127.0.0.1:3101/app` and `/arena`, using only connect/disconnect, reads, route switching and idle. No transaction approval at this stage. The owner has already been asked for browser availability; no keys/seed/export are required. If direct access stays unavailable, an owner-recorded Chrome Performance trace is an alternative for the connected CPU/provider portion and must be clearly labeled owner-recorded.

Only after Gate 1 closes: prepare each Gate 2 action with signer, Devnet/program, precise amount/destination, state change, fresh fee/rent estimate and evidence plan; then wait for explicit approval. Gate 3 has at most two visual passes after stable real-wallet state. Gate 4 freezes the actual final verified HEAD/public deployment, and **only then** Gate 5 branches `startup-v1` from that exact HEAD.
