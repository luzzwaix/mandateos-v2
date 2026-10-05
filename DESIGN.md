---
name: MandateOS V2
description: Recursive capital authority, expressed through the approved Story.
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
    fontSize: "clamp(60px, 6.1vw, 88px)"
    fontWeight: 450
    lineHeight: 1.01
    letterSpacing: "-0.035em"
  emphasis:
    fontFamily: "Georgia, serif"
    fontWeight: 400
  data:
    fontFamily: '"Geist Mono Variable", monospace'
components:
  button-bone: { backgroundColor: "{colors.bone}", textColor: "#17231d", padding: "20px 23px" }
  button-dark: { backgroundColor: "{colors.ink}", textColor: "{colors.bone}", height: "43px" }
  bone-inspector: { backgroundColor: "{colors.bone}", textColor: "{colors.ink}", padding: "25px 27px" }
  input-field: { backgroundColor: "#f4f0e5", textColor: "{colors.ink}" }
  navigation-item: { textColor: "{colors.bone}" }
  flat-authority-node: { textColor: "{colors.bone}", width: "170px" }
---
# Design System: MandateOS V2

## Overview
The identity anchor is `artifacts/story-visual/story-final.mp4`: a notched Root seal, radial inherited bands, deep forest, bone, sage, copper preview, editorial sans, Georgia italic, and mono data. The user's subsequent art-direction override authorizes stronger scale, framing, materials, and motion while retaining this identity. The `visual-elevation-pass` treatment lives in `authored-fields.css`; the approved video and pre-pass Story source remain available as fallback.
This refresh supersedes the earlier Anton/WebGL/cast-loom guidance; its byte-identical archive is `artifacts/motion-pass/DESIGN-before.md`. Sources: `story-authority.css`, `work-language.css`, `authority-motion.ts/css`, `story-world.tsx`, `flat-authority-tree.tsx`, `command-continuity.tsx`, and `arena-world.tsx` under `web/src/components/`.
PRODUCT.md and AGENTS.md own accounting and integrations. This document describes presentation; animation and captures do not establish transaction evidence.

## Colors
Forest grounds all three surfaces. Bone carries text, Root, the Command inspector, and the Arena mission. Sage expresses authority, focused ancestry, and settled selection; muted green and thin dividers support metadata.
Copper marks an active revoke preview or unpaid verifier candidate. Blocked/revoked states retain explicit text, muted material, hatching or broken relations; settled routes return to sage. Color alone never confirms a transaction.

## Typography
Use Geist sans for mixed-case editorial headings and controls, Georgia italic for selected heading emphasis and the mission title, and Geist Mono for amounts, depth, ancestry, state, and provenance. Fonts load locally; the inherited Anton import does not define these approved surfaces.
Story display uses the frontmatter scale with larger italic emphasis; support is 16px/1.6 with a 330px maximum width. Command heading is 34px/1.1, inspector title 40px/1.1, and available amount 39px/1.2 mono. Arena heading is 52px/1.05. Compact labels use 8–12px mono.

## Layout
Desktop Story uses 48px outer padding, 40/60 narrative/exhibit columns, a maximum width of 1800px, and a persistent stage footer. Its SVG retains Root context and the independent Operations arc.
Command uses a flat hierarchy beside a 350px bone inspector with a 32px gap, plus treasury ledger, toolbar, event sequence, and complete authority inspection. The search rail is explicitly absolute within the field. Arena uses a mission field beside a 300px control rail with a 35px gap; its stage is explicitly block on desktop.
At 700px Story stacks in document flow with 21px padding. Mobile consequence text retains complete ancestry or the exact broken ancestor, Root available capacity, and unchanged-vault context. Command becomes a nested ledger at 900px and stacks its inspector at 700px. Arena stacks its rail at 1000px; at 650px SVG channels yield to sequential HTML funding, mission, commitments, verifier, outcome, and evidence.
Reduced motion preserves these responsive compositions and final states; it skips WAAPI sequences and the Story→Command flight rather than requiring animation to explain a result.

## Elevation & Depth
Story and Arena seals use diffuse bone/sage gradients, a shallow offset lower edge, and a soft downward shadow. Depth separates inherited boundaries and makes the loss of authority legible; it does not introduce another scene or renderer. Command stays flat and financial. The bone inspector is sticky on desktop and ordinary flow on mobile. Keep decorative depth out of operating values and evidence.

## Shapes
Preserve the notched Root, radial Research→Data→Scraper bands, Analysis branch, and independent lower Operations arc. Command uses crescent authority markers and curved ancestry links. Arena uses a notched mission and paired verifier aperture. Actions and inspector stay square; mobile Arena's mission panel has a 24px radius.

## Components
Real native controls retain selection, delegation, trace, revoke preview/confirmation, funding, commitments, verification, settlement, and evidence handlers. Show own available capital separately from subtree remaining, reserved rewards, and vault balance. Demo provenance stays visible.
Bounded native WAAPI timelines use `motionTiming`: control 160ms, trace 560ms, branch 780ms, impact 700ms, cascade 1360ms, handoff 720ms, settlement 1240ms; settle ease is `cubic-bezier(0.16, 1, 0.3, 1)`. These are sequence tokens, not identical durations for every child.
Delegation pulses the actual parent path before the child resolves. Trace reveals complete ancestry with Root present. Copper encloses the exact subtree while authority stays active. Story Cascade cuts Research, then dims/blocks Data at 300ms, Analysis at 420ms, and Scraper at 660ms; Operations stays unchanged. Supported Root-capacity recovery appears separately after the cut.
Story→Command maps native SVG snapshots onto existing flat node anchors. Arena funding and commitment routes resolve into the mission/verifier; only the selected result passes, followed by the existing outcome and evidence. Non-winning lanes recede.
Timelines cancel on replay/state interruption, route or component cleanup, reduced-motion preference, hidden document, and resize. Temporary pulse paths and flight snapshots are removed; account/demo state stays authoritative. No new motion dependency or ambient loop.
Browser baseline: `artifacts/art-direction/before/`; elevated route captures and native recording: `artifacts/art-direction/delivery/`. Pre-pass source: `artifacts/art-direction/source-before/`. Resume snapshot, working diff, HEAD, and reflog: `artifacts/art-direction/resume-snapshot/`. These are visual and recovery evidence, not transaction or integration approval.

## Do's and Don'ts
- Do preserve the canonical Story identity and fallback, flat financial Command, exact native values, complete paths, and simulation/observed-state provenance.
- Do keep Operations operational outside Research's blast radius and make consequences clear without motion.
- Don't restore superseded Anton/WebGL/cast-loom direction or introduce decorative loops.
- Don't imply delegation or revoke transfers tokens, label effectively blocked descendants as locally revoked, or invent settlement proof.
