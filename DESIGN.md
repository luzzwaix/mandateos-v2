---
name: MandateOS V2 — Authority Chamber
description: Recursive capital authority made visible through precise plates, directed channels, and a bone financial instrument.
colors:
  world: "#171c1b"
  field: "#1d2422"
  plate: "#26302c"
  bone: "#eae7de"
  text: "#f1eee6"
  muted: "#b7c1b9"
  ink: "#1b2420"
  ink-muted: "#4b5c52"
  mint: "#b9d8b6"
  copper: "#d69b68"
  copper-ink: "#81502b"
  red: "#ee8a76"
  red-ink: "#a43d2d"
  brass: "#d8c6a5"
  line: "#3c4741"
  neutral-edge: "#647369"
  selected-plate: "#303a35"
  active-ink: "#2a6442"
typography:
  display:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "clamp(54px, 5.1vw, 80px)"
    fontWeight: 650
    lineHeight: 0.99
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "clamp(32px, 3.6vw, 56px)"
    fontWeight: 550
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "30px"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-support:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  control:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "13px"
    fontWeight: 550
    lineHeight: 1.5
  node-title:
    fontFamily: '"Geist Variable", sans-serif'
    fontSize: "13px"
    fontWeight: 550
    lineHeight: 1.5
  label:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "normal"
    letterSpacing: "0.02em"
  input:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "normal"
  amount:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "29px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.04em"
  amount-rail:
    fontFamily: '"Geist Mono Variable", monospace'
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  plate: "3px"
  control: "4px"
  root: "0 8px 0 0"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "#fffaf0"
  button-story:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px 24px"
    size: "16px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bone}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-dark-hover:
    backgroundColor: "#34453a"
  button-subtle:
    backgroundColor: "transparent"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-subtle-hover:
    backgroundColor: "#ffffff08"
  button-copper:
    backgroundColor: "{colors.copper-ink}"
    textColor: "{colors.bone}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-copper-hover:
    backgroundColor: "#6a3d20"
  button-outline-copper:
    backgroundColor: "transparent"
    textColor: "{colors.copper-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  button-outline-copper-hover:
    backgroundColor: "#d69b681a"
  input-field:
    backgroundColor: "transparent"
    typography: "{typography.input}"
    rounded: "{rounded.plate}"
    padding: "10px 12px"
    width: "100%"
  navigation-item:
    textColor: "{colors.muted}"
    size: "14px"
    padding: "0 2px"
  navigation-item-active:
    textColor: "{colors.text}"
  status-active:
    textColor: "{colors.mint}"
    typography: "{typography.label}"
  status-blocked:
    textColor: "{colors.red}"
    typography: "{typography.label}"
  status-active-instrument:
    backgroundColor: "#a9c6ad55"
    textColor: "{colors.active-ink}"
    typography: "{typography.label}"
    padding: "4px 7px"
  status-blocked-instrument:
    backgroundColor: "#e8a69455"
    textColor: "{colors.red-ink}"
    typography: "{typography.label}"
    padding: "4px 7px"
  mandate-plate:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.plate}"
    padding: "10px 12px"
    width: "184px"
    height: "86px"
  mandate-plate-selected:
    backgroundColor: "{colors.selected-plate}"
  root-plate:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.root}"
    padding: "10px 12px"
    width: "222px"
    height: "86px"
  bone-instrument:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    padding: "28px 28px 24px"
---

# Design System: MandateOS V2

## Overview

**Creative North Star: "Authority Chamber"**

An organization is a visible authority structure under one operator's control. Mineral graphite holds compact mandate plates and directed channels; a bone financial instrument presents exact capital, lineage, consequences, and actions. The recurring Root geometry carries identity through Story, Command, and Arena. The mood is restrained, institutional, and precise.

Depth explains structure in Story and the mission basin in Arena. Command remains flat, dense, and inspectable. Selection, preview, effective blocking, and verified execution have distinct treatments. Readable labels and evidence carry meaning alongside color, and simulated state remains visibly identified.

**Key Characteristics:**

- One recurring Root plate and orthogonal authority structure.
- Matte graphite field contrasted with a flat bone instrument.
- Exact mono financial values embedded in compact amount rails.
- Mint authority, copper preview, red break, and brass settlement.
- Bounded event motion and readable nested ledgers on mobile.

This record extracts the implemented system from `web/src/app/globals.css`, the five world/tree components, and the local font imports in `web/src/app/layout.tsx`. `PRODUCT.md`, `docs/PROTOCOL.md`, and `docs/VISUAL-REBUILD.md` establish its product and frozen visual boundaries. The approved Authority Chamber V2 brief supplies the named world; the code supplies current values and behavior. Concept rasters are studies, not shipped assets.

## Colors

