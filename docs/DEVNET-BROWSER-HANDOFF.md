# Browser release gate and exact continuation

Public app: https://mandateos-v2.vercel.app/app. Command and Arena default to Devnet. The existing canonical organization is read-only for C7j… and its 19 receipts remain intact. No new Solana deployment is required.

## Current external gate

The owner must approve actions in Chrome with Phantom/Solflare. Automation sees only the Codex browser without those extensions. Do not export any browser wallet. At the latest owner scan (2026-10-06 16:28:29 UTC, confirmed slot 508153215), C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo owned zero organizations and held 7.589915066 SOL. No real browser transaction has been verified.

The owner has **200 actual test TOKENS**, decimals 6, of classic SPL mint **6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9**, not USDC. Their source/destination ATA is **E4r1AVcekpNfUwPT9f2z8s25dgMiVgFzDkMotxXzguGP**. Provisioning used the existing mint authority 3ws8… outside the MandateOS vault; it is a CLI setup transaction, not a browser receipt or mandate-enforced spend.

[Provisioning receipt](https://explorer.solana.com/tx/38kmERsdZm7rJW8sGYoDMkj2cbTMLz429ZyDYo5eaMzUzX6BXW7ryHieKRmvFPovs9mhLLJ2w7jGDNTinY46LBKW?cluster=devnet): finalized slot 508153696, err null, fee 5000 lamports; ATA balance 200000000 base units.

## Fresh UI fixture — pending, not completed

Keep one browser tab. In DEVNET, connect C7j…, expand Network and account evidence → Create organization, enter the mint above. First reject the wallet approval to verify the real refusal message; then request creation once and approve. RPC rent/fee quote at slot 508152845 was 4445000 rent + 5000 fee = **0.004450000 SOL**; actual approval/receipt remains authoritative. Save the new Organization PDA and the genuine signature.

For this single-wallet integration fixture, use C7j… as every controller and verifier. This tests UI signing/lineage, not separation of autonomous agent identities. The existing canonical CLI fixture already has distinct controllers. On-chain mandates have no name field: identify Research as Root child 0 at D1, Operations as Root child 1 at D1, Data as Research child 0 at D2, and Scraper as Data child 0 at D3.

| UI action                                      |     Amount | Expected fresh state after confirmation (must be checked)                                                 |
| ---------------------------------------------- | ---------: | --------------------------------------------------------------------------------------------------------- |
| Root deposit, source blank uses owner ATA      | 200 TOKENS | Vault/Root available 200; source 0                                                                        |
| Root delegate Research → C7j…                  |         80 | Root own available 120                                                                                    |
| Root delegate Operations → C7j…                |         20 | Root own available 100                                                                                    |
| Research delegate Data → C7j…                  |         40 | Research own available 40                                                                                 |
| Data delegate Scraper → C7j…                   |         10 | Data own available 30                                                                                     |
| Scraper spend → owner ATA above                |          2 | Vault 198; Scraper remaining 8                                                                            |
| Revoke Research, review and approve            |          — | Research revoked; Data/Scraper effectively blocked; Root own available 178                                |
| Attempt Scraper spend → same ATA               |          1 | Normal preflight should reject with AncestorRevoked/6003; no confirmed failed signature should be claimed |
| Operations spend → same ATA                    |          1 | Operations available 19; vault 197                                                                        |
| Root reclaim, destination blank uses owner ATA |        150 | Root available 28; vault 47; source 153                                                                   |
| Arena create bounty; verifier C7j…             |          5 | Root available 23; vault stays 47                                                                         |
| Submit one result commitment as C7j…           |          — | Exactly one Submission PDA/count 1                                                                        |
| Select that submitted winner; settle as C7j…   |          5 | Bounty settled; vault 42; source 158                                                                      |

The table is an **unexecuted expected accounting plan**, not evidence. There is no separate verifier-result transaction, quality proof or bounty cancellation instruction. Commitments are not proof of useful autonomous work.

After every approval, save the actual signature and finalized receipt (meta.err, fee, program logs, pre/post token balances), re-read program accounts and compare state. On unknown submission, use read-only reconciliation of the saved signature and blockhash horizon. Do not create another signature or another tab to retry; changing intent names does not provide on-chain idempotency. Ordinary sends keep preflight enabled.

## Safe commands

```powershell
# No signer/key access:
npm run verify:devnet:read
node scripts/verify-devnet-browser.mjs https://mandateos-v2.vercel.app

# Local public product:
npm --prefix web run build
$env:PORT="3101"
node scripts/web-preview.mjs
```

Do not rerun old Core/Arena write commands to reproduce browser verification. Do not redeploy Solana or change the ID/authority. On owner approval, read the new Organization and its signatures first, then continue this exact fresh fixture. Test-token preparation has already finalized; do not mint it again.
