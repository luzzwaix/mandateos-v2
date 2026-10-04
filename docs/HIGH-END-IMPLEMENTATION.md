# Authority Loom implementation

## Direction contract

THESIS: One organization becomes physical recursive authority, then a precise financial instrument.

OWN-WORLD: Graphite open structural frames, active mint conduit, copper impact enclosure, one red ancestor cut. Bone inspection; brass only after settlement.

STORY: Build Research, expand its descendants, trace Scraper, preview, confirm, operate the same selection.

FIRST VIEWPORT: Condensed bone and mint headline at left; monumental procedural Root structure occupies the right two thirds. Delegate Research below the copy.

FORM: User-pinned Authority Loom and seven approved frames; no direction roll or alternative exploration.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Sources of application state

- Story: existing `genesis(count)` / `revokeDemo` simulation; never chain evidence. Renderer receives this model read-only.
- Command: World provider fixture or `fromSnapshot` from direct-RPC account reads. Existing actions use the Anchor client and complete ancestor paths.
- Arena: World mission lifecycle and fixture reservation/atomic settlement, or observed bounty/submission accounts. Preview is unpaid and settlement is atomic.
- Wallet and transaction phases: existing `useConsole`, World provider, and EvidenceLedger.

Baseline: commit `49ade90`, Headless Chrome 154, 1440×900, localhost:3000. Existing uncommitted `docs/SPATIAL-DIRECTOR.md` is preserved separately.

Rendering: R3F/Three lazy-loaded only in Story/Arena. One bounded native director clock; no GSAP, Motion, Lenis, audio, postprocessing, stock models, or reference PNG in shipping assets. Anton is the single added, self-hosted display face (SIL OFL, included with package).

## Exact changed files

| File                                         | Change                                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `web/package.json`                           | Pinned R3F, Three, Three types, one self-hosted Anton display font.                                             |
| `web/package-lock.json`                      | Corresponding dependency lock.                                                                                  |
| `web/src/app/layout.tsx`                     | Local display-font import and scoped Loom stylesheet.                                                           |
| `web/src/app/loom.css`                       | Story/Arena composition, flat Command, inspector density, responsive/native fallback, focus and reduced motion. |
| `web/src/components/loom-scene.tsx`          | Original procedural meshes, curves, materials, lighting, shared bounded director and camera/DOM projection.     |
| `web/src/components/spatial-loom.tsx`        | Lazy desktop scene boundary, exact native annotations, fallback and real context-loss recovery.                 |
| `web/src/components/flat-authority-tree.tsx` | Flat operational nodes/paths, canonical layout and contiguous mobile ledger.                                    |
| `web/src/components/story-world.tsx`         | Existing construction sequence connected to the Loom, immediate native outcomes, matched Command handoff.       |
| `web/src/components/command-world.tsx`       | Native tree, readable full inspector/path, integrated evidence freshness/reset rail.                            |
| `web/src/components/arena-world.tsx`         | Read-only spatial execution field around the existing mission actions.                                          |
| `scripts/verify-loom.mjs`                    | Real-browser flow, screenshot and recording verification.                                                       |
| `scripts/measure-loom.mjs`                   | Browser frame-interval, long-task, CLS and idle-render observations.                                            |
| `scripts/verify-loom-resilience.mjs`         | Interrupted construction, live resize, reduced motion, actual GPU loss and keyboard checks.                     |
| `scripts/build-loom-comparison.mjs`          | Development-only side-by-side comparison of all seven supplied targets and real captures.                       |
| `docs/HIGH-END-IMPLEMENTATION.md`            | This implementation and verification record.                                                                    |
| `DESIGN.md`                                  | Refreshed design system extracted from the implemented Authority Loom.                                          |
| `.impeccable/design.json`                    | Matching machine-readable design record and native component examples.                                          |

The user's pre-existing `docs/SPATIAL-DIRECTOR.md` changes are deliberately excluded from the implementation commit. No Rust, account model, IDL, wallet adapter or Anchor transaction client files were changed.

## Implemented motion mechanics

All scene motion consumes existing state through a single event-bounded `requestAnimationFrame` director and R3F `frameloop="demand"`. At rest, the frame counter stops. Camera, physical frame, conduit reveal and native label projection read the same director progress; there are no independent looping clocks.

