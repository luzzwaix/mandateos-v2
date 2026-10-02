# MandateOS V2

The wedge is recursive capital authority. Core semantics must not be silently redesigned.

- One organization has one shared SPL Token vault. Agent allocations are accounting authority, not physical agent vaults.
- Delegation subtracts only the parent's `self_available`; it never reduces ancestor `subtree_remaining`.
- Spending reduces the target's available capital and every node's remaining capital on its complete path to Root.
- Revocation validates the parent's lineage, zeros the target, returns its remaining subtree to the parent's available capital, and never traverses descendants.
- Descendants of revoked mandates are unusable even though their stored status may remain Active.
- Reclaim accesses only Root's `self_available`.
- Arena reserves bounty rewards by reducing only Root's `self_available`; Root remaining includes Open rewards. Settlement records spending and pays a submitted winner atomically from the existing vault. Never consume child or bounty reservations through Core actions.
- Every monetary operation uses checked arithmetic. Validate owner, discriminator, organization, depth, parent links, active status, exact path length, and final Root for dynamic accounts. Serialize writable ancestors explicitly.
- Support classic SPL Token only for this MVP. Never accept vault-to-itself transfers as spending or reclaim.
- Do not broaden into generic IAM, governance, Arena, frontend, or integrations without explicit instruction.
- The submission sprint explicitly authorized Arena Lite and the direct-RPC frontend. Keep the six Core instructions and existing account layouts stable. Arena verification remains a trusted signer; no marketplace/reputation redesign.
- Frontend uses the generated IDL and complete canonical ancestor paths. Never fabricate signatures, confirmations or rejected transactions. LOCALNET disposable wallets remain in ignored files/tab memory; never embed signer material in the source or bundle.
- Never commit keys, wallet JSON, credentials, secrets, `.env`, build output, or local ledgers. Local tests use isolated generated wallets and an ignored working copy.
- Before checkpointing: `cargo fmt --all -- --check`, `cargo check --locked`, `npm run typecheck`, `npm run test:local` with the supported Windows or Linux toolchain. Never describe unexecuted validator tests as passing.