The palette contrasts muted mineral surfaces and warm bone with a small vocabulary of semantic signals. Frontmatter values are normative. Root CSS custom properties retain the same names; neutral-edge, selected-plate, and active-ink catalogue recurring CSS literals.

### Primary

- **Muted Mint — `mint`:** active authority channels, active dark-surface status, Root identity, and the core Story emphasis. It does not certify a transaction.
- **Deep Active Green — `active-ink`:** active status and completed checklist marks on the bone instrument.

### Secondary

- **Copper — `copper`:** affected-branch contour, preview labels on graphite, and pending/wallet-approval transaction state.
- **Copper Ink — `copper-ink`:** preview text and revoke controls on bone. The current settled Arena payout also uses this dark warm ink for readable contrast.
- **Pale Brass — `brass`:** resolved Arena settlement channel and verifier decision. This treatment accompanies confirmed state or an explicit demo label.

### Tertiary

- **Cut Red — `red`:** invalid authority, blocked/revoked dark-surface labels, dashed broken continuation, and the inbound cut mark.
- **Cut Ink — `red-ink`:** blocked/revoked status, errors, and rejection proof on the bone instrument.

### Neutral

- **Mineral Graphite — `world`:** shell, Story field, footer, and evidence dock.
- **Graphite Field — `field`:** Command workspace, resting mandate plates, and Arena basin.
- **Structural Plate — `plate`:** hover and selected navigation surface; Story Root material.
- **Selected Plate — `selected-plate`:** selected mandate surface.
- **Bone — `bone`:** fixed information instrument, primary controls, and dark-surface focus outline.
- **Warm Light — `text`:** primary text on graphite.
- **Sage Gray — `muted`:** secondary text, metadata, mode controls, and unselected navigation.
- **Green Ink / Muted Ink — `ink` / `ink-muted`:** primary/secondary information on bone.
- **Structural Line / Neutral Edge — `line` / `neutral-edge`:** surface dividers and neutral channels, outlines, and scrollbar material.

**The Semantic Color Rule.** State colors describe authority or an operation's consequence. Keep mode/network labels neutral; use text, path style, and explicit state labels so color is never the only explanation.

## Typography

**Display and UI Font:** Geist Sans, implemented as `"Geist Variable", sans-serif`.
**Label and Numeric Font:** Geist Mono, implemented as `"Geist Mono Variable", monospace`.

Both variable fonts load locally through Fontsource imports. Headlines use deliberate tight tracking and variable intermediate weights. Mono identifies exact amounts, depth, addresses, paths, provenance, and state. It supplies equal-width digits without a separate numeric-feature token.

### Hierarchy

- **Display:** the Story thesis uses the frontmatter clamp, heavy weight (650), tight leading (0.99), and tracking (-0.04em). Responsive overrides use (62px) below the compact-desktop breakpoint, (52px) on tablet, and (42px / 1.02) on mobile.
- **Headline:** Story section headings use the headline clamp and leading (1.08). The cut scene uses a fixed (46px), then (38px), (36px), and mobile (32px) as space narrows.
- **Title:** instrument headings use (30px / 1.2); operating route headers use (24px). Command's graph toolbar heading stays compact (14px).
- **Body:** the base is (14px / 1.5). Story support starts at (22px / 1.4), then (19px) on tablet and (18px) on mobile. Explanatory copy uses bounded widths where present, commonly (380–580px).
- **Node title:** flat mandate identity uses (13px, 550), with ellipsis for long labels. Story's spatial node title uses (15px), dropping to (13px) at compact desktop.
- **Amount:** instrument focus uses (29px / 1.4), with (28px) in impact preview and (32px) for settled Arena payout. Treasury values use (24px / 1.3). Flat node rails use (21px / 1.4); Story uses (24px), with a larger Root rail (27px).
- **Label:** metadata and status have a readable floor (11px). Status is uppercase with tracking (0.02em); instrument metadata varies to (0.04em), and scene labels to (0.05–0.08em). Controls use (11–16px) according to their role, with the main button at (13px).

**The Exact Amount Rule.** Keep financial truth in the account model and display exact formatted values. Amount animation must never calculate balances, begin from an invented zero, or obscure the final value.

## Layout

The shell is full width, with a sticky desktop header (64px), horizontal padding (32px), and three route links. A visible skip link appears on keyboard focus. Content replacement retains the shell and Root identity.

Story's first composition is editorial/object (38% / 62%) with padding (32px 40px 0). It becomes (39% / 61%) at compact desktop, then a single column on tablet/mobile. Its six scene links use ordinary anchors. Later sections use two equal columns, padding (64px 48px), and a wide gap (80px); the cut scene uses (34% / 66%). Mobile sections use a single column and padding (36px 20px). Redundant section kickers have been removed from the implemented Story.

