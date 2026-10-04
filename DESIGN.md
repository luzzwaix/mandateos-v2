---
name: MandateOS V2 — Authority Loom
description: Recursive capital authority expressed as one asymmetric cast strip, projected native information, and exact flat financial inspection.
colors:
  world: "#111617"
  field: "#141a1b"
  bone: "#ede9df"
  text: "#f6f5ef"
  muted: "#b7bfbc"
  mint: "#b9efdb"
  copper: "#efab75"
  red: "#ff625b"
  brass: "#ecc28a"
  line: "#424b4a"
  ink: "#1b2420"
  ink-muted: "#4b5c52"
  inspector-ink: "#17201d"
  copper-ink: "#81502b"
  red-ink: "#a43d2d"
  relation: "#8a9290"
typography:
  display:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(64px, 5.65vw, 100px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Anton, sans-serif"
    fontSize: "clamp(70px, 6.65vw, 106px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  arena-headline:
    fontFamily: "Anton, sans-serif"
    fontSize: "64px"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  inspector-title:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "42px"
    fontWeight: 430
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  story-support:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.02em"
  spatial-label:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0.08em"
  input:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "12px"
    fontWeight: 400
  amount-flat:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "19px"
    fontWeight: 450
    lineHeight: 1.5
  amount-inspector:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "36px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.04em"
  amount-spatial:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  square: "0"
  status: "2px"
  input: "3px"
  authority-dot: "50%"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "25": "25px"
  "30": "30px"
  "32": "32px"
  "54": "54px"
components:
  button-bone:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.inspector-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "0 20px"
    height: "56px"
  button-bone-hover:
    backgroundColor: "#fffaf0"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
    height: "48px"
  button-dark-hover:
    backgroundColor: "#34453a"
  button-subtle:
    backgroundColor: "transparent"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
    height: "48px"
  button-subtle-hover:
    backgroundColor: "#ffffff08"
  button-copper:
    backgroundColor: "{colors.copper-ink}"
    textColor: "{colors.bone}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
    height: "48px"
  button-copper-hover:
    backgroundColor: "#6a3d20"
  button-outline-copper:
    backgroundColor: "transparent"
    textColor: "{colors.copper-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    padding: "18px 0"
    height: "48px"
  input-field:
    backgroundColor: "transparent"
    typography: "{typography.input}"
    rounded: "{rounded.input}"
    padding: "10px 12px"
    height: "42px"
    width: "100%"
  navigation-item:
    textColor: "#b6bcba"
    padding: "30px 0"
    size: "12px"
  navigation-item-active:
    textColor: "{colors.text}"
  status-active-instrument:
    backgroundColor: "#b9d9cc"
    textColor: "#1b493b"
    typography: "{typography.label}"
    rounded: "{rounded.status}"
    padding: "8px 11px"
  bone-inspector:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "32px"
    width: "29.5%"
  flat-authority-node:
    backgroundColor: "{colors.world}"
    textColor: "{colors.text}"
    rounded: "{rounded.square}"
    padding: "0 0 12px 27px"
    width: "184px"
    height: "80px"
---

# Design System: MandateOS V2

## Overview

**Creative North Star: "Authority Loom"**

Authority Loom expresses recursive capital authority as one asymmetric cast object. An oversized open Root source feeds a broad Research neck, a smaller Data bend, a tapered Scraper termination, an Analysis spur, and an independent Operations arm. Rounded shoulders, a deep underside, taper, and restrained studio reflections make the hierarchy legible through silhouette. Large Anton theses share the graphite field with the object; the scene has no architectural room, repeated node boxes, columns, stairs, or portal stacks.

The same authority becomes a flat native financial tree in Command. Geist and Geist Mono carry labels, exact amounts, status, lineage, controls, and evidence. Mint indicates effective authority, copper contains an active impact preview, red marks the local revoked relation, and brass marks resolved settlement with explicit provenance. Arena shares the cast material through a mission basin, three converging submission bands, an asymmetric verifier clamp, and a receipt wing.

This document extracts the current implementation. PRODUCT.md remains authoritative for product semantics. The visual system consumes the existing authority and mission state; geometry, projection, and motion do not establish transaction evidence or alter accounting. Sources are web/src/app/globals.css and loom.css; the topology, geometry, scene, native projection, Story, Arena, and flat tree components; and web/src/lib/loom-motion.ts.

**Key Characteristics:**

- One asymmetric cast authority silhouette with unequal branch widths and open negative space.
- Reflective shoulders and dark undersides give the spatial subject depth.
- Anton display type, Geist interface text, and Geist Mono financial detail.
- Native DOM labels and controls projected beside desktop geometry.
- Static SVG projection of the same authored topology on mobile and reduced motion.
- A flat Command tree and bone inspector preserve exact operational inspection.

## Colors

Dark graphite and warm bone carry the composition. State colors have specific authority and execution meanings. Frontmatter values are normative: loom.css loads after globals.css and experience.css, replacing the shared palette while retaining the inherited financial ink colors. Material colors and native metal gradients describe lighting and surface response, not additional interface state tokens. Sidecar tonal ramps are panel metadata, not shipped palette additions.

### Primary

- **Authority Mint — mint:** the powered conductor, effective active authority, selected ancestry, selected tree markers, and emphasized thesis. Its use is structural and semantic.

### Secondary

- **Impact Copper — copper:** the active affected-branch volume and an unpaid selected submission preview.
- **Copper Ink — copper-ink:** consequence text and revoke controls on bone.
- **Settlement Brass — brass:** the selected settled submission route and resolved receipt path. Simulated settlement retains its simulation label.

### Tertiary

- **Authority Cut — red:** the local revoked relation and its cut marker.
- **Cut Ink — red-ink:** errors and consequence text on the financial instrument. Blocked and revoked inspector chips also have their own observed tonal state treatments.

### Neutral

- **World Graphite — world / Field Graphite — field:** the shared shell, operating field, native fallback, and tonal surfaces.
- **Bone — bone:** the primary action, Command inspector, plane inspector, and responsive Arena financial instrument.
- **Warm Text — text / Muted Text — muted:** primary and secondary information on graphite.
- **Financial Ink — ink / Muted Ink — ink-muted / Inspector Ink — inspector-ink:** exact values, supporting copy, and controls on bone.
- **Structural Line — line / Relation — relation:** dividers and inactive flat authority relations.

**The State Color Rule.** Copper previews a consequence while authority remains active. Red marks the local cut; blocked descendants lose power and retain explicit blocked text. Brass accompanies resolved settlement and its provenance. Mint alone never means transaction confirmation.

## Typography

**Display Font:** Anton, with sans-serif fallback.
**Body Font:** Geist Sans, implemented as "Geist Variable", sans-serif.
**Label and Numeric Font:** Geist Mono, implemented as "Geist Mono Variable", monospace.

All three fonts load locally through Fontsource imports in layout.tsx. Anton supplies the condensed uppercase thesis and mission name. Geist makes the operating interface readable; Geist Mono distinguishes measured capital, compact labels, lineage, and provenance.

### Hierarchy

- **Arrival display:** the frontmatter display clamp, authored line breaks, mint emphasis, and no horizontal transform. Compact desktop uses (85px); the narrow Story layout uses clamp(44px, 12.5vw, 70px).
- **Story headline:** the frontmatter headline clamp. Trace, impact, and cascade use chapter-specific desktop sizes (66px, 68px, 77px); the organization chapter uses (58px) in the desktop composition. Plane change uses a tracked mono heading (23px). Narrow layouts use (44px); desktop reduced motion retains (48px).
- **Arena headline:** the frontmatter Arena role, with the compact desktop override (65px). Desktop mission titles use (26px / 1.15); native mission titles use (24px). Monetary values remain mono in the composed desktop and native representations.
- **Inspector title:** the frontmatter role, then (34px) below 1400px. The plane inspector uses (36px).
- **Body:** the shared interface uses the frontmatter body role. Story support uses (17px / 1.5) with a bounded width (410px), then (14px) in native layouts. Arena support uses (15px / 1.55).
- **Amounts:** spatial amounts use the frontmatter spatial role, with Root at (30px) in Genesis. Flat nodes use the frontmatter amount role, with the desktop Root at (23px). Command's main available amount uses (36px) on desktop with full motion and (29px) in its base inspector treatment. Native Story values use (18px), source-only Root (24px), and mobile Command values (14px).
- **Labels and controls:** uppercase mono names, depth tags, status, and provenance use compact sizes (9–13px). Spatial names use the frontmatter tracking; native names reduce tracking to (0.03em). Buttons use Geist at (13px) for the recurring operating action.

CapitalNumber shows the formatted target immediately on initial load. A later observed balance change may interpolate for (240ms) at the asset's established display precision; reduced motion and hidden documents resolve directly. The accessible text retains the formatted target.

**The Exact Text Rule.** Names, amounts, units, status, addresses, lineage, actions, and evidence remain native DOM/SVG driven by the existing model. Rendered geometry never supplies financial values or transaction evidence.

## Layout

The shared desktop shell uses a horizontal header (84px) and outer margin (54px). Story and Arena put a dominant subject and a condensed thesis in the same viewport. Their header floats above the graphite field. The Command header is a native operating row (80px), with routes at left, Root/vault/mandate figures in the middle, and mode/wallet controls at right.

Desktop Story holds one sticky stage (100vh, minimum 740px) within a persistent scroll extent (minimum 450vh). The editorial field begins at (54px, 22vh), with a width of (34vw) and chapter-specific adjustments. The cast object occupies the same stage. Six chapter controls sit at lower left; Back, Next, and Reset sit at lower right. Supporting accounting statements follow the subject along the lower field. The source-only chapter enlarges and centers the open Root within its own camera framing.

Command uses a flexible flat tree beside a bone inspector (29.5%). The inspector is sticky beneath the header (80px), has internal padding (32px), and scrolls within the viewport. The compact toolbar and search precede the tree; the event sequence and accounting explanation follow it. The native tree has a minimum height (575px). Its six canonical anchors are Treasury at (43% width, depth 0), Research (35%, depth 1), Operations (82%, depth 1), Data (21%, depth 2), Analysis (50%, depth 2), and Scraper (11.5%, depth 3). Vertical placement is (55px + depth × 143px). General graphs retain the existing layout algorithm. The displayed figure is own available capital; node size is not a quantitative budget scale.

Arena places the mission basin, converging submission bands, clamp, and receipt in a full viewport stage (100vh, minimum 740px). Native annotations attach to authored anchors. Its desktop action instrument stays under the thesis at left, with a single vertical divider and transparent background. The mission title and bounty occupy the basin opening; the selected lane and receipt carry resolution. Native layouts place the projected execution subject before the mission switcher and bone financial instrument.

### Responsive behavior

- **Below 1400px:** outer margins reduce to (30px), flat nodes reduce from (184px) to (160px), inspector padding becomes (25px), and typography has the observed compact overrides.
- **Below 1100px:** Story becomes normal document flow. Thesis and support are followed immediately by the static cast subject, then the action, chapter rail, inspection, and navigation. The native authority canvas uses a viewBox width (340), with source-only height (285) and full-tree height (525); its mobile maximum width is (340px).
- **Reduced motion:** Story and Arena do not mount the spatial scene and show the static SVG cast projection. Desktop reduced-motion Story uses two columns with a gap (36px) and padding (40px 54px). Command remains a flat two-column operating graph at widths of 1100px and above.
- **Mobile Command:** the tree becomes a depth-first nested ledger. Each subtree stays contiguous; row indentation is (18px + depth × 22px) and minimum row height is (76px). Each native row retains name, exact amount, depth, and effective status. The full-width bone inspector follows the field.
- **Native Arena:** the mathematical projection uses a viewBox (340 × 380), a maximum width (510px), and an aspect ratio that preserves the basin, bands, clamp, and receipt wing. Labels remain independently selectable native controls.
- **Below 768px:** the shell becomes a compact wrapped header (72px) with smaller wordmark, routes, mode, and wallet controls.
- **Unavailable WebGL:** native authority content remains in the wrapper. Arena reveals the native execution representation through its failure layout. This path shares the authored topology; it does not require a screenshot or a second financial model.

## Elevation & Depth

The spatial subject is custom BufferGeometry following centripetal curved sweeps. A sampled profile creates the rounded shoulder, deep underside, changing width, twist, and taper. Root keeps a broader taper (0.85); descendant terminations taper more strongly (0.35). A dark, broader underside sits behind the face. Parent connectors use the same cast material, so the authority structure reads as a continuous object.

The front material is a reflective green graphite (color #69786e, roughness 0.2, metalness 0.88, environment intensity 2). The edge uses darker graphite (#202c26, roughness 0.36, metalness 0.65), and the recess is darker again (#101a16, roughness 0.52, metalness 0.3). A generated studio cubemap, hemisphere light, warm key, and cool edge light shape the highlights. The current scene uses an orthographic camera and a transparent canvas. It does not rely on a room, floor receiver, background columns, fog, post-processing bloom, or decorative card shadows for depth.

The native cast uses vector faces with a metal gradient and dark underside fills projected from the authored sweeps and rounded profile. It preserves the subject's shape without mounting the Three.js scene. The financial tree, buttons, labels, and inspector remain flat; dividers, tonal contrast, and selection markers establish hierarchy.

### Shadow Vocabulary

- **Wallet popover** (box-shadow: 0 16px 40px #0005): the inherited floating wallet surface.
- **Financial instrument and scene annotations:** no decorative box shadow. Native labels have no text shadow.

**The Material Depth Rule.** Depth belongs to the cast profile, its underside, and studio reflections. Native operating surfaces remain flat; do not add spatial effects to the financial inspector.

## Shapes

The signature is an open, uneven cast strip. Root has a large hollow source; Research has a broad neck; Data bends; Scraper narrows to a small termination; Analysis is a shorter spur; Operations has its own arm. Their directions and widths make ancestry recognizable before reading labels. Metal connectors join actual parent endpoints. Fine powered conductors follow the cast's center; a separate narrow bone rail represents the observed available ratio.

The impact treatment is a copper perimeter volume with a front contour, rear contour, and depth connectors, drawn around Research's affected branch. The local cut opens only the Research incoming relation, with two small red opposing marks. Native and flat representations retain explicit blocked/revoked text and line treatments.

Buttons, the bone inspector, and flat nodes use square corners. Inputs retain a small corner (3px); inspector state chips use (2px). Authority markers and selected annotation dots are circular. Thin guides and tree elbows have a functional relationship to the information, with clear space around labels.

**The Continuous Authority Rule.** A branch joins its actual parent through the cast connector and conductor. Preserve the unequal widths, bends, tapers, and independent Operations arm; do not turn each mandate into the same repeated box.

## Components

### Buttons

Flat, square actions with a precise typographic label and optional inline arrow.

- **Primary bone action:** bone background, inspector ink, and an observed Story treatment (56px minimum height, 0 20px padding).
- **Dark financial action:** financial ink background, bone text, and compact padding (12px 16px); the common action minimum is (48px).
- **Subtle action:** transparent background, inherited text color, and a muted border. Hover adds a very faint white fill.
- **Copper confirmation:** copper ink background and bone text. Review actions use copper ink text on a transparent financial surface; Command's review control is a full-width top-divided row.
- **Hover / active / focus:** colors change without hover lift. The inherited active press moves down (1px). State transitions use (140ms); the press uses (80ms). Focus is a mint outline (2px, offset 5px); bone instruments use dark green focus. Disabled buttons retain native disabled behavior and reduced opacity.

### Inputs / Fields

Transparent mono fields with a muted green-gray stroke, small corners, internal padding (10px 12px), and minimum height (42px). Width is (100%). Caret is mint on graphite and financial ink in the inspector. Focus uses the surface's explicit outline. Search remains a compact native input in the tree field.

### Navigation

Only Story, Command, and Arena appear in the main navigation. Uppercase labels use compact tracking (0.12em). The active route has warm text and a mint bottom rule. Hover raises text contrast. The chapter rail uses native buttons with the selected chapter in mint and an underline; its mobile treatment wraps rather than changing the chapter names.

### State Chips

On graphite, status is compact uppercase mono text without a pill background. The Command inspector uses a small tonal chip: active is green-tinted; blocked is muted neutral; revoked is warm red-tinted. Text states remain explicit. A blocked descendant is visually distinct from the locally revoked record.

### Financial Containers

The bone inspector is a square native financial surface. Selected mandate, local and effective state, own available amount, subtree remaining, depth, parent, and complete path stay separate. Thin dividers organize the available amount, lineage, and action sections. The event sequence and provenance remain native content. The desktop Arena instrument is transparent with a left rule; its responsive variant becomes a bone instrument.

### Authority Subject and Annotations

Desktop Story renders the cast topology once and changes existing transforms and shader uniforms for each event. Real button annotations are projected from authored anchors; their name, depth, amount, unit, and effective state remain DOM content. A selected name turns mint and gains a small circular dot. Research and Data sit outside the left cast contour with guides; the other labels attach to authored positions that preserve the silhouette.

The event vocabulary is authored in loom-motion.ts: Genesis (850ms), recursion (550ms), trace (650ms), impact (500ms), cascade (1100ms), plane change (850ms), and settlement (850ms), with a depth interval (200ms). Progress resolves with a clamped quartic ease.

- **Delegation:** the inbound relation grows through the first (48%) of its event; the child resolves from its endpoint after (50%). The native label appears late in resolution (85%).
- **Trace:** one bounded traversal follows selected ancestry. Root stays present, and unrelated powered branches reduce visual emphasis.
- **Impact:** copper draws the enclosing volume while active authority and financial state remain unchanged.
- **Cut:** the Research relation opens locally. Power loss follows depth at the authored interval; Operations retains its geometry, coordinates, and authority.
- **Plane change:** the cast's z depth compresses toward zero, labels converge on the existing flat Command anchors, native relations appear, and the bone inspector resolves. Narrow and reduced-motion layouts navigate directly.
- **Rendering:** the scene uses demand rendering and stops invalidating after the event resolves. This is implementation behavior, not a claim of measured performance.

### Flat Authority Tree

Square native node buttons sit on orthogonal SVG ancestry relations. A selected mandate has a mint bottom rule. Effective active ancestry fills its circular marker; unrelated markers remain outlined. Revoked relations are red and dashed; blocked relations are muted and dashed. Preview changes affected text to copper and draws a copper extent. Mobile selection uses the same native state within the nested ledger.

### Arena Execution Subject

A cast mission basin opens into three distinct converging submission bands. The asymmetric verifier clamp spans their meeting point; the receipt wing continues from it. Capital funding, submission selection, and settlement have separate routes. Funding is mint. Selecting a submitted result creates an unpaid copper preview. Resolved settlement makes the winning submission and receipt route brass. The native representation uses the same declared basin, submission, clamp, and receipt sweeps. Actions, formatted values, status, and the existing ready/funded/submitted/settled lifecycle remain native application state.

## Do's and Don'ts

### Do:

- **Do** preserve graphite and bone as the field and financial instrument, with mint, copper, red, and brass bound to their implemented meanings.
- **Do** keep Anton for condensed theses, Geist for readable interface text, and Geist Mono for exact financial detail.
- **Do** preserve the open Root, broad Research neck, Data bend, Scraper taper, Analysis spur, and separate Operations arm.
- **Do** keep desktop labels and actions as real projected DOM controls, with restrained guides and clear space around the cast contour.
- **Do** preserve the same authored subject as a static SVG projection on narrow viewports, reduced motion, and unavailable WebGL.
- **Do** place the mobile Story subject directly after its thesis and support copy, before the chapter actions.
- **Do** keep Command flat, with own available amounts in the tree and complete financial inspection in the bone instrument.
- **Do** retain visible simulation or observed-state provenance beside mission state, actions, and receipts.

### Don't:

- **Don't** restore the rejected rectangular Root frame, repeated beveled node boxes, CAD room, columns, stairs, card stacks, or portal stacks.
- **Don't** render labels, amounts, status, buttons, lineage, or receipts as pixels inside the 3D scene or a full-screen mockup image.
- **Don't** use copper preview as a revoked state, mark blocked descendants as locally revoked, or imply that tokens move during delegation or revoke.
- **Don't** move, reshape, extinguish, or cut Operations when Research is revoked.
- **Don't** introduce perpetual scene motion, looping ancestry pulses, or perspective-dependent mobile controls.
- **Don't** use decorative shadows, gradients, or glass panels to replace the flat financial inspector.
- **Don't** interpret a rendered receipt, screenshot, or animation as proof of a live transaction or successful Devnet execution.
