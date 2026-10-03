# MandateOS surgical cinematic polish

Implemented against the existing `submission-v1` checkout, baseline commit `651d531`. Routes, Authority Chamber colors/type, shared-vault accounting, Core/Arena instructions, wallet providers, and Anchor integration remain intact. No Rust, IDL, dependency, lockfile, or deployment changes.

## 1. Exact files changed

| File                                    | Change                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web/src/components/story-world.tsx`    | One mounted authority world; native-scroll chapter controller; explicit, cancellable construction; trace, preview, confirmed cascade and flattening handoff. |
| `web/src/components/authority-tree.tsx` | Shared geometry, stable node keys, ancestry traversal, responsive copper contour, depth propagation and a correctly nested mobile ledger.                    |
| `web/src/lib/authority-layout.ts`       | Canonical coordinates shared by Story and Command, fallback geometry and parent-based ledger order.                                                          |
| `web/src/components/capital-number.tsx` | Exact BigInt delta interpolation between observed values; authoritative accessible amount; no initial count-up.                                              |
| `web/src/components/command-world.tsx`  | Existing amount fields use the exact number primitive; action and transaction code remains unchanged.                                                        |
| `web/src/components/arena-world.tsx`    | Lifecycle-dependent execution field, explicit unpaid verifier preview, gate aperture, atomic outcome and observed Root available capital.                    |
| `web/src/app/experience.css`            | Scoped composition/density refinements, semantic motion tokens, flat mobile and reduced-motion behavior.                                                     |
| `web/src/app/layout.tsx`                | Imports the scoped experience stylesheet after the existing stylesheet.                                                                                      |
| `tests/authority-ui.ts`                 | Geometry persistence, full-tree fit and subtree-contiguous mobile ledger checks.                                                                             |
| `scripts/verify-experience.mjs`         | Repeatable real-browser acceptance checks, screenshots, recordings and optional Chrome trace.                                                                |
| `scripts/record-browser-stream.mjs`     | Records actual Chrome JPEG frames and timestamps, then encodes offline to avoid the Windows live-encoder backpressure failure.                               |
| `scripts/measure-experience.mjs`        | Production frame/long-task/CLS sampling with real pointer input and capture streaming disabled.                                                              |
| `docs/SURGICAL-POLISH.md`               | This implementation and evidence report.                                                                                                                     |

## 2. Exact motion mechanics

The installed implementation has React, DOM, SVG and CSS motion, with a bounded rAF number primitive. There is no installed Motion package. Those existing platform mechanisms were retained; no second animation runtime was added. Source mechanics were independently authored for MandateOS rather than copying a library component.

| Event                    | Mechanic                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delegate                 | SVG `pathLength="1"`, normalized `stroke-dashoffset` construction over 320 ms, plus a one-shot 0.12-length traversal. The child plate resolves with clipping/12 px translation over 240 ms, starting at 280 ms.                             |
| Full hierarchy           | Each authority relation is constructed 400 ms apart. Root-first full build is interruptible and finishes in 2,240 ms; after the initial Research grant the remaining build finishes in 1,840 ms.                                            |
| Amount change            | 240 ms cubic-out interpolation using integer base units and BigInt arithmetic. DOM text updates avoid React renders on every animation frame. The accessible value is always the exact authoritative target.                                |
| Trace                    | Reverse SVG path resolution over 140 ms per relation, offset in 70 ms ancestry steps; complete Root-first readable ancestry accompanies the field. Unrelated paths recede.                                                                  |
| Blast Radius             | One copper contour drawn over 360 ms around Research, Data, Analysis and Scraper. All six mandates remain active.                                                                                                                           |
| Cascade                  | Research inbound break marks resolve over 120 ms. Effective blocking propagates in 80 ms depth steps, capped at 640 ms, with 320 ms state-color/stroke changes. No descendant account mutation is invented.                                 |
| Plane change             | The same mounted Story surface rotates from 18° to flat over 560 ms before navigating to Command. Command uses the same renderer and canonical geometry, with its own actual mode/account state. Story fiction is never copied into Devnet. |
| Selection/evidence       | One border and selection rail; 140 ms selection changes; 200 ms receipt clipping. No repeated card entrance or hover scaling.                                                                                                               |
| Arena funding            | Observed lifecycle change activates a one-shot 420 ms capital traversal and expands the mission region.                                                                                                                                     |
| Arena submission/preview | Submission paths construct over 240 ms and use neutral dashed strokes. An explicit candidate preview uses copper and remains unpaid.                                                                                                        |
| Arena settlement         | The verifier aperture opens over 320 ms; a distinct brass payout traversal runs for 480 ms after that aperture, only after observed/simulated atomic settlement. The receipt says verified and settled in one operation.                    |

Construction callbacks are invalidated on reset, chapter change, rapid selection, document hiding and unmount. No perpetual animation or motion-completion-driven accounting is introduced. Reduced motion shows complete static state immediately and disables perspective, travel and number interpolation.

## 3. Browser PASS 1 findings

Actual development localhost interaction verified persistent Root/world DOM identity, all six mandates, complete Scraper ancestry, all-active preview, one local revoke with three effectively blocked descendants, and unchanged Operations DOM/rectangle/capital. Command showed the full tree above evidence. Arena preview remained unpaid and settlement produced one atomic receipt.

PASS 1 had 26 passing state/layout checks and four page-overflow defects: desktop Story, 768 px Story, 768 px Command and 1024 px Story. Visual inspection also found cramped plate status text, undersized Treasury ledger amounts, a displaced SVG cut marker, a payout line crossing receipt text, and mobile headline break spacing.

Live baseline screenshots were captured before edits. Baseline interaction videos replay the archived original commit after the Windows recording workaround became available. Existing grant path construction, exact amounts, preview semantics and proof labels were retained and refined.

## 4. Refinements made

- Contained projected and initial-resize overflow without changing tree topology.
- Increased Root plate height, aligned its outbound port, and corrected plate padding and numeric line height.
- Restored the Treasury amount hierarchy through nested number spans.
- Moved cut-mark animation to the circle so it no longer overwrites the SVG group's coordinate transform.
- Routed payout to the receipt's top edge, keeping evidence text unobstructed.
- Clarified preview forecast wording and removed stale construction deltas from later chapters.
- Preserved explicit mobile headline breaks.
- Full-height mobile inspection exposed creation-order ambiguity. The ledger now follows actual parentage: Treasury → Research → Data → Scraper → Analysis → Operations.
- Corrected a pre-existing mobile Arena treatment that styled the default candidate as a winner before settlement. Brass winner treatment now requires settled state.
- Browser checks wait for native smooth scrolling to complete and test visible keyboard focus within the document's tab order. Full-document mobile captures start at scroll zero to avoid embedding the sticky header mid-image.

## 5. Browser PASS 2 findings

Production localhost: **42 state/layout/focus assertions passed, plus six successful independent recordings**. No browser console or page errors were reported. New captures were generated after refinements; PASS 1 images were not reused.

Verified:

- One Story world and Root node survive every chapter.
- Delegation constructs the complete real canonical relationships.
- Trace resolves Treasury → Research → Data → Scraper.
- Copper preview leaves every node active.
- Confirmation cuts Research, blocks three descendants and leaves Operations at exactly the same rectangle with 200.00 USDC own available.
- Backward navigation does not revive authority; reset cancels outstanding construction.
- Revoke releases capacity to Treasury while the shared vault remains 1,590.00 USDC; reclaim remains separate.
- Command remains flat, with Scraper fully above evidence and complete trace/proof.
- Arena distinguishes unfunded, funded, submitted, unpaid verifier preview and atomic verified/settled outcome. Failed funding leaves the unresolved field intact.
- Mobile ledger parentage, unpaid preview and atomic payout remain understandable under reduced motion.
- Escape closes preview and restores focus; keyboard focus has a visible 2 px outline.
- Devnet displays no invented balances. Story's plane handoff preserves the user's Devnet mode. Wallet menu opens/closes with focus restoration.

## 6. Production performance observations

Actual production sampling on Windows, Headless Chrome 154, eight logical processors. Capture streaming was disabled. These are desktop-host measurements; the mobile viewport is not a physical midrange phone.

| Sample                                         | Frames | Median interval | p95 interval |     CLS | JS long tasks >50 ms |
| ---------------------------------------------- | -----: | --------------: | -----------: | ------: | -------------------: |
| Desktop idle, 1440×900                         |    143 |         17.7 ms |      18.4 ms |       0 |                    0 |
| Desktop construction/trace/preview/cascade     |    299 |         17.7 ms |      18.4 ms | 0.00015 |                    0 |
| Mobile idle, 390×844                           |    122 |         17.7 ms |      18.3 ms |       0 |                    0 |
| Mobile flat construction/trace/preview/cascade |    282 |         17.8 ms |      18.3 ms | 0.01221 |                    0 |

Desktop **misses the 16.7 ms p95 target** on this host; idle and animated p95 are equal. The emulated mobile viewport is below the 22 ms target. Occasional host frame stalls occurred, including 248.8 ms while idle and 214 ms in the mobile flow, without JS long-task entries. No claim of guaranteed 60 fps or physical-phone performance is made. Effects remain limited to one perspective surface, SVG strokes and bounded numeric text updates; no filters, renderer or idle rAF loop was added.

An earlier synthetic-click probe counted deliberate chapter changes as unexpected layout shifts (mobile 0.2492). The final probe uses actual pointer input, preserving the browser's `hadRecentInput` classification. Both raw results are retained.

Route JS compares the final static export against a separately built archive of baseline commit `651d531`, using deduplicated HTML script assets and gzip per asset:

| Route          | Baseline gzip bytes | Final gzip bytes | Added gzip bytes |
| -------------- | ------------------: | ---------------: | ---------------: |
| Story `/`      |             333,499 |          337,943 |        **4,444** |
| Command `/app` |             337,227 |          339,638 |        **2,411** |
| Arena `/arena` |             341,236 |          344,159 |        **2,923** |

Every route is below the 35 KB added-JS budget. Existing Anchor/wallet payloads are included in the totals. A real Chrome trace for Story and handoff is saved separately; captures and trace profiling are not used as the isolated FPS sample.

## 7. Mobile and reduced motion

All three routes were inspected at 320, 390, 768, 1024 and 1440 CSS px, without page horizontal overflow. Below 768 px, Story is a flat normal-flow persistent nested ledger with chapter controls; no perspective or long sticky runway is required. Touch actions have at least 44 px targets.

Reduced-motion Story trace, all-active preview, cascade/rejection, reset interruption and Arena preview/atomic settlement were exercised. The full ancestry and accounting proof remain available as text. A 720×450 CSS viewport was checked as the layout equivalent of 200% desktop zoom; native browser zoom itself was not measured. Physical iOS/Android performance and extension signing are not verified by this headless browser run.

## 8. Preserved Core/Arena integration and checks

The shared vault, available/subtree formulas, complete ancestry, local revoke with effective ancestor blocking, Root-only reclaim, Arena Root reservation and atomic payout use the existing selectors and clients. Core action handlers, stale-review checks, instruction builders, transaction phases, PDA/IDL code, provider/signer logic and Rust remain unchanged. A visual preview never writes financial state. There is no new intermediate verified protocol state.

Executed checks:

- `cargo fmt --all -- --check`: passed on supported Windows Rust 1.89 GNU toolchain.
- `cargo check --locked`: passed.
- Root `npm run typecheck`: passed.
- `npm run test:local`: passed, **64 real validator tests**, eight isolated batches of eight tests. Coverage includes full ancestry, sibling survival, reclaim/reservation protection, checked arithmetic, CPI rollback, trusted verifier, winner eligibility and atomic settlement failure.
- `npm run test:ui`: **12 passed**.
- Web `npm run lint`, `npm run typecheck`, `npm run build`: passed; all existing routes statically exported.
- Changed-file formatting and `git diff --check`: passed.
- Secret scan after staging: passed for 101 tracked files. Keys, `.env`, build output, recordings, validator ledgers and copied baseline stay ignored.

The pre-existing bigint native-binding warning falls back to the existing pure-JS implementation; build and validator checks passed.

## 9. Git checkpoint and evidence

Commit title: `Polish persistent Authority World and mission execution field`. The final response provides the generated commit SHA. This checkpoint contains only the 13 files listed above; media, trace and generated wallets are excluded.

Evidence is local under `artifacts/surgical-polish/`:

- Before: `baseline-story.jpg`, `baseline-command.jpg`, `baseline-arena.jpg`, `baseline-mobile.jpg`.
- Baseline videos: `baseline/story-arena-1440.mp4`, `baseline/story-arena-390.mp4` (archived original commit).
- PASS 1: `pass1/results.json`, screenshots, `story-short.mp4`, `handoff.mp4`, `command-cut.mp4`, `arena.mp4`, `mobile-reduced.mp4`. `story-short.mp4` removes the cached-frame idle lead-in from the original actual-frame recording.
- PASS 2: `pass2/results.json`, screenshots, `story.mp4`, `handoff.mp4`, `command-cut.mp4`, `arena.mp4`, `mobile-reduced.mp4`, `mobile-arena-reduced.mp4`.
- Full mobile proof: `pass2/reduced-cascade.png`, `pass2/mobile-arena-preview.png`, `pass2/mobile-arena-settled.png`.
- Performance: `performance.json`, `performance-synthetic-input.json`, `bundle-comparison.json`, `pass2/story-handoff.trace.json`.
- Devnet audit: `devnet-audit-current.json`.

To reproduce, start the existing production preview, bootstrap an agent-browser session, set `AGENT_BROWSER_BIN` to its executable, then run:

```text
node scripts/verify-experience.mjs pass2 http://127.0.0.1:3000
node scripts/measure-experience.mjs http://127.0.0.1:3000
```

Recordings additionally require ffmpeg on PATH. `QA_CAPTURE_TRACE=1` records the Chrome trace. QA tools are outside the application dependency graph.

## 10. Remaining blockers

**Devnet readiness is blocked independently of design acceptance.** The read-only audit at 2026-10-03 09:29:42 UTC verified Devnet genesis, then found program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63` absent/non-executable. The checked-in IDL address and nine-instruction Core/Arena ABI also differ from the required deployment/address/ABI. Existing transaction gates remain disabled. No deployment, IDL change or fabricated chain evidence was used to bypass this.

**The desktop 16.7 ms p95 performance target remains unverified on faster hardware and unmet on this host.** Physical-phone performance, native 200% browser zoom and extension wallet signing require their respective real environments. Local validator integration and independent browser design acceptance are complete.
