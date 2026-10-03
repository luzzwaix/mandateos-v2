# Authority Chamber rebuild

## Preservation boundary

- `programs/mandateos/src/instructions/*`, `validation.rs`, and `docs/PROTOCOL.md` define accounting. Max depth 4; one shared vault; complete lineage validation.
- `web/src/lib/solana/{client,pdas,program,wallet,types}.ts` and generated IDL remain the integration boundary.
- Presentation consumes normalized selectors. Simulated entities use readable fixture IDs, never counterfeit public keys or signatures.
- Revoke returns `target.subtreeRemaining` to the direct parent's available authority. Descendant balances remain historical. Token movement requires Spend, Reclaim, or Arena settlement.

## Direction contract

THESIS: the organization is the signature object; capital is embedded into authority.
OWN-WORLD: graphite field, bone operating instrument, compact chamfered Root, orthogonal mint channels, copper impact enclosure, red cut.
STORY: build a bounded organization, trace an ancestor, preview a cut, inspect the blocked path, enter Command or Arena.
FIRST VIEWPORT: Story editorial 38% with a dominant spatial structure; Command tree and precise fixed inspector; Arena converging lanes and flat settlement instrument.
FORM: user-frozen Authority Chamber; code-led interpretation of supplied studies. No concept tournament.
FINISH: two browser passes, responsive and semantic QA, checks, scoped commit, concrete Devnet blockers.

## Baseline

Clean `submission-v1`, starting commit `e1b2756`. Existing frontend exposes only `/`; `/app` and `/arena` are absent. Baseline web lint/types/build and root types passed. Rust format/check passed using installed GNU toolchain. The isolated validator suite completed with 64 passing tests.

## Devnet blockers found before edits

