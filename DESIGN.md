---
name: MandateOS V2 — Authority Loom
description: Recursive capital authority expressed as open graphite architecture, exposed authority rails, and exact native financial inspection.
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
    fontSize: "100px"
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
    fontSize: "76px"
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
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.12em"
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
    fontSize: "29px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.04em"
rounded:
  square: "0"
  status: "2px"
  input: "3px"
  authority-dot: "50%"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
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

The organization is an open architectural object: a large Root frame, offset descendant frames, exposed branching rails, and persistent negative space. Procedural graphite materials, narrow illuminated edges, a grounded floor, and rear structural columns give Story and Arena a shared physical setting. Large condensed display type occupies an asymmetric editorial field. Authority Loom replaces the earlier Authority Chamber plate direction.

The same organization becomes a flat operating tree in Command. Native text, exact amounts, complete lineage, controls, and evidence remain separate from the rendered geometry. Mint describes effective authority; copper encloses an all-active impact preview; red interrupts the revoked ancestor's inbound authority; brass marks a resolved verified settlement or an explicitly simulated settlement. The bone inspector keeps financial inspection flat and readable.

This is an extraction of the implemented system, not a new visual brief. The approved high-end visual specification and build prompt establish the replacement world; the current CSS, components, and local font imports establish its values. `PRODUCT.md` supplies the durable protocol constraints. Production-browser captures in `artifacts/high-end/pass2` record the implementation at 1440×900, with 1280×800, 768×900, and 390×900 variants. They do not establish pixel parity with the concept images or successful live Devnet execution; material detail remains subject to visual verification.

**Key Characteristics:**

- Open graphite frames and exposed authority rails replace mandate plaques.
- One persistent Story object compresses into the flat Command relations.
- Anton display type contrasts with Geist body and exact mono information.
- Native DOM/SVG text, controls, lineage, and evidence carry product truth.
- Event-bounded spatial rendering has a native ledger fallback.

## Colors

Dark graphite and warm bone carry the composition; state colors carry a specific authority or execution meaning. Frontmatter values are normative for the UI. `loom.css` overrides the shared palette after `globals.css` and `experience.css`; inherited ink tokens still serve forms and financial text. Sidecar tonal ramps are display metadata, not additional shipped palette tokens.

### Primary

- **Authority Mint — `mint`:** active structural rims, effective authority rails, selected ancestry, selected tree markers, and Story's emphasized thesis. Mint is not transaction confirmation.

### Secondary

- **Impact Copper — `copper`:** affected-branch boundary and unpaid verifier preview. The spatial preview shader uses its own authored warm copper value; it is a material treatment, not a replacement UI token.
- **Copper Ink — `copper-ink`:** consequence text and revoke controls on bone.
- **Settlement Brass — `brass`:** the selected settled Arena lane, verifier resolution, and settlement endpoint. A demo retains visible simulation provenance.

### Tertiary

- **Authority Cut — `red`:** local revoked state and interrupted incoming authority. Descendants become blocked, with darkened rails rather than additional local red revoke marks.
- **Cut Ink — `red-ink`:** blocked/revoked text and errors on the financial instrument.

### Neutral

- **World Graphite — `world`:** shell, Command field, flat nodes, and fallback ledger.
- **Field Graphite — `field`:** inherited field surfaces and resolved tonal layering.
- **Bone — `bone`:** Command inspector, plane-change inspector, primary action, and the responsive Arena instrument.
- **Warm Text / Muted Text — `text` / `muted`:** primary and secondary information on dark surfaces.
- **Financial Ink / Muted Ink — `ink` / `ink-muted`:** exact financial values and supporting information on bone.
- **Inspector Ink — `inspector-ink`:** recurring bone-control and plane-inspector contrast.
- **Structural Line / Relation — `line` / `relation`:** dividers and inactive flat relation strokes.

**The State Color Rule.** Copper previews a consequence without changing authority status. Red marks the actual local cut. Brass appears only with resolved settlement and its provenance. Always pair color with explicit text and path treatment.

## Typography

**Display Font:** Anton, with sans-serif fallback.
**Body Font:** Geist Sans, implemented as `"Geist Variable", sans-serif`.
**Label and Numeric Font:** Geist Mono, implemented as `"Geist Mono Variable", monospace`.

All three fonts load locally through Fontsource CSS imports in `layout.tsx`. Anton is the one added display family. It supplies condensed, uppercase architectural scale; Geist supplies the operating interface and mono financial detail.

### Hierarchy