Command begins with a treasury band (88px). Its desktop grid is a hierarchy rail (152px), a flexible tree, and a fixed bone inspector (336px). The graph toolbar is (54px). Authority layout uses stable rank spacing (132px), a view box width (900), and a minimum graph height (530px). Mandate dimensions do not encode budgets. The tree legend uses vertical padding (8px) and bounds its accounting suffix (340px). The compact evidence dock sits directly below the tree and exposes one recent event with row padding (6px 0); history expands to reveal more rows.

Arena uses a flexible mission field and the same fixed instrument (336px). Its stage is (530px) tall, with fixed submission lanes, a central shallow basin, and a narrow verifier gate. The lower explanation and evidence remain flat.

### Responsive behavior

- **Compact desktop (max-width: 1279px):** remove the hierarchy rail before shrinking graph text, reduce instruments to (320px), and reduce outer padding.
- **Tablet (768–1000px inclusive):** Story, Command, and Arena reflow to one column; instruments follow their field. The tree remains spatially arranged with compact plates and amount rails (16px). Arena keeps the stage with adjusted lane/basin proportions. Some redundant ledger metadata and legend copy are hidden to preserve room.
- **Mobile (max-width: 767px):** use a two-row sticky shell (104px), with route links below the wordmark/controls. Replace the graph with nested mandate ledger buttons rather than a miniature canvas. Rows indent by depth (12px per level), retain exact values/status, and have a minimum height (76px). Selecting a row scrolls to the full-width inspector. Arena uses mission summary, contender rows, verifier, and the following instrument. The treasury summary becomes a two-column grid.

Use the extracted spacing values for recurring rhythm; denser forms, wider Story sections, and the fixed inspector have different needs. Preserve visible mode/provenance and inline unavailable explanations as content grows.

## Elevation & Depth

Depth comes from composition, overlap, and a small amount of geometry. Command's plates and bone inspector have no shadow or perspective. Story alone uses three translucent structural planes with perspective (850px) and restrained plane rotations; node text remains screen-flat. Arena's basin uses a skewed background plane (-14deg) while its labels and financial instrument stay flat. No raster UI assets are shipped.

### Shadow Vocabulary

- **Story plate underside:** `0 8px 0 #101513, 0 18px 22px #0002`; used only by spatial Story mandate plates.
- **Wallet overlay:** `0 16px 40px #0005`; distinguishes the temporary bone wallet popover from the persistent field.
- **Selection:** a bone border plus an offset outline, not a glow or lifted operating card.

**The Flat Operation Rule.** Keep Command and financial text flat. Do not export Story perspective, underside shadows, or decorative depth into operating instruments.

Motion is bounded: control feedback (150ms), plate state feedback (160ms), route-plane reveal (240ms), copper boundary draw (220ms), grant travel (480ms), endpoint materialization (700ms), cut brightness resolve (700ms with depth delay capped at 300ms), and Arena channel resolve (700ms). Grant ends with an exact capacity delta after the endpoint resolves. Trace changes path contrast directly; there is no animated camera or independently animated trace. The current build has no capital-return animation or count-up balance interpolation.

**The State Before Motion Rule.** Motion consumes known state; it never proves success. Pending retains the last verified authority. Reduced motion removes animations/transitions, perspective, grant travel, and smooth scrolling while preserving exact labels and state.

## Shapes

Mandate plates and inputs have gently eased corners (3px). Main buttons use a restrained control corner (4px). Root has a single upper-right corner treatment (`0 8px 0 0`) and a centered outbound port. Its shell mark is an authored chamfered SVG with the same port. These are the recurring signature shapes, not a bank/robot pictogram set.

Use thin structural borders (1px), the active authority stroke (1.7px), and the copper impact contour (1.5px, dashed). Selection adds a bone border and an offset outline (1px / 3px). The global focus outline is stronger (2px / 4px). Trace dots and pending checklist marks are small circles with a specific state purpose; the broader identity stays rectangular. Arena contender lanes are square-cornered.

## Components

### Buttons

Restrained instruments with clear verbs and an arrow where it assists direction.

- **Primary:** bone with green ink, padding (12px 16px), minimum height (44px), and the control corner. Hover shifts to warm light. Story's larger variant uses padding (16px 24px), type (16px), and minimum height (56px); mobile Story controls are full width.
- **Dark:** green ink with bone text, used inside the bone instrument for supported execution.
- **Subtle:** transparent with a neutral edge; color inherits the containing surface. Its light hover veil belongs to the dark surface.
- **Copper:** dark copper with bone text for reviewed revoke; outline copper is the preceding preview control.
- **State:** ordinary controls dim to (0.5) when disabled, and use a not-allowed cursor. Disabled explanations sit alongside the action. Focus uses the global bone outline on dark, green ink on bone. Hover excludes disabled main buttons.

