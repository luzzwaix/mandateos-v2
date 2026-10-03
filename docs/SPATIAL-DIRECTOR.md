# MandateOS spatial director — implementation and verification

Implemented on `submission-v1` against clean baseline `94a324b3fb3014950af51a8ec4afb990db1fc2af`. The user's bounded-spike gate takes precedence over the attached spec's unconditional R3F choice. No art-direction exploration, deployment, push, Rust change, account-layout change, or integration replacement was performed.

## Spike decision: abort WebGL expansion

The isolated Treasury → Research spike used compatible pinned `@react-three/fiber` 9.8.1 and `three` 0.186.1, a Story-only dynamic import, an orthographic camera, actual hierarchy Z, projected native labels, thin shared meshes, and demand rendering. It was opened in real Chrome at 1440×900 and recorded alongside the committed DOM/CSS baseline.

Initial projection/stacking defects were repaired before the final comparison. The warm browser probe then showed connector growth before plaque resolution, five draw calls, 24 triangles, no recorded JS long tasks, and an unchanged render counter after the action settled. Forced context loss restored the existing DOM tree with Treasury 1,200.00 and Research 390.00 intact. The canvas read the same node objects and selectors; it owned no financial state.

| Gate                        | Finding                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| More memorable hierarchy    | **Not clearly superior.** The angled plaque offered little additional authority comprehension over the existing precise tree.      |
| Perfectly readable labels   | **Failed visually.** Projected centers aligned, but the tilted physical edges crowded/intersected flat amount/status label bounds. |
| Product-driven interaction  | Warm connector-first traversal and endpoint resolution passed.                                                                     |
| Fallback intact             | Forced context-loss recovery preserved native controls, balances and statuses.                                                     |
| Stable performance          | Warm demand rendering stopped at idle; no production WebGL p95 claim is made from this bounded probe.                              |
| No duplicated product state | Passed: read-only selector/node references; no renderer-owned account state.                                                       |

Because all gates were required, WebGL was removed. Both manifests were restored byte-for-byte to baseline, and `npm prune --ignore-scripts` removed the 15 experimental packages. Spike source, probe and recording remain only in ignored local evidence. The final app has no R3F/Three import, canvas, loading gate or GPU dependency.

## Exact changed files

