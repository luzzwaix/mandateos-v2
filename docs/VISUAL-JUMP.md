# Command and Arena visual jump — verified handoff

Chosen composition: bone capital register for Command, and a mission-led execution field for Arena. Both runnable candidates used the existing reducers, fixture values and controls. Candidate A made Root, branch authority and exact capital one horizontal operating object; its instrument sits below rather than competing in a side card. Arena's bone mission leads three commitment lanes into a verifier threshold, then into the selected winner's receipt. Candidate B retained a graphite authority field and right-side Arena instrument; it gave capital and execution less coherent emphasis. The losing CSS prototype and its capture injection were removed. Neither candidate introduced a production route.

## Evidence

Open the [evidence gallery](../artifacts/visual-jump/index.html) for every baseline/final state at 1440 × 900 and 390 × 844, including full mobile pages. All images were captured from real Chromium and actual UI actions, not injected product state.

- [Command before / after](../artifacts/visual-jump/command-active-before-after.png)
- [Command Blast Radius before / after](../artifacts/visual-jump/command-preview-before-after.png)
- [Command blocked execution before / after](../artifacts/visual-jump/command-blocked-before-after.png)
- [Arena funded before / after](../artifacts/visual-jump/arena-funded-before-after.png)
- [Arena selection before / after](../artifacts/visual-jump/arena-selection-before-after.png)
- [Arena settlement before / after](../artifacts/visual-jump/arena-settled-before-after.png)
- [Command silhouette at 25%](../artifacts/visual-jump/command-active-25percent.png)
- [Arena silhouette at 25%](../artifacts/visual-jump/arena-selection-25percent.png)
- [Command candidates](../artifacts/visual-jump/command-active-candidates.png)
- [Arena candidates](../artifacts/visual-jump/arena-selection-candidates.png)
- [Mobile Command before / after](../artifacts/visual-jump/command-blocked-mobile-before-after.png)
- [Mobile Arena before / after](../artifacts/visual-jump/arena-settled-mobile-before-after.png)
- [Browser recording — H264, 1440 × 900, 25.24 seconds](../artifacts/visual-jump/pass2/visual-jump.mp4)
- [Recording action times](../artifacts/visual-jump/pass2/recording.json)

At 25%, the old top metrics / central graph / right inspector silhouette changes to a vertical treasury register and a broad bone authority field with a lower financial instrument. Arena changes from a central diagram with a side inspector to a left mission mass, middle submission lanes, right threshold and lower action/accounting instrument. Full-size and thumbnail captures were inspected.

## Exact files changed by this pass

These are changes relative to the user's pre-edit checkpoint, not relative to Git HEAD (which already contained user work).

| File | Change |
| --- | --- |
| `web/src/app/layout.tsx` | Import the scoped operating-surface stylesheet. |
| `web/src/components/command-world.tsx` | Group existing identity, finances and controls into the lower financial instrument; put real event history alongside treasury. |
| `web/src/components/flat-authority-tree.tsx` | Opt-in horizontal capital register, branch impact geometry and finite selection/cascade reveals; default Story geometry remains unchanged. |
| `web/src/components/arena-world.tsx` | Mission, submission lanes, verifier threshold, selected settlement channel and lower instrument composition; existing lifecycle and transaction handlers retained. |
| `web/src/components/capital-operating.css` | New route-scoped composition, typography, semantic state treatment, responsive layouts and visible focus. |
| `web/src/components/operating-motion.ts` | New small motion-token set using the existing native Web Animations timeline. |
| `scripts/web-preview.mjs` | Windows static-export page-segment path compatibility and optional PORT environment variable; no app API. |
| `scripts/verify-capital-surfaces.mjs` | Browser verification using an already installed Playwright and actual UI controls. No added dependency. |
| `docs/VISUAL-JUMP.md` | This handoff. |

## Motion and semantics

State is applied immediately by the existing model. Finite reveals use focus 260 ms, ancestry trace 560 ms, impact 700 ms, funding/submissions 780 ms, cascade 1360 ms and settlement 1500 ms; travel is 8 px, lane stagger 100 ms, depth stagger 180 ms, easing cubic-bezier(.16,1,.3,1). Existing timeline cancellation handles interrupted state changes, resize, hidden documents and reduced-motion changes. No perpetual idle loop or animation framework was added.

