# MandateOS V2 Core protocol

Don't give agents wallets. Give them mandates.

MandateOS gives an organization one treasury and recursively delegates bounded spending authority. Agents sign with their own controller keys but never receive the treasury key. All capital stays in one program-controlled token account until spending or reclaim.

## Accounts and PDAs

The program accepts classic SPL Token (`Tokenkeg...`), not Token-2022. The `token_2022` Rust feature is enabled because Anchor's token initialization macros reference it; every public instruction still requires `Program<Token>` and classic `Account<Mint>` / `Account<TokenAccount>`.

All PDA derivations use the current deployment's program ID:

| Account      | Seeds                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Organization | `b"organization"`, authority public key (32 bytes), organization ID (`u64`, 8-byte little endian)          |
| Vault        | `b"vault"`, organization public key                                                                        |
| Root         | `b"mandate"`, organization public key, `b"root"`                                                           |
| Child        | `b"mandate"`, organization public key, direct parent public key, child index (`u64`, 8-byte little endian) |

Organization stores its authority, mint, vault, Root, ID, maximum depth, funding/spending/reclaim counters, and PDA bumps. Its PDA is the vault's token authority and signs checked SPL Token transfers.

Mandate stores organization, parent, controller, depth, Active/Revoked status, initial budget, `self_available`, `subtree_remaining`, direct spending, next child index, its own child index, and bump. Root has depth zero, default public key as parent, and organization authority as controller. Maximum organization depth is configurable from 1 through 4 inclusive.

Child indexes start at zero and must match the parent's counter. Indexes are never reused; revocation never closes or reactivates a mandate. Root's initial budget accumulates deposits; a child's initial budget remains its original allocation.

## Accounting

`self_available` is capital this node may spend or delegate now. `subtree_remaining` is all unspent protocol capital within its effective active subtree, including capital reserved by descendants.

- Deposit increases organization funding and Root's initial budget, available capital, and subtree remaining.
- Delegation subtracts the allocation from the direct parent's available capital and creates an equally funded child. The parent's and all ancestors' subtree remaining stay unchanged.
- Spend subtracts from the node's available capital and subtree remaining, increases its direct spending, and subtracts from every ancestor's subtree remaining. Organization spending increases, and a checked SPL transfer sends tokens to the destination.
- Revoke zeros the target's available and subtree balances and marks it Revoked. Its previous subtree remaining is added to the parent's available capital. No ancestor subtree total changes.
- Reclaim subtracts from Root's available and subtree balances, increases organization reclaim, and transfers to an authority-owned token account. Active child reservations are inaccessible.

Every monetary addition/subtraction and child counter increment is checked. Zero amounts are rejected. Spending into the vault itself is rejected, because a self-transfer cannot count as capital leaving the treasury. Instructions and SPL CPIs execute atomically; a failed transfer rolls back both named accounts and explicitly serialized remaining accounts.

For protocol-tracked capital:

```text
Root.subtree_remaining = total_funded - total_spent - total_reclaimed
Root.self_available <= Root.subtree_remaining
vault.amount >= Root.subtree_remaining
```

The vault equality holds if all funding goes through `deposit`. SPL Token allows third parties to transfer tokens directly to the vault; those unsolicited tokens are untracked surplus and cannot be withdrawn through this MVP. For each effective active node, remaining capital equals its available balance plus its effective active direct children's remaining capital. Stored balances in an invalidated subtree are historical and must never be summed as live authority.

## Complete lineage validation

For Root → A → B → C, an action on C passes remaining accounts in the exact order `[B, A, Root]`. The path must contain exactly the node's depth in accounts. No omitted, substituted, reordered, duplicated, extra, or foreign accounts are accepted.

The shared validator checks the target's canonical PDA, organization, depth and active status. For every ancestor it checks program ownership before deserialization, the Mandate discriminator/type, organization, canonical PDA/bump, exact stored parent link, decreasing depth, active status, and uniqueness. The final account must be the organization's canonical Root, whose controller and null parent are verified. Spending also requires every ancestor to be writable.

Ancestors are deserialized into owned Mandate values. Spending checks each subtraction and calls `try_serialize` explicitly into the corresponding writable account, including its discriminator. It does not rely on Anchor to automatically persist dynamic accounts.

Delegate validates the parent's complete path. Spend validates the target's complete path. Revoke validates the direct parent's complete path and the target's PDA, organization, direct-parent link, and depth. Deposit/reclaim validate Root and reject unexpected remaining accounts.

## Branch revocation

Only the direct parent's controller or organization authority can revoke a target. Root cannot be revoked and double revoke fails. Organization authority cannot impersonate a child controller for ordinary delegation or spending.

Revocation reads the parent and its lineage, mutates only target and parent, and returns exactly the target's unused subtree authority to the parent. It requires O(depth) work with at most four levels; it does not enumerate children or visit descendants. Token capital stays in the shared vault.

Descendants retain their serialized status and historical balances, but future actions encounter the revoked ancestor in the mandatory complete path and fail on-chain. Even emergency authority cannot revoke a descendant whose parent path is already invalidated, preventing stale accounting from being released twice.

## Required scenario (six-decimal local demo mint)

All values below are whole token units; transactions use value × 1,000,000 base units.

| Step                  | Root available/remaining | Research available/remaining | Data available/remaining | Scraper available/remaining |
| --------------------- | ------------------------ | ---------------------------- | ------------------------ | --------------------------- |
| Deposit 1000          | 1000 / 1000              | —                            | —                        | —                           |
| Delegate Research 400 | 600 / 1000               | 400 / 400                    | —                        | —                           |
| Delegate Data 150     | 600 / 1000               | 250 / 400                    | 150 / 150                | —                           |
| Delegate Scraper 50   | 600 / 1000               | 250 / 400                    | 100 / 150                | 50 / 50                     |
| Scraper spends 10     | 600 / 990                | 250 / 390                    | 100 / 140                | 40 / 40                     |
| Revoke Research       | 990 / 990                | 0 / 0 (Revoked)              | historical 100 / 140     | historical 40 / 40          |
| Reclaim 990           | 0 / 0                    | revoked                      | unusable                 | unusable                    |

After revocation a Scraper spend of 1 fails with `AncestorRevoked`. The vault finishes at zero, recipient gains 10, and authority loses only the 10 actually spent.

## MVP trust assumptions and scope

The organization authority may reclaim unreserved Root capital and revoke any valid active branch. Controllers may spend their available allocation to any correct-mint token account outside the vault; there is no recipient policy or proof of useful work. Controllers pay rent for child mandates. Keys are not recovered or rotated by this MVP. The mint issuer retains any SPL mint/freeze powers it configured and can cause transfers to fail. The deployment upgrade authority, if retained, can change program behavior. No security audit or production readiness is claimed.

Six public instructions and six compact activity events are present. There is no backend, database, indexer, governance, policy DSL, production frontend, or Arena. The next phase may add `create_bounty`, `submit_result`, and `settle_bounty` around existing mandate spending; there are no speculative Arena accounts in Core.