- **Arrival display:** fixed display size from frontmatter, with horizontal compression (`scaleX(0.72)`) and left transform origin. The main thesis has authored line breaks and mint emphasis. It becomes (85px) below 1400px, (58px) in the native fallback, and (54px) below 768px.
- **Story headline:** the frontmatter headline clamp is the general rule. Trace, preview, and cascade have authored desktop sizes (66px, 68px, 77px). The organization chapter uses a mono heading (14px) and plane change a mono heading (23px); these are existing chapter-specific treatments.
- **Arena headline:** uses the frontmatter Arena role, then (65px) below 1400px and (58px) in the fallback. Mission titles use Anton (36px / 1.15); mission bounty and resolved payout remain real formatted DOM values even where Anton supplies their display treatment.
- **Inspector title:** Geist at the frontmatter size and weight, then (34px) below 1400px. Plane-change inspection uses (36px).
- **Body:** the shared operating base uses the frontmatter body role. Story support uses (17px / 1.5), with a bounded width (410px), then (14px) in the native fallback. Arena support uses (15px / 1.55).
- **Amounts:** flat-node values use the frontmatter mono amount role, then (16px) below 1400px. Command inspector values use the larger mono role. Spatial annotation values use (15px); exact mobile ledger values use (14px).
- **Labels and controls:** spatial names are uppercase mono with wide tracking. Shell, state, and provenance details use existing compact sizes (8–12px), with operational controls generally (11–14px). Preserve the native text and readable hierarchy when changing density.

**The Exact Text Rule.** Labels, monetary values, status, addresses, and evidence stay in native DOM/SVG. Geometry and animation consume the existing state; they never calculate balances or supply transaction evidence.

## Layout

Desktop Story uses one sticky viewport stage (100vh, minimum 740px) inside a persistent scroll extent (minimum 450vh). The editorial field starts at (54px, 180px) and has width (440px); the Loom occupies the shared stage behind it. Six chapter controls sit at bottom left and Back/Next/Reset at bottom right. Scroll and chapter controls change the current representation without rebuilding the world. At compact desktop, outer margins become (30px).

Story → Command uses the same operational anchors. The spatial stage compresses depth, projects native annotations into flat relations, and resolves the bone inspector. Open Command carries the existing selected mandate and eligible demo state; reduced motion and narrow viewports navigate directly. No separate decorative transition supplies financial state.

Command is a native DOM/SVG workspace at every viewport. Its desktop grid is a flexible tree beside a bone inspector (29.5%). A top operating header (80px) shares its row with exact Root/vault/mandate figures. The tree's search and compact toolbar precede the working surface; the evidence dock follows it. The inspector is sticky at (80px), uses internal padding (32px), and scrolls within the remaining viewport. At compact desktop its padding becomes (25px).

The six canonical anchors are Treasury at (43% width, depth 0), Research (35%, depth 1), Operations (82%, depth 1), Data (21%, depth 2), Analysis (50%, depth 2), and Scraper (11.5%, depth 3). Vertical placement is (55px + depth × 143px), with a minimum map height (575px). General graphs retain the existing layout algorithm. Native node buttons show model-formatted own available amounts; the inspector retains subtree remaining and the complete path to Root. Node size is not a budget scale.

Arena places a mission, three submitted-result lanes in the canonical demo, a narrow verifier, and a settled endpoint in the same procedural setting. The desktop stage is (100vh, minimum 740px). Its flat native summary sits at top right with a divider and no panel background; on fallback layouts it becomes a bone financial instrument after the mission ledger. All mission data and controls remain native elements.

### Responsive behavior

- **Below 1400px:** Story outer margins reduce to (30px), display type and flat nodes reduce in size, and the Arena summary becomes narrower (240px).
- **Below 1100px or reduced motion:** Story and Arena do not mount the lazy spatial scene. They use native nested authority or mission ledgers, a normal document flow, relative chapter controls, and following inspection. Command reflows below 1100px; at desktop reduced motion it keeps its flat two-column graph.
- **Nested authority ledger:** depth-first ordering keeps each subtree contiguous. Row indentation is (18px + depth × 22px), minimum row height is (76px), and each row retains its name, exact amount, depth, and effective status.
- **Below 768px:** shell controls and navigation use compact sizing; arrival display reduces to (54px). Responsive documents remain scrollable, with full-width financial inspection and explicit provenance.
- **GPU loss or canvas failure:** the spatial wrapper marks the scene unavailable and retains native authority content. Arena switches from its stage to its mission ledger. Native inspection and controls remain available.

## Elevation & Depth

