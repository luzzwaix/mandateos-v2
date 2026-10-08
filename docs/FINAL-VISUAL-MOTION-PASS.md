# Final visual and motion pass — 7 October 2026

Historical working-tree report. The overnight release consolidates this earlier source into Git; this document's old “no commit/deployment” statements describe its own date. See [current release procedure](OVERNIGHT-RELEASE.md).

Implemented locally in `mandateos-visual-pass`, branch `startup-v1-lab`, HEAD `ad46cd13bff664df5d1a834b6a0570df09225de9`. No commit, push, merge, deployment, protocol change or transaction was made. The existing preview at http://127.0.0.1:3101 serves the rebuilt application.

## Result

Story retains the Root-centered Authority Chamber and direct interactive entry. The automatic walkthrough and delayed Command handoff are removed. Grant explains the actual parent-child relation before the child's visual resolution; recursive grants reach Data before Scraper. Trace follows the selected object's real ancestry, including Operations and Analysis. Preview encloses only Research's subtree and leaves all six demo mandates active. Confirmed demo revoke cuts Research and explains descendant blocking by hierarchy, keeping Root and Operations still.

Command now presents Treasury above Research and Operations, Data and Analysis below Research, and Scraper below Data. The graph uses actual identities and actual parent relationships; Analysis is absent from the current five-account Devnet tree and is not fabricated. The adjacent inspector presents local/effective state, controller, complete authority path, earliest invalid ancestor, stored financial amounts, supported actions and evidence provenance. Selecting a node traces its ancestry and updates the inspector immediately. On mobile, selection keeps the graph in view; the explicit Inspect button scrolls to and focuses the inspector.

Arena has a central mission, actual submission lanes, verifier and observed settlement. Submission inspection uses each submission's account identity, works after settlement and never changes the recorded winner. The inspected commitment and account link are separate from the winner and settlement account evidence. Loading an already settled account does not animate a new payout. Mobile uses a vertical sequence and puts the currently inspected submission first. Existing supported transaction forms and their wallet/controller checks remain intact; none was submitted during review.

The demo denomination is TOKENS and remains explicitly simulated. The real denomination remains TOKENS. SDK, program, account layouts, instruction builders and wallet behavior are unchanged. Motion uses finite SVG progress/opacity and existing bounded timelines; state and supported actions are never gated by animation. Reduced motion and idle stillness were checked.

## Exact source/document files changed

Paths are relative to this repository. This list includes the earlier authorized Story slice retained in the same working tree.

- `README.md` — Story entry description.
- `web/src/app/layout.tsx` — final scoped styles loaded in the existing cascade.
- `web/src/components/story-world.tsx` — direct Story interactions, ancestry, grant/cut motion, truthful denomination.
- `web/src/components/story-cut.css` (new) — retained Story composition and cut/proof styling.
- `web/src/components/completion.css` — automatic-walkthrough styles removed.
- `web/src/components/capital-authority-instrument.tsx` — actual vertical authority graph, selection/path and finite motion.
- `web/src/components/command-world.tsx` — focused ancestry inspector and explicit mobile inspection.
- `web/src/components/command-continuity.tsx` — immediate navigation and finite focus on the destination's real Root.
- `web/src/components/arena-world.tsx` — read-only submission selection, separate observed winner, lifecycle motion and account evidence.
- `web/src/components/mission-channels.tsx` (new) — SVG lanes measured from rendered object ports; resize-driven, no idle frame loop.
- `web/src/components/final-experience.css` (new) — responsive graph/inspector and mission composition; final screenshot-driven corrections.
- `web/src/lib/authority.ts` — demo display unit only, USDC to TOKENS; accounting unchanged.
- `scripts/verify-startup-story.mjs` — direct-state, ancestry, keyboard and idle assertions.
- `scripts/sprint-experience.mjs` — direct Story acceptance and current graph selectors.
- `scripts/story-slice-capture.mjs` (new) — fresh baseline and Story continuity capture.
- `scripts/final-visual-check.mjs` (new) — final desktop/mobile, reduced motion, actual account and read-only submission acceptance.
- `scripts/final-motion-capture.mjs` (new) — records actual user-driven Demo interactions for visual review.
- `docs/FINAL-VISUAL-MOTION-PASS.md` (new) — this report.

