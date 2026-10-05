---
name: MandateOS operational surfaces
description: Shipped Command and Arena visual notes; surface scope only.
colors:
  forest: "#101a18"
  bone: "#eee9da"
  sage: "#c8d9c5"
  preview-copper: "#d59b74"
  ink: "#172c1d"
  muted: "#a6b5ac"
  ink-muted: "#50634e"
  divider: "#354638"
typography:
  editorial:
    fontFamily: '"Geist Variable", sans-serif'
  emphasis:
    fontFamily: "Georgia, serif"
    fontWeight: 400
  data:
    fontFamily: '"Geist Mono Variable", monospace'
---
# Design System: MandateOS operational surfaces

## Overview
These notes capture `/app` Command and `/arena` Arena after the visual-unity pass. They inherit the approved Story materials from `artifacts/story-visual/story-final.mp4` and `artifacts/visual-unity/story-reference-stable.png`; they establish no new global design authority. Story and `.impeccable/story/DESIGN.md` remain separately scoped.
Ground truth: `web/src/components/work-language.css`, `flat-authority-tree.tsx`, `command-world.tsx`, and `arena-world.tsx`; font stacks are defined in `web/src/app/globals.css`.

## Colors
Forest is the shared ground; bone carries primary text, the Command inspector, and the Arena mission seal. Sage identifies authority, focused lineage, and settled results. Muted green and thin dividers support metadata.
Copper identifies revoke impact or unpaid verifier preview; settlement returns the selected result to sage. Preview is not confirmation.

## Typography
Sans editorial headings use close tracking and mixed case. Georgia italic supplies selected heading emphasis and the mission title. Monospace carries amounts, depths, status, account paths, commitments, and provenance.

## Layout
Command is a dense flat hierarchy beside a bone inspector (350px desktop rail, 32px gap). Every actual visible node carries available capital, depth, and effective status; curved links show parentage and focused lineage.
Arena gives the notched bone mission the primary field, with funded authority at its left, commitments below, verifier at its right, receipt after settlement, and a separate 300px control rail (35px gap).
Command switches to a nested financial ledger at 900px and stacks its inspector at 700px. Arena stacks the control rail at 1000px; at 650px it hides diagram channels and uses sequential HTML flow. The 390px full-page captures contain app content without browser chrome.

## Elevation & Depth
Operational fields rely on tonal contrast, dividers, focused paths, and material changes; their main hierarchy and mission diagram are flat. The Command inspector is sticky on desktop and becomes ordinary flow on mobile.

## Shapes
Root and desktop mission use the Story-derived notched seal. Crescent markers identify delegated authority; rounded link bends express lineage. The verifier is a paired curved aperture. Mobile Arena uses a bone mission panel with rounded corners (24px).

## Components
Command retains actual hierarchy selection, search, branch collapse, authority trace, delegation/spending controls, revoke review, and evidence handlers. Copper outlines the affected branch and changes its preview inspector; unrelated branches keep their authority.
Arena renders the three actual demo commitments as distinct curves to the verifier. Live names and counts come from loaded submissions. Copper marks an unpaid candidate preview; sage marks the settled winner and the receipt derived from current state. Demo receipts remain explicitly simulated.
Product truth: one shared treasury vault supports bounded mandates and delegation. Branch revocation zeros the target, returns subtree capacity to its parent, blocks descendants effectively while their local records may remain active, and leaves an independent sibling active. Delegation reserves authority rather than moving tokens.
Arena funding reserves Root available capital; hashes commit results without proving correctness. A trusted signer selects a submitted winner and settlement pays atomically from the shared vault.

## Do's and Don'ts
Do retain real amounts, complete paths, state, eligibility, action handlers, and evidence provenance. Do distinguish local status from effective authority, and demo simulation from observed account settlement.
Don't promote these compositions into Story or global rules, use copper for settled success, fabricate transaction evidence, or claim full integration testing from visual review.
Prior visual-unity evidence: `artifacts/visual-unity/{command-after,command-preview,arena-after,arena-preview}.jpg` at 1440×900 and `{command-mobile,arena-mobile}.jpg` at 390px width. That pass received a **ship** review; it does not establish approval for the subsequent motion pass or full integration verification.

Current bounded motion is native WAAPI in `web/src/components/authority-motion.ts/css`: control 160ms, trace 560ms, build 780ms, impact 700ms, cascade 1360ms, handoff 600ms, settlement 1240ms; settle ease is `cubic-bezier(0.16, 1, 0.3, 1)`. Command traces the actual ancestry and cuts/blocks affected authority in depth order. Arena sequences funding, commitment lanes, verifier aperture, selected-result resolution, outcome, and existing evidence; non-winning lanes recede. Financial/account state is authoritative throughout.
Replay/state interruption, route/unmount, reduced-motion preference, document hiding, and resize cancel scoped sequences and remove temporary SVG paths/snapshots. Reduced motion shows the same final states directly. Command's search rail remains absolute and Arena's desktop stage remains block in reduced motion; mobile Arena keeps sequential HTML state, verifier, outcome, and evidence when SVG channels are hidden. No new dependency or ambient loop.
Current browser artifacts: `artifacts/motion-pass/final/{command,arena}-*.png` and native recording `artifacts/motion-pass/final/motion-final.mp4`. Final motion-pass reviewer verdict is not asserted here.
