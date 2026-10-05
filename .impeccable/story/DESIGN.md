# Story visual design

Story uses a deep evergreen ground (`#101a18`), warm paper (`#eee9da`), sage authority bands, muted green secondary text, and copper (`#d59b74`) for revoke preview. Large, closely tracked sans headings pair with Georgia italic emphasis; monospace labels carry amounts, stage numbers, and exhibit metadata.

The central source is a notched Root seal. Radial inherited bands express Research → Data → Scraper and Research → Analysis, with Operations occupying an independent lower arc. Delegation sends a bounded pulse along the actual parent path before the child resolves. Scraper tracing highlights the complete Root → Research → Data → Scraper ancestry. Copper previews the exact Research blast radius before confirmation while authority stays active. Revocation detaches Research upward, then dims and hatches Data at 300ms, Analysis at 420ms, and Scraper at 660ms; Operations remains active and visually unchanged. Root-capacity consequence is revealed separately after the authority cut; the vault is unchanged by revoke.

The desktop composition targets 1440×900 fitting: 40/60 narrative/exhibit columns, viewport-sized seal, and persistent stage footer. Narrow screens stack the composition. At 700px and below, explicit consequence copy preserves complete ancestry or the broken ancestor, Root available capacity, and unchanged-vault context. Reduced motion removes animation/transition delays and collapses scheduled delegation waits while retaining final state and controls.

Motion is scoped native WAAPI in `web/src/components/authority-motion.ts/css`: trace 560ms, build 780ms, impact 700ms, cascade 1360ms, and Story→Command handoff 600ms with `cubic-bezier(0.16, 1, 0.3, 1)`. Replay/state interruption, route/unmount, preference changes, document hiding, and resize cancel timelines and remove temporary SVG pulses/snapshots. The handoff maps the existing seal to flat Command anchors; it skips flight in reduced motion. No dependency or ambient loop was added.

Canonical visual authority remains `artifacts/story-visual/story-final.mp4`. Motion-pass captures are `artifacts/motion-pass/final/story-*.png`, with native recording `artifacts/motion-pass/final/motion-final.mp4`; these references do not claim final reviewer approval or integration verification.

This is Story-scoped presentation. Product accounting continues through the existing `genesis` and `revokeDemo` functions; descendant records remain locally active while effective authority is blocked.