Preexisting user files were preserved: `docs/GATE-0-WALLET-LAG.md`, `docs/GATE-1-PERFORMANCE-QA.md`, `docs/RELEASE-CANDIDATE-STATUS.md`, `docs/gate1-performance.json`, `scripts/qa-wallet-performance.mjs`.

## Browser evidence inspected

All paths below are within `artifacts/final-visual-pass/`. Captures were made with actual Chromium-rendered application UI, not replicas. The three supplied images were inspected as composition references only.

- Fresh baseline: `before/` and `observed-baseline/before/`, Story, Command and Arena at 1440×900 and 390×844. The first desktop Command capture showed RPC loading; a second fresh loaded capture was retained rather than describing the loading screen as the graph.
- Initial implementation: `first-pass/`, visually inspected desktop Story recursion, Trace, Blast Radius and Cascade; Command active, preview, demo-blocked and observed-blocked Scraper; Arena selected submission, observed settlement and demo settlement. Mobile versions and inspector/detail/full-page captures were inspected too.
- Finished desktop and Story/Arena mobile: `after/`, states `story-recursion`, `story-trace`, `story-blast`, `story-cascade`, `command-active`, `command-blocked`, `arena-selected`, `arena-settled`, `arena-viewing`, `arena-demo-settled`; viewport and full-page captures. Full-page mobile views show content outside the first viewport.
- Final mobile Command captures: `after-mobile/command-active-390x844.png`, `command-blocked-390x844.png`, `command-observed-blocked-390x844.png`, `command-blocked-inspector-390x844.png`. These were inspected after correcting compact financial text overlap. The final observed inspector and Arena detail captures remain available there too.
- Recorded interactions: `after/motion/interactions.webm`; event timestamps in `events.json`. Extracted and inspected frames: grant, recursive grant, cascade, Command ancestry focus, Arena preview, settlement and evidence.
- Existing in-app browser: refreshed the real local application and read its accessibility state and error-level console logs. No error-level entries were returned.

One screenshot-driven refinement pass fixed the Trace path's inherited black SVG fill, Root denomination overflow, active node/submission contrast, inherited live-mission margins, verifier labels, mobile mission density and compact mobile accounting. Finished captures were inspected; no further aesthetic iteration followed.

## Checks run

- `npm run build` in `web`: passed, static export updated. Existing bigint native-binding fallback warning remains; the library uses pure JavaScript.
- `npm run typecheck` in `web`: passed.
- `npm run lint` in `web`: passed, zero warnings.
- `npm run test:ui`: 16 passing authority/accounting/state-selector tests.
- `node scripts/verify-startup-story.mjs`: passed both viewports with normal and reduced motion; immediate actions/state, exact lineage, preview, cascade, surviving Operations, keyboard, reset, zero idle RAF.
- `node scripts/final-visual-check.mjs artifacts/final-visual-pass/after`: 64 verification records across desktop/mobile and both motion preferences; no page errors, document overflow, idle RAF or write RPC methods. A final mobile-only run in `after-mobile` added 36 records after the compact accounting correction.
- `node scripts/sprint-experience.mjs http://127.0.0.1:3101 artifacts/final-visual-pass/extended-acceptance`: 55 captures/checks at 1440×900, 1280×800, 768×1024, 390×844 and 720×450. Includes RPC failure, absent Phantom behavior, keyboard/mobile inspector focus and reduced motion.
- `node scripts/final-motion-capture.mjs`: completed actual Demo interactions across all three routes; recording and frames inspected.
- `git diff --check`: passed. Modified source was formatted using the existing Prettier installation. React hooks, event cleanup, read-only selection, keyboard controls and rendering behavior reviewed using the React best-practices skill.

Initial capture/test retries fixed test whitespace and exact-decimal expectations, a disabled Story mode selector in the recording script, and waited for actual RPC state. The final checks listed above completed successfully.

## Limits

No new browser-signed transaction, real Phantom controller signing or live grant/revoke/settlement was tested. Current Devnet Research is already revoked; the active Scraper view and new transitions were reviewed in Demo, while blocked Scraper, active Operations and settled Arena were read from real accounts. Historical receipts and account evidence are labelled accordingly. Native device touch hardware and native 200% browser zoom were not tested; touch-sized controls and equivalent 720×450 reflow were checked. No Rust/local-validator rerun was performed for this frontend-only working-tree change, and no Git checkpoint was created.