Configured program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63` requires five instruction names. Checked-in IDL uses baseline address and nine Core/Arena instructions. Existing gate blocks mutation; it remains intact. The production browser's live read on 2026-10-03 also reported the configured program absent. No Devnet transaction was submitted.

## Built world

- Persistent shell and local Geist fonts connect Story, Command, and Arena. Mode, wallet, network, provenance, and freshness are explicit.
- Story begins with one funded Root. Each delegation activates its existing path, travels to an endpoint, resolves a child, and settles its exact capacity. Trace, preview, confirmed cut, blocked execution, and route transitions remain interactive.
- Command retains a stable, flat capital hierarchy and a bone inspector. Available capacity, subtree remaining, parent, depth, children, local/effective status, full lineage, operations, and evidence are selectable. Preview encloses the affected branch in copper while every mandate remains active. Confirmation cuts Research, preserves descendant local records, and leaves Operations active.
- Arena presents one shared-vault funding path, mission, submission commitments, trusted-verifier selection, payout, and evidence. Demo settlement updates the same Command balances and preserves the chosen result across navigation.
- The balanced fixture starts with 1,590.00 USDC in the vault, 1,000.00 Root available, and 390.00 Research subtree remaining. Revoke releases 390.00 to Root available without moving tokens. Descendant stored amounts are historical after the cut. Every fixture and outcome is labeled simulated.

## Integration boundary after rebuild

Rust, generated IDL, wallet adapters, program/RPC configuration, PDA derivation, account parsing, Core/Arena instruction builders, and transaction sending/confirmation are unchanged. Existing tests remain intact.

`authority.ts` converts real snapshots into presentation selectors; its pure simulator follows the audited accounting. `use-console.ts` additionally gates polling in demo mode, exposes freshness and revalidation, and retains a submitted signature when confirmation becomes unknown. The public refresh contract remains compatible. `types.ts` adds only the unknown-confirmation phase. The static preview server now serves clean exported routes and RSC payload MIME correctly, preserving shared state during client navigation.

## Browser QA

The actual production export was opened in the Codex browser, with CSS viewports 1440×900, 1200×900, 768×1024, and 390×844. Captures are in ignored `artifacts/visual/pass1/` and `pass2/`. Native screenshots use JPEG bytes, despite the capture filenames' `.png` suffix. Full-page and viewport captures from the primary passes were reviewed; final reviewer corrections use fresh viewport/section captures.

Inspected Story Root and five grants, authority trace, preview, confirmed cut, rejection proof, scene transitions and reset; Command active, selection, trace, collapse/expand, pre-revoke review/cancel/confirmation, cascade and blocked execution; Arena funding, three submissions, alternate winner selection, final settlement, reset and navigation persistence. Demo Spend, Reclaim, Deposit, and Delegate were exercised through their forms. No horizontal document overflow occurred at the tested widths, and node geometry remained unchanged between active and cascade states.

Wallet disclosure, missing-Phantom failure, Escape focus restoration, mode selection, live deployment failure, invalid organization input, and unverified Arena were inspected. PRE-revoke entered from an active trace retains six active statuses and zero dimmed nodes. Escape and both Cancel controls restore Preview revoke focus.

The mandatory second art-direction pass corrected a 1200px zoning defect, phone headline spacing, tablet reflow and plate separation, metadata readability, selected Arena channels, persistent winner state, and Command evidence density. A fresh finish reviewer supplied the final bounded correction list. All shipped UI imagery is DOM/CSS/SVG; there are no generated raster assets or fake chain evidence.

The reviewer's final disposition was **ship**, scoped to six scored corrections: tablet geometry, visible desktop evidence, metadata readability, PRE-revoke trace dimming, preview focus restoration, and redundant Story kickers. All six were resolved against fresh viewport/section captures and current source. Older full-page captures were excluded from that verdict after the browser's full-page capture path began failing; fresh viewport captures remained valid.

Browser reduced-motion emulation was unavailable; reduced-motion CSS and immediate-grant logic were inspected in source. A connected wallet, user cancellation, real pending/confirmed/rejected transaction states, RPC interruption, and large real account trees remain unverified because the deployment/IDL gate is closed. The production browser produced no console errors or warnings during the inspected flows.

## Checks

- Web ESLint, route type generation/typecheck, and static production build: pass.
- Root TypeScript: pass.
- Existing local-validator integration suite: 64 pass.
- Existing Rust library tests: 16 pass; Rust format/check: pass with installed GNU toolchain.
- Added accounting/lineage/impact selectors: 9 pass.
- Secret scan and Git whitespace check: pass against staged shipping files before commit.

The build reports the existing optional bigint native-binding fallback and uses pure JavaScript successfully.

## Pass 2: real Devnet integration

1. Select the actual deployment target and establish its program/IDL/account schema. The repository's protected nine-instruction Core/Arena implementation and the configured five-instruction deployment contract currently disagree. Obtain a matching public IDL and explicitly adapt the existing parser/builders if the chosen deployed schema differs. Do not bypass compatibility verification.
2. Deploy or identify the verified executable on Devnet; align declared program ID, generated IDL address, public frontend configuration, RPC, and genesis/network checks. Verify all Core and Arena instruction availability before enabling writes.
3. Create a real classic SPL mint and funded organization. Record actual organization/vault/mandate PDAs; establish the six-node hierarchy with legitimate controller wallets, correct decimals, exact lineage, and configured depth. Display token units from observed state rather than calling an arbitrary mint USDC.
4. Execute and confirm delegation, Spend, Research revoke, descendant rejection, unaffected Operations Spend, and separate Reclaim. Re-read accounts after every confirmation and prove the target-only local revoke, descendant effective blocking, parent capacity release, and vault movements with real signatures/logs.
5. Fund an actual bounty, submit genuine commitments from contenders, settle an authorized submitted winner through the trusted verifier, and verify Root reservation, vault payout, winner token account, and one-time settlement.
6. Capture connected/cancelled/pending/confirmed/rejected/unknown-confirmation states, stale RPC recovery, and changed-account re-review on desktop/mobile. Attach only observed signatures, program logs, and matching Explorer links. Preserve demo as an explicitly simulated entry experience.
