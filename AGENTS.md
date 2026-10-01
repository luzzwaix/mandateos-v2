# MandateOS V2

The wedge is recursive capital authority. Core semantics must not be silently redesigned.

- One organization has one shared SPL Token vault. Agent allocations are accounting authority, not physical agent vaults.
- Delegation subtracts only the parent's `self_available`; it never reduces ancestor `subtree_remaining`.
- Spending reduces the target's available capital and every node's remaining capital on its complete path to Root.
- Revocation validates the parent's lineage, zeros the target, returns its remaining subtree to the parent's available capital, and never traverses descendants.
- Descendants of revoked mandates are unusable even though their stored status may remain Active.
- Reclaim accesses only Root's `self_available`.
- Every monetary operation uses checked arithmetic. Validate owner, discriminator, organization, depth, parent links, active status, exact path length, and final Root for dynamic accounts. Serialize writable ancestors explicitly.
- Support classic SPL Token only for this MVP. Never accept vault-to-itself transfers as spending or reclaim.
- Do not broaden into generic IAM, governance, Arena, frontend, or integrations without explicit instruction.
- Never commit keys, wallet JSON, credentials, secrets, `.env`, build output, or local ledgers. Local tests use isolated generated wallets and an ignored working copy.
- Before checkpointing: `cargo fmt --all -- --check`, `cargo check --locked`, `npm run typecheck`, `npm run test:local` when the Linux Solana toolchain is available. Never describe unexecuted validator tests as passing.
