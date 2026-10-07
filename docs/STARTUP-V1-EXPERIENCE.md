# Startup v1 — two visual passes

The 7 October brief explicitly reopened the frontend freeze. Authority Chamber, the existing Story entry, routes, accounting and wallet flow are preserved. No rendering dependency or product surface was added.

Pass 1: inspected fresh desktop/mobile captures before editing. Story construction delayed state/actions to match animation; mobile Command buried hierarchy behind the financial lens; evidence lacked aligned columns; Arena funding/decision provenance lacked a readable sequence. Implemented immediate demo hierarchy state with causal grant travel, a persistent readable Trace/Cascade lineage, authority-first mobile Command and aligned evidence rows, and mission → submissions → verifier → settlement landmarks with finite mobile winner/gate feedback.

Pass 2: inspected implemented captures. Fixed Story's crowded desktop exhibit after inserting lineage; corrected Command mobile heading/ledger rhythm; stopped incidental grant replay during selection. A hidden offscreen fixed skip link appeared in Chromium full-page captures despite its bounding rect being above the viewport. It now stays transparent until keyboard focus (still tabbable), verified with Tab. Capture scrolling is normalized too. Then visual editing stopped.

## Captured and inspected

Fresh 1440×900 and 390×844 Chromium viewport emulation; original full-page PNGs under `target/startup-v1/visual-before`, `visual-pass1-implemented`, and final `visual-final-clean`. No physical handset or real Phantom session was available.

Both widths: Story Genesis, full recursion, Trace, Blast Radius, Cascade; Command active Scraper/path, active revoke preview, blocked Scraper with explicitly simulated rejection, surviving Operations; Arena ready, funded, unpaid selected result, settled simulated receipt. 26 final captures. Actual controls drive every state. Story and demo lifecycle captures are explicitly simulations, never transaction evidence. Real disconnected Devnet account/evidence screens are separately captured by the performance harness.

## Verification

- Production build, frontend typecheck and lint: passing.
- Authority/accounting selectors: 16 passing.
- Surface browser checks: 111 passing at widths 390 / 768 / 1024 / 1280 / 1440. Includes complete ancestry, active pre-confirmation preview, exact blocked/local distinction, stable Operations geometry, unchanged revoke vault, selected settlement, keyboard focus/Escape, reduced motion, empty Devnet gate and zero overflow/errors.
- Operating motion: 10 passing; finite events, route cancellation, preference-change cancellation, added-mandate complete ledger/path.
- New Story browser check: immediate complete hierarchy and enabled next action, same Root DOM node, exact readable lineage, all-active preview, derived blocked descendants, surviving Operations, Tab skip link, idle cleanup/replay; passes normal and reduced-motion modes.
- Impeccable mechanical scan: no findings. React review: no new effect subscriptions without cleanup, no state transition controlled by a timeline, existing real-state selectors and finite scoped cancellation retained.

Motion timings do not establish FPS/INP. No performance regression claim is inferred from screenshots. Fresh disconnected timing/request observations and their limits are in `STARTUP-V1-PERFORMANCE.md`. No signature, deployment, merge or push was performed.