Story and Arena use actual procedural Three.js geometry through a lazy React Three Fiber scene. Open extruded frames have structural thickness (0.22 world units) and a narrow edge bevel (0.028); rails curve through deliberate corners rather than connecting card centers. Root repeats two rear frames. Offset frames, the floor, rear columns, distance fog, material response, and real shadows establish foreground and background. There are no shipped concept-image backgrounds.

The current front structural material uses `MeshStandardMaterial` with color (`#424844`), roughness (0.46), metalness (0.28), and bump scale (0.038). Rear structure uses (`#1d2321`), roughness (0.72), metalness (0.12), and bump scale (0.009). A generated repeating height field (128×128) combines deterministic interpolated hash noise at three scales; mesh-space shader variation adds fine surface detail without visible sinusoidal bands. The floor uses (`#242b27`), roughness (0.2), and metalness (0.42). A procedural room environment has intensity (0.28), and the front area key has intensity (1.1); authored directional/spot lights and soft shadows reveal edges. These values record implementation, not a claim of finished material parity.

The authority stage keeps six area-light slots for canonical chambers plus the shared environment lights; scene events update their intensity and transform. Chamber light intensity is (4 × effective authority × construction), and lights extinguish during flattening. The constant light count avoids recompiling the physical materials when a delegate appears. No lights are added per animation frame. The canvas uses a demand frame loop, low-power preference, ACES filmic tone mapping, and exposure (0.9). RenderBudget observes only already-requested demand frames; it never starts an idle loop. After four valid interframe intervals (8–180ms), an upper median above (36ms) lowers only the Canvas render scale through (1 → 0.75 → 0.5625 → 0.5), within the limit (0.5–1). Scale persists in local presentation state across model-prop updates. On a weak GPU, reduced quality affects only rendered geometry; native DOM/SVG retains full CSS resolution, and camera, projection, and authority state remain unchanged. Each event still stops requesting frames when its step resolves.

Command, native ledgers, and bone inspection use flat tonal contrast and relation strokes. Spatial text has a restrained readability shadow; financial panels do not gain the rendered object's perspective or surface texture.

### Shadow Vocabulary

- **Spatial annotation:** `0 2px 12px #080b0b`; supports native labels over geometry and disappears in the flattened representation.
- **Wallet overlay:** `0 16px 40px #0005`; the inherited temporary wallet popover treatment.
- **Physical structure:** soft canvas shadows, with the authored directional shadow map (1024×1024); these belong to geometry rather than operating panels.

**The Flat Inspection Rule.** Financial inspection and Command remain flat. Procedural depth belongs to the explanatory and mission objects, while native text and interaction remain screen readable.

Motion is driven by the same state as camera, frames, rails, labels, and deltas. The current scene director uses default resolve (650ms), trace (800ms), copper preview (950ms), grant (1150ms, or the existing construction override), cascade (1400ms), and plane compression (1150ms). Arena uses ready resolve (400ms), funded/submitted resolve (900ms), and settlement resolve (1300ms). Each event requests frames until it resolves, then returns to idle. Hidden documents resolve or cancel pending choreography, and reduced motion bypasses spatial rendering. Existing CSS feedback uses the shared selection (140ms) and receipt (200ms) timings.

## Shapes

The signature silhouette is a sequence of open structural frames. Their thickness and offsets make hierarchy perceptible while leaving the center open. The impact preview is a branch-shaped copper wire volume. The single local revoke is a small red interruption on the incoming Research relation; retained descendant structure darkens after it loses effective authority.

Operating surfaces and buttons have square corners. Inputs retain a modest inherited radius (3px); instrument status retains (2px). Circular authority dots are small relation anchors (16px desktop, 10px ledger), not avatars. Flat relations use orthogonal vertical/horizontal routing, with a brighter selected lineage. Native preview contours enclose the affected subtree without changing its status.

## Components

### Buttons

Primary actions are flat bone slabs with native labels and a directional icon where present. Story's action uses minimum width (190px), minimum height (56px), and padding (0 20px). General operating buttons use minimum height (48px), padding (12px 16px), and square corners. Existing dark, transparent, copper, and copper-outline variants remain available. Command's revoke preview is a full-width divider action with padding (18px 0), rather than a raised card.

Feedback changes background or border; buttons do not float on hover. Disabled controls keep their actual eligibility and inherited reduced opacity. Native keyboard focus remains visible; bone instruments use a dark green focus outline. The sidecar records component-specific hover, focus, and active CSS.

### Inputs / Fields

Transaction fields are transparent native inputs with a restrained stroke, mono values, padding (10px 12px), minimum height (42px), and modest corners. Command's search is visually lighter: an inline icon and borderless query field. A search result can expose a small bone result area. Focus, errors, and eligibility explanations remain native and adjacent to the relevant action.