| File                                    | Change                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/src/lib/authority-world-view.ts`   | Read-only orthographic projection, depth, plaque rims and twelve subtree-volume wires derived from current selectors.                                                |
| `web/src/components/authority-tree.tsx` | Native labels and SVG share anchors; bounded flatten director; impact cancellation; causal edge/rim replay; live reduced-motion preference and small-field fallback. |
| `web/src/components/story-world.tsx`    | Complete cancellable construction cadence; separate explicitly invoked rejection trace; 680 ms route handoff.                                                        |
| `web/src/components/capital-number.tsx` | Quantized intermediate precision and immediate confirmed cascade amounts, preserving exact accessible BigInt values.                                                 |
| `web/src/app/experience.css`            | Screen-flat label registration, thin projected rims, semantic path/volume/cascade timing, normalized dashes, readable metadata, shallow Arena lane depth.            |
| `tests/authority-ui.ts`                 | Three meaningful invariants: original account references/stable coordinates, exact flat recipe, and impact wires excluding Root/Operations.                          |
| `scripts/verify-experience.mjs`         | Configurable evidence directory, complete ≥20-second recordings, and measured Story/Command label handoff.                                                           |
| `scripts/verify-spatial-director.mjs`   | Bounded observations of construction/cascade chronology, precise projection, cancellation, idle frames, reduced motion, narrow hierarchy and interrupted navigation. |
| `scripts/measure-experience.mjs`        | Configurable evidence output and timing matched to complete construction.                                                                                            |
| `docs/SPATIAL-DIRECTOR.md`              | This decision, implementation, evidence and blocker report.                                                                                                          |

## Implemented mechanics

The same keyed native tree survives every Story chapter. Projection encodes hierarchy depth `z = −0.55 × depth`, never capital. Names, balances and actions stay flat DOM. Thin SVG rims, connector bends, and the prism use the same coordinates. Spacious Story fields use projected depth; smaller fields use the flat recipe to keep the Research enclosure clear of Operations. Reduced motion is flat.

- Genesis: mint connector stroke grows from 80–360 ms; child clip/6 px endpoint settle starts at 360 ms and lasts 240 ms. Desktop grant cadence is 720 ms. Mobile uses a 220 ms ledger lineage stroke followed by 100 ms label resolution, with a 360 ms cadence. Reduced motion constructs immediately.
- Recursion: deterministic coordinates remain stable through construction. Research → Data → Scraper deepen; Analysis shares Data's level and Operations keeps independent Root authority. Existing creation/accounting order remains unchanged.
- Trace: reverse SVG traversal has 70 ms ancestor staggering. Spacious Story gets one restrained 10 px/−8 px focus shift over 450 ms. Root and Operations remain readable. Command gets no camera motion.
- Blast Radius: twelve copper wires enclose Research/Data/Analysis/Scraper with label padding. Front constructs for 220 ms, rear/depth connections for the next 160 ms. Cancel uses a bounded 180 ms Web Animation and removes only the decorative wire copy. Every account stays active.
- Cascade: authoritative local/effective labels and exact balances update immediately. Research cut/notch resolves over 90 ms. Downstream structural channels become neutral and correctly dashed; Data/Analysis rims lose authority at 220–340 ms, Scraper at 340–460 ms. Rear volume retracts at 460–620 ms. Rejection traversal starts only when the user invokes the existing simulated blocked spend. Operations geometry, text, opacity and authority are unchanged.
- Plane change: one 520 ms imperative projection clock interpolates the existing labels/paths to Command's actual graph recipe: 144 px rail above the 1280 px breakpoint, existing 336/320 px inspector, map origin at y=176. Native controls stay mounted. Route navigation occurs at 680 ms. All six final label rectangles match mounted Command within 1 px. Cleanup restores labels, paths and rims if interrupted.
- Arena: existing mission plane remains 10°. Submission backplanes use 0/12/24 px Z and 8° perspective while labels stay flat. Existing 420 ms funding, 240 ms submission, 320 ms verifier gate and 480 ms settled payout mechanics remain tied to their existing events. Verification and payout retain one atomic receipt.

The checkout has CSS/Web Animations motion machinery, with no installed `motion` or `framer-motion` package. That existing machinery was retained; no second animation runtime was added. The flatten clock does no per-frame React state update and no frame callback changes account state. A settled browser probe recorded **zero app-scheduled rAF calls over 1.2 seconds**.

Source mechanics were studied, not copied as UI templates: [R3F demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [R3F mutation/resource guidance](https://r3f.docs.pmnd.rs/advanced/pitfalls), [Drei label projection](https://drei.docs.pmnd.rs/misc/html), and [Motion layout continuity](https://motion.dev/docs/react-layout-animations). Tenderly, Apple, Totem, deterministic DAG and the two specified 21st listings were inspected before freezing research. No third-party visual component/source was pasted into the final app.

## Browser PASS 1, critique and refinements

The initial development pass covered all chapters, Command, Arena, widths 320/390/768/1024/1440, keyboard, reduced motion, reset interruption, wallet gates and Devnet separation. The archived first production version was then replayed with a complete 27.623-second silent Story/Command recording. Its handoff endpoint check exposed the coordinate mismatch directly.

Concrete refinements: align SVG height exactly with labels; thin overly thick projected rims from 12 px to 4 px; fix the full-build timer clearing before the final child; match Command's actual map origin/width/breakpoint; restore SVG as well as labels on cancellation; remove the automatic post-cut ancestry traversal; use neutral normalized dashes after blocking; increase metadata legibility; use flat geometry in narrow fields; give mobile its short construction sequence; retain screen-flat Arena text at explicit lane depths.

The early development console includes stale hot-reload messages from adding/removing the spike. These are not treated as production failures or suppressed; clean production passes use fresh browser sessions.

## Browser PASS 2

Final production PASS 2: **48 assertions passed**, complete 24.949-second real Story/Command recording, separate Command-cut, Arena and reduced-motion mobile recordings. Browser errors and console output were empty. Additional director probe: **17 checks passed**.

Measured checks include connector-before-child, fixed two-decimal demo interpolation, exact SVG/label registration, twelve wires excluding Root/Operations, all-active preview, cancel without mutation, immediate exact post-revoke values, depth-ordered rim loss, unchanged Operations, normalized blocked dashes, idle rAF zero, no canvas, reduced-motion flat geometry, full 1024 px hierarchy without collisions, interrupted Story navigation preserving Devnet, and clean re-entry. Actual screenshots were visually inspected after recapture.

All three routes were checked at the five requested widths without horizontal page overflow. Below 768 px the same organization uses the existing nested ledger and direct route handoff. Native controls keep ≥44 px targets. A separate normal-motion mobile recording verifies preview, cascade and unchanged Operations text. The 720×450 CSS viewport tests the layout equivalent of 200% desktop zoom; native browser zoom and physical-phone hardware were not claimed as tested.

## Production performance and bundle

Measurements exclude screenshot streaming and trace profiling. Host: Windows, HeadlessChrome 154, `hardwareConcurrency=8`, emulated viewports.

| Case                     | Samples |  Median |     p95 | JS long tasks |      CLS |
| ------------------------ | ------: | ------: | ------: | ------------: | -------: |
| Desktop idle             |     170 | 16.7 ms | 16.8 ms |             0 |        0 |
| Desktop full interaction |     448 | 16.7 ms | 16.8 ms |             0 | 0.000011 |
| Mobile idle              |     161 | 16.7 ms | 16.8 ms |             0 |        0 |
| Mobile full interaction  |     463 | 16.7 ms | 16.8 ms |             0 | 0.012211 |

Desktop had three intervals above 22 ms, maximum 33.4 ms. Mobile interaction maximum was 17.8 ms. **The strict desktop p95 ≤16.7 ms target is missed by 0.1 ms on this host**, including idle. No guaranteed 60 fps, physical-device performance or production WebGL benchmark is claimed.

Deduplicated HTML script assets, gzip per asset. Baseline totals reuse the retained production measurements for unchanged baseline commit `94a324b`; final totals come from this task's frozen static export.

| Route    | Baseline gzip bytes | Final gzip bytes |  Delta |
| -------- | ------------------: | ---------------: | -----: |
| `/`      |             337,943 |          339,552 | +1,609 |
| `/app`   |             339,638 |          341,230 | +1,592 |
| `/arena` |             344,159 |          345,751 | +1,592 |

There is no lazy WebGL chunk to budget. Existing Anchor/wallet payloads are included. The optional Windows Chrome trace exporter timed out at stop; its incomplete trace is not used as evidence. Actual browser videos, screenshots and independent performance samples succeeded.

## Preserved integration and executed checks

Routes, providers, wallet flow, generated IDL, PDA/instruction builders, complete ancestor accounts, confirmation handling and account selectors remain intact. No Rust or Core/Arena integration file changed. Cut releases **authority capacity** in the labeled demo; the shared vault stays 1,590.00 and reclaim remains independent. No token-recovery pulse or fabricated signature is introduced.

Executed successfully: frontend lint, frontend typecheck, production build, root typecheck, 15 UI/selector tests, `cargo fmt --all -- --check`, `cargo check --locked`, and secret scan. `npm run test:local` built an isolated program and passed **64 real Windows validator integration tests across eight batches**, including sibling survival, stale descendant rejection, complete ancestry, checked accounting, atomic Arena payouts and failure rollback. Workspace: `.localnet/run-1791049088448/workspace` (ignored). Supported Rust toolchain: `1.89.0-x86_64-pc-windows-gnu`.

## Evidence and checkpoints

Local evidence under `artifacts/spatial-director/` is deliberately ignored:

- `baseline/genesis.png`, `baseline/research.png`, `baseline/story.mp4` — current committed DOM/CSS comparison.
- `spike/genesis.png`, `spike/research.png`, `spike/story.mp4`, `spike/context-loss.png`, `spike/probe.json` — bounded WebGL gate.
- `production-review/pass1/story.mp4`, screenshots and `results.json` — archived PASS 1, including the failed endpoint check.
- `pass2/story.mp4`, `command-cut.mp4`, `arena.mp4`, `mobile-reduced.mp4`, `mobile-arena-reduced.mp4`, `mobile-normal.mp4`, screenshots and `results.json` — frozen PASS 2.
- `director-checks.json`, `mobile-normal-checks.json`, `performance.json`, `bundle-comparison.json`, `devnet-audit.json` — independent proof.

Checkpoints: baseline `94a324b`; read-only renderer/fallback adapter `fcbd020`; directed interactions `d2898ec`; final verified refinement/report in the commit adding this report. No push or deploy.

Reproduce with an existing production preview, bootstrapped agent-browser session, `AGENT_BROWSER_BIN`, `QA_BROWSER_SESSION`, and `QA_EVIDENCE_ROOT=artifacts/spatial-director`:

```text
node scripts/verify-experience.mjs pass2 http://127.0.0.1:3000
node scripts/verify-spatial-director.mjs http://127.0.0.1:3000
node scripts/measure-experience.mjs http://127.0.0.1:3000
```

Recordings require ffmpeg. Browser QA tooling stays outside the application dependency graph.

## Remaining blockers

Devnet readiness is independently blocked. The read-only audit at `2026-10-03T18:08:51.173Z` verified Devnet genesis and found required program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63` absent/non-executable, with no published IDL. The existing local IDL address/ABI also differs from that required deployment. Existing transaction gates remain disabled; no deployment or integration mutation bypasses this.

The desktop 16.7 ms p95 budget is narrowly unmet on this host. Physical-device performance, native 200% browser zoom and extension-wallet signing remain environment-specific verification limits. The fallback implementation, local validator integration and browser interaction checks are complete.