| Event             | Implemented mechanics                                                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Genesis           | Only Treasury exists in the model and visible structure. Its open frame supplies the initial silhouette.                                                                                                                                                                   |
| Delegate Research | 1150 ms. Static rounded conduit uses a UV growth mask first; Research constructs from the endpoint after 35% progress; exact amount and DOM annotation lock after 88%.                                                                                                     |
| Recursion         | Four 450 ms additions from the existing fixture: Operations remains Root's sibling, Data/Analysis belong to Research, Scraper belongs to Data. Geometry and rails are derived from actual parent IDs.                                                                      |
| Trace             | 800 ms. Complete Treasury → Research → Data → Scraper path gains ordered illumination. Operations stays visible with restrained contrast. One-shot pulse width is 0.055 of normalized path length.                                                                         |
| Blast Radius      | 950 ms. Twelve copper wires draw a true spatial enclosure of the Research branch. Preview changes no local or effective status. Operations is outside the enclosure.                                                                                                       |
| Cascade           | 1400 ms. One red mark cuts Research inbound authority. Descendant illumination falls by actual depth, staggered 140 ms per level. Structure survives; Operations camera, geometry and authority are unchanged.                                                             |
| Plane change      | 1150 ms, route handoff after 1200 ms. Existing meshes compress toward shared operational anchors; projection blends to an actual orthographic camera. The same native labels/parent relations settle into flat coordinates; selected mandate and demo state reach Command. |
| Arena             | State-driven bounded rail growth and one traversal per action. Capital is mint, submissions remain neutral until decision preview, preview is copper and unpaid, the selected settlement route is brass only after existing atomic settlement.                             |

Exact amounts use the existing BigInt formatter. Values resolve from committed fixture or observed account state; animation never calculates balances or rolls through invented intermediate money. Reduced motion/mobile commit the same final state immediately. Normal pose uses smoothstep, with no camera spin, hover scale, card entrance sequence or continuous ornament.

The final material uses fine deterministic procedural height variation on graphite PBR surfaces, a controlled rear-left key, a single soft shadow map and finite local area-light strips. The six canonical authority light slots remain allocated with zero intensity for absent mandates, avoiding a shader light-count change during delegation. Their intensity and transforms follow the actual constructed/effective structure. All generated geometry, material, height texture and procedural environment resources are disposed on teardown.

## Browser PASS 1 findings and corrections

PASS 1 ran the actual production export at `http://127.0.0.1:3000`, Headless Chrome 154 on Windows, 1440×900 plus 1280×800, 768×900 and 390×900. Seven named desktop states and the three responsive routes were captured in `artifacts/high-end/pass1/` and compared with every supplied frame.

- The first authority channels were too thin/dark; overlapping parent ports obscured hierarchy. Channels now have a dark physical carrier, distinct sibling ports and a narrow semantic core.
- The impact enclosure crossed Operations in screen space; the cut marker was concealed by frame mass. The boundary and actual inbound cut were corrected while retaining live sibling geometry.
- The first light/material pass flattened depth. Lighting, restrained edge response, procedural surface relief and local area lights were revised within the pinned direction.
- Plane change had opaque label tiles and a late camera discontinuity. Native annotations now settle without tiles, geometry uses the same anchors as Command, and projection finishes with a real orthographic camera.
- Arena annotations collided with mission copy or clipped the right edge; repeated panel anatomy obscured the physical lanes. Anchors, endpoint alignment and the native instrument were corrected.
- Scraper extended into the evidence region, and Command's floating freshness controls competed with the summary. All six nodes now fit above evidence; freshness/reset lives in the evidence rail.
- Narrow desktop, tablet and reduced-motion layouts exposed clipping and an action covered by chapter controls. Responsive type, normal-flow fallback controls, immediate native construction and a contiguous depth-indented ledger fixed those failures.

## Browser PASS 2 evidence

The final production screenshots, direct browser recordings and checks are under `artifacts/high-end/pass2/`:

| Approved target       | Real production screenshot |
| --------------------- | -------------------------- |
| 01 — Arrival          | `01-arrival.png`           |
| 02 — Organization     | `02-organization.png`      |
| 03 — Blast Radius     | `03-blast-preview.png`     |
| 04 — Cascade          | `04-cascade.png`           |
| 05 — Plane change     | `05-plane-change.png`      |
| 06 — Command active   | `06-command-active.png`    |
| 07 — Arena settlement | `07-arena-settlement.png`  |

`trace.png`, `arena-funded.png`, `arena-preview.png`, all responsive screenshots and reduced-motion screenshots supplement those seven. `story.mp4` and `arena.mp4` record actual browser frames and timing. `artifacts/high-end/comparison.html` displays every concept beside its real production capture, with PASS 1 available for comparison. References are used only by this ignored development artifact, never by a route or public bundle.

The browser checks cover persistent Root/world identity; six projected labels in bounds; complete Trace; all-active preview; one local revoke and three blocked descendants; stationary Operations; no implied token transfer; rejection of blocked demo spend without fabricated transaction; selected/blocked state reaching Command; a flat six-node tree above evidence; full operational ancestry; focus restoration; unpaid Arena preview; one atomic simulated payout; idle render termination; nine responsive route/viewport combinations; native reduced-motion outcomes; missing Devnet accounts without demo substitution; and wallet-menu keyboard focus.

All 31 browser assertions passed. The two recordings are real browser frame streams, not synthetic animation exports.

### Resilience and accessibility

`artifacts/high-end/resilience/results.json` records 11 checks using actual browser interactions, including `WEBGL_lose_context.loseContext()` rather than a simulated React error. Both Story and Arena recover to usable native state with no rendering loop; funding/submitting/choosing/settling still works after Arena GPU loss. Interrupting delegation cancels outstanding additions and resolves the committed model. Live desktop/mobile/reduced-motion switches preserve state. Keyboard Space selects Scraper and the inspector shows its complete lineage.

