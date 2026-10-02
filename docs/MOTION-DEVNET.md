# Devnet motion refinement — 2026-10-02

The existing Next.js frontend is preserved. No Sites application, new route, product feature or dependency was added. Rust/Core and the generated IDL are unchanged.

## Audit and blocker

The requested program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63` has no account at the official Devnet RPC. Its published Anchor IDL was not found. The checked-in IDL belongs to `Fg6PaFpoGXkYsidMpWxTWqkZ5gnk9j8GaZ9epbEYwPqG` and exposes `create_organization`, `delegate`, `deposit`, `reclaim`, `spend`, `revoke_branch` and Arena instructions. It does not expose the requested `create_root`, `reserve_child`, `reclaim_budget` ABI.

The console now targets Devnet only. It verifies the actual genesis hash, executable program account and IDL compatibility before reading accounts or signing/broadcasting. It does not rewrite an incompatible IDL's address. Non-authorized application discriminators are rejected. Local disposable signing is disabled. The existing Arena tab is disabled because it is outside the requested five operations. Core instruction names were not invented or renamed.

Amounts remain absent until verified accounts can be loaded; the explanatory graph is explicitly marked ILLUSTRATION. Test mint units were corrected to TEST TOKENS/TOKENS. The network label means Devnet is configured; the deployment label explicitly says it is not verified.

Run the read-only audit:

```powershell
node scripts/audit-devnet.mjs
```

Exit 2 means the requested deployment/IDL is missing or incompatible. The public report is saved in [devnet-audit.json](devnet-audit.json). No wallet or private key is needed. Continuation requires the actual deployed public program ID, matching generated IDL and account adapter; providing a private key does not solve this ABI mismatch.

## Visual thesis and framework

Institutional capital-control: graphite surfaces, IBM Plex Sans, one restrained mint accent, aligned amounts and a large orthogonal capital hierarchy. Capital Cascade remains the focal sequence. There is no Halloween artwork, copied logo, scroll hijacking or permanent decorative animation.

Before editing, the product references Jupiter, Kamino, Drift and Pyth and the requested MotionSites, Hero Shutter Text, React Bits Scroll Reveal, Agent Elements, Cartier and La Conserverie pages were opened. Some client-rendered references expose little readable content; they are quality references, not copied source/components.

ORNEQ evidence read: `qa/polish-report.md`, `qa/polish-reference-map.md`, `qa/polish-production-smoke.json`, `qa/elevation-report.md`, `qa/visual-rebuild-notes.md`, and the desktop production screenshot from the existing ORNEQ-HALLOWEEN project. The framework carried over is bounded choreography, mobile simplification, reduced-motion alternatives and evidence separated from claims. Existing MandateOS screenshots established the incumbent visual baseline.

## Seven effects

| Effect            | Implementation and truth boundary                                                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shutter reveal    | Two non-interactive masks open the heading/graph in 420 ms on entry. Controls remain accessible.                                                                                                                            |
| Scroll reveal     | One IntersectionObserver per secondary block; 380 ms reveal, then disconnect. No scroll control.                                                                                                                            |
| 2.5D assembly     | 350 ms layer arrivals, capped 120 ms depth delay and 420 ms camera shift. Mobile removes camera rotation.                                                                                                                   |
| Capital pulse     | SVG marker follows the exact graph connector; revoke reverses its route. It requires an actual confirmed signature and account transition.                                                                                  |
| Delegation split  | New confirmed node reveals in 350 ms; existing nodes use FLIP to retain continuity after layout changes.                                                                                                                    |
| Recall reverse    | Revoked target returns its authority toward its parent; descendant emphasis follows relative depth. Sequence ends within 900 ms. Stored historical descendant balances are not counted twice.                               |
| Transaction morph | Wallet signing, broadcast/network pending, confirmed or error phases originate in the real client. Confirmed/failed signatures link to Devnet explorer. Generic connection errors are not presented as on-chain rejections. |

Balances update after network confirmation. A confirmation followed by a failed refresh stays confirmed; the refresh failure is reported separately. Reduced motion removes masks, depth movement and pulses while preserving final states and links.

## Refinement and verification boundary

The separate anti-slop pass removed duplicate diagram explanation, repeated inspector instructions, obsolete dash-flow styles and unsupported live-proof badges. The mechanical detector returned no findings. Desktop and mobile browser QA checks are recorded below after execution.

Successful/failed Devnet transactions and transaction-linked effects cannot be verified with an absent program and incompatible IDL. The prior localnet evidence in VERIFICATION.md belongs to the previous checkpoint; it is not Devnet evidence for this pass. No fake wallet, balances, signature or network confirmation was introduced to fill this gap.

### Executed browser and build checks

- Production static export loaded at the existing `http://127.0.0.1:3000`. At 1440×900 the complete explanatory tree, inspector and recent activity are visible; activity starts at approximately y=810. Document width is 1430: no horizontal overflow.
- At 390×844 the document width is 380, with the hierarchy contained in its own scrollable area. Desktop and mobile proof images are saved in `docs/images/devnet-motion-desktop.png` and `docs/images/devnet-motion-mobile.png`.
- Wallet chooser works. Neither Phantom nor Solflare is injected in this browser. Attempting Phantom reports the actual installation error and lifecycle Error; it does not create a signature or report a protocol rejection. Successful wallet signing cannot be tested in this environment.
- Organizations and explanation controls were inspected. Creation and Arena execution remain disabled. Missing-program feedback resolves from the actual Devnet lookup. No browser console errors were observed in the production view.
- Root TypeScript check, frontend TypeScript check, ESLint, production build, Rust formatting and `cargo check --locked` passed. The final production build includes the fix that preserves Confirmed presentation during account refresh.
- `cargo test --locked --lib`: 16 passed. `npm run test:local`: Anchor build succeeded and all eight Windows validator batches passed, totaling 48 Core + 16 Arena integration tests. The canonical revoke → descendant rejection → reclaim flow passed on the real local validator. Total: 80 tests passed; this proves the preserved repository Core, not the absent requested Devnet deployment.
- Reduced-motion handling was checked in source and generated styles. Browser preference emulation and transaction-linked intermediate frames were not exercised. These remain unverified rather than simulated.