### Status Marks

Small mono labels provide a parallel text vocabulary: ACTIVE, REVOKED, BLOCKED, and UNKNOWN. The bone inspector adds a compact tinted backing and dark state ink. These are labels rather than decorative pill badges. Blocked descendants preserve a separate LOCAL ACTIVE label where the source model supports it.

### Mandate Plates / Containers

The canonical flat mandate plate is (184px × 86px), with padding (10px 12px), a field background, a thin muted edge, and the plate corner. Root is wider (222px) with the port treatment. A plate contains identity/depth, an exact amount rail/unit, and effective state plus scope. Selected plates use a stronger surface and bone outline; preview affects the edge without changing state. Revoked and blocked plates remain present.

Story uses the same anatomy with a spatial underside; its Root is (244px × 94px). The bone instrument is a continuous rail with padding (28px 28px 24px), ruled details, and no floating-card shadow.

### Inputs / Fields

Mono values sit in transparent fields with a thin neutral-green stroke, the plate corner, padding (10px 12px), and minimum height (42px). Fields inherit text color from their surface; caret is mint on graphite and ink on bone. Search is a compact, underlined variant in the hierarchy rail. Focus is explicit; errors appear as readable text adjacent to the form.

### Navigation

Three understated text links share the persistent shell: Story, Command, Arena. Unselected links use muted text; hover brightens; the current route has primary text and a mint lower rule (2px). Mode/network stays neutral. The wallet control is separated with a structural rule and opens a bone popover. On mobile route links occupy the second header row.

### Authority Structure / Trace

DOM mandate buttons overlay SVG directed channels. Active channels are solid mint; invalid continuations are dashed red, with a red inbound cut mark at the locally revoked node. Unknown paths use a neutral dotted treatment. Selection does not mutate state. Trace highlights the complete Root path and can dim unrelated branches; preview and revoked-state proof suppress that dimming so the unaffected sibling stays readable.

The flat ordered trace shows ancestor name, state, and exact amount. The earliest locally revoked ancestor is marked REVOKED · BREAK. Mobile uses the nested ledger equivalent, preserving the same entities and selection.

### Impact Instrument / Rejection Proof

Preview uses a grouped copper contour around the target and descendants plus an integrated bone impact instrument. It labels PREVIEW · NO TRANSACTION, one local revoke, the descendant count, account-derived remaining capital, beneficiary, and unaffected branch. Review and confirmation occupy the same instrument. Preview expands collapsed branches; it does not cut paths, alter balances, or create success evidence. Escape and Cancel return focus to the initiating Preview revoke control.

After revoke, the target is locally revoked and descendants are effectively blocked. Rejection proof remains visible with the earliest broken ancestor and actual program provenance or an explicit simulated label. Capacity release, separate reclaim, and token movement are distinct rows.

### Evidence / Arena Lanes

Evidence is a compact ruled ledger of title, path/detail, and provenance; real signatures/links/logs appear only when supplied by the integration. No skeleton bars substitute for evidence. Compact Command mode keeps the recent row visible below the graph; History expands the sequence.

Arena uses fixed submission rows/lanes rather than profile cards. Submission channels are dashed; the selected settled lane becomes solid; funding and settlement have separate directed tracks. A resolved brass channel and verifier decision accompany the exact payout in the flat bone instrument. The mobile sequence exposes the same mission, rows, gate, and action.

## Do's and Don'ts

### Do:

- Do preserve the recurring Root geometry, downward authority ranks, and exact node amount rails.
- Do keep the bone instrument flat and make account scope, local/effective status, units, and provenance readable.
- Do keep preview copper and authority unchanged until execution; show the unaffected sibling outside the impact boundary.
- Do retain revoked and blocked topology, identify the broken ancestor, and keep rejection evidence persistent.
- Do use the nested ledger below 768px and the single-column field/instrument layout through 1000px.
- Do preserve visible keyboard focus, Escape/Cancel focus restoration for preview, and immediate reduced-motion state.
- Do label simulated amounts and outcomes, and derive live evidence from the existing integration.

### Don't:

- Don't sum nested subtree balances as organization capital or animate token recovery merely because authority was revoked.
- Don't use semantic mint, copper, red, or brass as unrelated decoration or neutral mode badges.
- Don't add generic card grids, crypto sculpture, robots, glass, particles, continuous edge loops, or copied library styling.
- Don't put perspective, bevels, underside shadows, or oversized hero typography into Command.
- Don't shrink the desktop graph into an unreadable mobile canvas or reduce metadata below 11px.
- Don't rasterize interface text, introduce additional font families, or treat concept screenshots as runtime assets.
- Don't display fabricated signatures, Explorer links, program errors, onchain confirmation, or live balances.
