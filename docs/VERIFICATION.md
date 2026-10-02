# Submission verification — 2026-10-02

## Executed checks

Native Windows laptop: Node 24.14.0, npm 11.9.0, Rust 1.89.0 GNU, Anchor 0.32.1, Agave 2.3.0 and SBF tools v1.52.

- Original main / Core release were checked and preserved. No Core instruction or account layout changed during the presentation pass.
- Rust fmt, Cargo check, strict Clippy with `-D warnings`: passed again.
- Rust unit tests: **16 passed** again.
- Root TypeScript checks and actual Anchor SBF build / generated-IDL synchronization: passed again.
- `npm run test:local`: **64 real validator tests passed** again, eight fresh Windows banks of eight tests. Core contributes 48, Arena 16. Combined total: **80 passing tests**.
- Frontend TypeScript, zero-warning ESLint and optimized Next.js static export: passed for the final source.
- Vercel install, Next.js production compilation, TypeScript, static generation and deployment: passed. Provider inspection returned target `preview`, status **Ready**.

The repeated validator suite used ignored workspace `.localnet/run-1790944066135/workspace`, public program `GGB4W9vSRY9nDVKsPdEzu3FFPjaef8iQ5QrrnT7C13VL`. The browser demo used the actual root build's generated program address `Fg6PaFpoGXkYsidMpWxTWqkZ5gnk9j8GaZ9epbEYwPqG`. These are local validator deployments, not devnet addresses.

Arena negatives include incorrect creator/verifier, non-submitter winner, duplicate submission/settlement, post-settlement submission, wrong or redirected token destination, child/bounty reservation protection and atomic CPI rollback. All existing full-lineage Core tests remain intact.

## Real browser flow

The production static export was exercised using visible controls and the generated disposable owner file. No application state, RPC response, signature or account balance was injected.

| Action              | Confirmed result                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Demo setup          | Mint/organization created; 1,000 deposited; Research 400 → Data 150 → Scraper 50; Search 100 alongside Data; Scraper spends 10 |
| Research revocation | Root available 600 → 990; Research revoked; Data/Search/Scraper derived blocked                                                |
| Descendant payment  | Broadcast transaction recorded as failed: custom 6003 / `AncestorRevoked`; no token payment                                    |
| Arena funding       | 25 reserved from Root in the existing shared vault                                                                             |
| Agent commitments   | Independent Research and Search signatures; two 32-byte result commitments                                                     |
| Verifier settlement | Research token account receives exactly 25; bounty becomes Settled; settlement event links to actual transaction               |
| Root reclaim        | 965 returned to the owner; total spent 35; vault and Root available/remaining become zero                                      |

A separate inspector delegation was also executed in the earlier browser run: 10 moved from Root's available authority to a new child. Revoking that test child returned the 10 before reclaim. This verified the ordinary action path as well as the setup utility. The canonical flow above was then repeated on the final static export; its reclaim confirmed at slot 97, and its public accounts and transactions are the saved proof below.

`node scripts/verify-demo.mjs` completed with exit 0 after the combined flow. It independently decoded public accounts and checked winner/owner/vault balances, accounting, valid submissions and the failed transaction's Anchor logs. [Saved public proof](demo-proof.json) contains only public addresses, amounts and transaction signatures. Local ledger evidence is ephemeral; custom-RPC explorer links require the corresponding validator.

![Actual Cascade and rejected descendant payment](images/capital-cascade.png)
![Actual Arena settlement and winner payout](images/arena-settlement.png)

## Presentation verification

The first visual inspection found excess vertical space, repeated inspector balances and an activity feed that pushed the important controls down. The refinement uses aligned depth columns and precise connectors, a distinct Treasury surface, contextual capital values, compact actions and expandable account/history details. The empty state uses the same branching explanation and explicitly labels it illustrative; it shows no made-up balances.

Confirmed balance changes animate using integer interpolation. Delegation/revocation connector motion and Arena reward motion begin after a confirmed transaction and an observed account change. Polling pauses during submission so it cannot consume a transition before its animation. Motion expires rather than replaying when a panel reopens; reduced-motion preferences are respected. Revocation evidence is retained per mandate so a later unrelated revocation cannot change the Research callout.

The anti-pattern scan identified two thick Root accent borders. Both were removed; the Treasury's fill and complete border distinguish it. Obsolete styles and duplicate base rules were removed. IBM Plex Sans is bundled locally under its OFL license; no Google Fonts request is needed at runtime.

The second visual pass checked the actual funded hierarchy at 1440 × 900 and 1366 × 768, then the mobile layout at 390 × 844. The flagship viewport shows identity, treasury metrics, the complete canonical tree, selected-node actions, Cascade controls and recent activity together. At 1366 × 768 the complete tree and controls remain visible; activity starts near the lower edge. Mobile stacks the summary and inspector, with horizontal scrolling confined to the graph. The document itself has no horizontal overflow at these sizes. The final browser reported no warning or error console entries after settlement and reclaim.

![Final funded capital tree at the judging viewport](images/capital-tree.png)

## Vercel

[Ready preview](https://mandateos-v2-qdi2zz8ve-luzzwaixs-projects.vercel.app), deployment `dpl_8Zq2YmGaShEc7MYoWELo11jTsHvg`.

A first build compiled but failed because the server Next.js preset was paired with output `out`. The corrected static preset built and deployed successfully. Localnet is explicit and disposable signing is disabled in the hosted build. No remote browser or live public Solana deployment is claimed. See [deployment configuration and exact continuation](DEPLOYMENT.md).

## Limits

Phantom/Solflare adapters are implemented. No injected extension is installed in the controlled browser, so extension approval was not exercised. Real signing/confirmation was exercised with disposable local signing wallets.

Devnet remains undeployed: the configured CLI wallet file is absent and no existing funded devnet wallet was available. Native Windows snapshot archiving can fail with symlink error 1314 after slot 100; the completed first browser run reached reclaim at slot 104 before the later archive failure. Use a fresh run or WSL2 for continued recording. The test banks avoid the environment limitation.

`npm audit` reports 12 legacy client dependency advisories (5 high, 7 moderate); no forced downgrade or incompatible Anchor/Solana upgrade was applied. This is an unaudited hackathon MVP, without a production-security claim.