Below 1100 px, and whenever reduced motion is requested, the explanatory object is a native depth-indented ledger and Arena is a native execution field. Financial labels/actions remain independent of perspective and WebGL. Every node is a real focusable button; preview/cancel and wallet closing restore focus.

## Performance observations

Final measurements are recorded in `artifacts/high-end/performance.json`. The measurement uses the production browser without video-stream or screenshot overhead, observing desktop idle, the complete Story sequence, Arena lifecycle and mobile Story. It starts after initial page settlement, so it is a warm-flow observation, not a cold-load or GPU benchmark. Chrome reported Intel UHD Graphics 630 / ANGLE D3D11 and eight logical CPU cores.

| Observed flow       | Median frame interval | p95 interval | Long tasks       | CLS      | Canvas scale at end   |
| ------------------- | --------------------- | ------------ | ---------------- | -------- | --------------------- |
| Desktop idle        | 17.7 ms               | 18.4 ms      | 0                | 0        | 1                     |
| Full Story sequence | 35.0 ms               | 36.6 ms      | 2: 189 and 83 ms | 0.000292 | 0.5                   |
| Arena lifecycle     | 17.8 ms               | 18.7 ms      | 2: 76 and 127 ms | 0        | 0.5                   |
| Mobile Story        | 17.8 ms               | 18.5 ms      | 0                | 0        | Native DOM, no canvas |

The unbudgeted full-resolution area-light pass was too costly on this integrated GPU (Story p95 125.7 ms, Arena 71.9 ms). A render budget now observes only already-requested frames and reduces geometry resolution after four valid intervals whose upper median exceeds 36 ms: `1 → 0.75 → 0.5625 → 0.5`. The scale persists across model changes; it never runs an idle benchmark. Native labels, financial values, controls and SVG remain at full CSS resolution with the same camera projection. This improves observed movement at the cost of softer spatial geometry on a weak GPU. The measured long tasks above remain a real limitation; the implementation does not claim a flawless 60 FPS experience or zero transition cost.

Demand rendering stopped after every measured sequence. No WebGL is mounted in Command or the mobile/reduced-motion fallback. Canvas scale is bounded to 0.5–1; one 1024 shadow map, tiny generated material textures, static path geometry and disposable procedural environment avoid image/model downloads and continuous render cost.

## Preserved integration and validation

Core remains one shared SPL vault with bounded accounting authority. Delegation uses the parent's own available capacity; spending validates the complete ancestry; stale locally-active descendants remain effectively blocked. Revoke releases Research's remaining 390.00 fixture capacity to Treasury, but is not a token transfer. The shared fixture vault remains 1590.00; stored descendant records are preserved. Reclaim remains a separate existing operation.

Arena still reserves only Root available capacity and pays from the existing vault through the trusted verifier's atomic settlement. UI verifier preview remains unpaid; there is no invented intermediate protocol state. Story-to-Command demo transfer does not overwrite an independently reserved Arena mission or observed Devnet accounts. Transaction phases, direct RPC, Anchor instructions, dynamic ancestor arrays, wallet signing and EvidenceLedger remain the existing integration.

Executed validation:

- Web: `npm --prefix web run lint`, `npm --prefix web run typecheck`, `npm --prefix web run build`.
- Root: `npm run typecheck`, `npm run test:ui` — 15 passing.
- Real disposable validator: `npm run test:local` — 64 passing integration tests, eight batches, including Core ancestry/accounting and Arena atomic payouts/rollback.
- Rust: `cargo fmt --all -- --check`, `cargo check --locked` with `1.89.0-x86_64-pc-windows-gnu` — passing; no Rust edits.
- Browser: `node scripts/verify-loom.mjs pass2`, `node scripts/measure-loom.mjs`, `node scripts/verify-loom-resilience.mjs` against production localhost.
- Repository: `npm run check:secrets` and `git diff --check` before commit.

The build emits the incumbent optional bigint native-binding warning and uses its pure-JS fallback. This is not a build/test failure.

## Remaining blockers and review scope

The pre-existing Devnet deployment gate remains: the configured expected program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63` was missing/non-executable during the read-only audit; the local generated IDL points at another program. The app correctly leaves transactions disabled and shows no fabricated Devnet balances/signatures. Live wallet/program settlement cannot be certified in that environment; disposable local-validator integration is verified.

The fresh Impeccable finish reviewer scored the five named correction groups resolved: channels/cut/impact, depth/plane continuity, Arena composition, responsive layout and Command. Its last verdict was `disposition: ship`, specifically closing the material/lighting item. This is a verdict on those named fixes, not a whole-surface pixel-identity claim. A fresh documenter recorded the actual code in DESIGN.md and its matching sidecar after the final performance correction.

The remaining visual difference is explicit: procedural surfaces are more even and matte, reflections simpler, and lighting less cinematic than the approved photorealistic concept frames. On this integrated GPU, the budget also softens rendered geometry during demanding movement; all text remains native and sharp. No reference raster is shipped. The remaining external integration blocker is the existing Devnet program deployment gate above.