Preview retains six active records and marks only the four affected branch records. Revoke shows one locally revoked node and three descendants with blocked effective authority; their local records remain active. Operations stays active and stationary. The shared vault remains unchanged. Capacity release to the parent is shown separately from the authority cut, and reclaim remains a separate action. Blocked execution says it is simulated. Arena reserves existing Root available capacity, accepts commitments, previews an unpaid selection, and exposes the selected receipt only at the existing settled state. B and C winner paths were exercised independently.

## Browser passes and repairs

Baseline: inspected the supplied `interaction4` recording and reproduced the same Command / Arena states in the current checkout, at both required sizes. Both candidate compositions were captured at both sizes. Pass 1 then exercised active, Authority Trace, Blast Radius, Cascade, blocked execution, funded, submissions, selection and settlement at both sizes.

Concrete Pass 1 failures fixed: inherited mobile inspector columns, settlement receipt crowding the method explanation, and preview controls sitting too far below the fold. The final instrument uses explicit responsive grouping and the receipt has its own stage space.

Initial Pass 2 verification caught a one-pixel mobile focus outline, an inherited desktop grid causing overflow at 768 px, and missing Next page-segment resources in the Windows static preview. These were repaired. The final full-size inspection also caught weak revoke-button text contrast; the copper control now passes a measured 4.5:1 minimum contrast check at all five QA widths. The rebuilt production export was captured again for all states; [initial failures](../artifacts/visual-jump/qa/initial-failures.json) are retained separately from the passing result.

- [Pass 1 capture results](../artifacts/visual-jump/pass1/results.json): all state assertions passed; no browser console errors.
- [Final Pass 2 capture results](../artifacts/visual-jump/pass2/results.json): all state assertions passed; no browser console errors.
- [Browser QA results](../artifacts/visual-jump/qa/results.json): 103 assertions passed; no console errors. Actual Chromium 149 on Windows, headless production-export verification. Widths: 390, 768, 1024, 1280, 1440. Direct loading/navigation, exact authority states, sibling stability, shared-vault preservation, interruption cleanup, keyboard selection, visible focus, Escape restoration, unpaid selection, alternate winner, reduced motion, demo wallet and Devnet gate were exercised.
- `npm --prefix web run lint`: passed, zero warnings.
- `npm --prefix web run typecheck`: passed.
- `npm --prefix web run build`: passed; Story, Command and Arena statically exported.
- `npm run typecheck`: passed.
- `npm run test:ui`: 15 passing.
- `npm run test:local`: isolated existing Windows validator runner completed eight batches, eight tests per batch (64 passing).
- `cargo fmt --all -- --check`: passed.
- `cargo +1.89.0-x86_64-pc-windows-gnu check --locked`: passed. The default MSVC check initially lacked link.exe; the already installed GNU toolchain completed it.
- Impeccable source detector: no findings. Manual critique/polish preserved MandateOS identity; no additional agent or library was installed.

No frame-rate or runtime performance benchmark was measured. Build completion and screenshot success are not performance scores.

## Preservation and actual limitations

Checkpoint: `../mandateos-visual-jump-checkpoint-1791225978274`, branch `mandateos-visual-pass`, original HEAD `aaa2a7f4cad9b99e82d83dfc3bc61458cf4138b4`. Existing user changes were copied before editing. No reset, clean, branch switch, commit, merge, push or deployment occurred. [Preservation evidence](../artifacts/visual-jump/preservation.json) lists only five changed existing files; all other checkpoint files remain byte-identical. The three new implementation/QA files and this handoff are listed above. Contracts, IDL, authority accounting, transaction flow, lockfiles and approved Story source are preserved.

Story screenshots are pixel-identical to baseline at both 1440 × 900 and 390 × 844. Demo versus Devnet remains explicit. The existing Devnet deployment/IDL readiness gate prevents genuine wallet transactions in this environment; pending/confirmed/rejected onchain states were not claimed or simulated as real. That pre-existing integration blocker remains. No visual blocker was found in the final required-state captures.

Preview currently runs on http://127.0.0.1:3101. To reproduce: `npm --prefix web run build`, then set `PORT=3101` and run `node scripts/web-preview.mjs`; run `node scripts/verify-capital-surfaces.mjs http://127.0.0.1:3101`. Set PLAYWRIGHT_MODULE if the existing Playwright installation lives elsewhere. Evidence is local in the ignored artifacts directory.