### Navigation

Only Story, Command, and Arena are surface links. The desktop shell uses uppercase labels (12px, tracking 0.12em), a mint active underline, and neutral mode/network controls. Story/Arena place the shell over the stage; Command combines navigation and treasury information in its operating row. Chapter controls are ordinary buttons with current-step semantics and a mint underline. Wallet and mode controls retain their real state.

### Status

Status is explicit uppercase mono text. Spatial annotations retain active/revoked/blocked labels; compact flat-map nodes hide active text but retain revoked/blocked text and selected path markers. Native ledger rows always include effective status. The Command inspector shows both stored local state and effective state, with its compact active badge on bone. Preview adds a copper contour without replacing active labels.

### Flat authority tree and bone inspector

Node identity sits beside an exposed relation anchor, followed by the exact available amount. Selection adds a mint bottom rule and illuminates the complete available ancestor path. Treasury, Research, Operations, Data, Analysis, and Scraper all remain in the canonical tree; explicit collapse is the existing operator action. Inspection shows available, subtree remaining, parent, depth/children, complete ancestry, actions, and provenance. It does not copy geometry into the financial pane.

### Persistent spatial Loom

Story uses the existing `genesis` fixture and `revokeDemo` operation. Construction reveals the existing mandates, trace resolves their existing ancestry, and copper preview leaves every affected record active. Confirmation revokes Research locally and makes Data, Analysis, and Scraper effectively blocked while Operations remains active. The physical frames persist. The separate accounting line explains the fixture's release of Research capacity and unchanged shared vault; the cut itself is not a token-transfer animation.

### Arena execution stage

The source lifecycle remains `ready → funded → submitted → settled`. Candidate selection is an unpaid UI preview, not an extra transaction state. Copper identifies that preview. Only the settled winner continues through the verifier into the brass endpoint. The two final checklist entries resolve together because verification and payout are atomic in the existing operation. Demo A/B/C submissions, values, and receipts remain explicitly simulated; real views use the existing bounty/submission accounts and transaction lifecycle.

### Evidence and recorded surfaces

The compact event sequence shows the current evidence and expandable history. Demo events say simulated; real transaction links and outcomes come from the existing client. These production-browser images record the seven built compositions:

| Composition                 | Implemented capture                                                         |
| --------------------------- | --------------------------------------------------------------------------- |
| Arrival                     | [01-arrival.png](artifacts/high-end/pass2/01-arrival.png)                   |
| Organization                | [02-organization.png](artifacts/high-end/pass2/02-organization.png)         |
| All-active impact preview   | [03-blast-preview.png](artifacts/high-end/pass2/03-blast-preview.png)       |
| Authority cascade           | [04-cascade.png](artifacts/high-end/pass2/04-cascade.png)                   |
| Plane change                | [05-plane-change.png](artifacts/high-end/pass2/05-plane-change.png)         |
| Flat Command                | [06-command-active.png](artifacts/high-end/pass2/06-command-active.png)     |
| Simulated atomic settlement | [07-arena-settlement.png](artifacts/high-end/pass2/07-arena-settlement.png) |

Responsive captures use the existing `390-`, `768-`, and `1280-` route filenames in the same directory. `results.json` records the browser and captured viewports. Captures are visual evidence of the build, not chain evidence.

## Do's and Don'ts

### Do:

- **Do** preserve the open Root and descendant frames, exposed rails, and one shared graphite environment.
- **Do** keep native text, exact amounts, controls, complete ancestry, and evidence driven by the existing model.
- **Do** keep all affected mandates active during copper preview and distinguish local revoke from effective descendant blocking.
- **Do** use brass only for resolved settlement with real or explicitly simulated provenance.
- **Do** keep the Command tree and bone inspection flat, with all six canonical nodes and complete paths.
- **Do** retain event-bounded rendering and native ledger fallback for narrow viewports, reduced motion, and scene failure.

### Don't:

- **Don't** restore the superseded mandate-plate composition or substitute repeated cards for the open Loom.
- **Don't** ship concept images as UI backgrounds or place product labels and amounts inside raster or canvas text.
- **Don't** use broad bloom haze, random particles, smoke, generic network orbs, floating panes, or decorative gradients.
- **Don't** animate token recovery from an authority cut or invent intermediate verification/payout transaction states.
- **Don't** fabricate signatures, confirmations, addresses, rejected transactions, Explorer evidence, or live Devnet success.
- **Don't** claim photo or pixel parity from the current captures; verify visible material detail against the approved targets.
