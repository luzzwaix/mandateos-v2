# Devnet MVP verification — 6 October 2026

Core and the contract's supported Arena sequence completed on the existing deployment. This supersedes [the partial Core stopping point](DEVNET-CORE-PARTIAL.md), which is preserved as history. Browser extension signing and anonymous public access remain separate release gates.

## Identity

RPC `https://api.devnet.solana.com`; genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. Read-only reconciliation at **2026-10-06 15:36:51 UTC**, finalized account slot **508140233**, verified all **19** lifecycle receipts and unchanged authority without reading a signer or sending transactions.

| Identity                      | Verified value                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Executable Program            | `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`                                           |
| ProgramData                   | `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2`                                           |
| Fee payer / upgrade authority | `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`                                           |
| Organization                  | `EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A`                                           |
| Shared vault                  | `6nDTB65MgSm2H3cikxLUoeYY8GdkC89vMbcjY5j84eUq`                                           |
| Classic SPL mint, decimals 6  | `6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9` — test TOKENS, **not USDC**               |
| ELF                           | 462,984 bytes; SHA256 `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35` |
| Payer balance at read         | 21,582,960 lamports                                                                      |

No new Solana deployment, Rust edit, IDL replacement, key generation or authority transfer occurred. App ABI is the bundled source-generated IDL; no on-chain IDL publication is needed. [Original deployment/hash evidence](DEVNET-SEQUENTIAL-RESUME.md) remains applicable.

[Public proof](devnet-mvp-proof.json) contains actual finalized signatures, slots, `meta.err`, fees, logs, pre/post balances and post-action account snapshots. It contains no signer secrets or private file paths. The complete receipt table follows this report.

## Core results

Existing treasury initialization, 1000-token funding, Root → Research, Root → Operations, Research → Data → Scraper, valid Scraper spend 10 and Research revoke were retained and reconciled. Three new Core actions then finalized:

1. **Included failed Scraper spend**, slot **508121984**: exact `InstructionError [0, Custom 6003]`, `AncestorRevoked / 0x1773`. Original authority `DAKmyXzMzoJX4FUVSjyCXFEk8QCQvUMxYXVaompPdvJg`; sponsored fee payer 3ws8…. Actual fee **10000 lamports**; payer debit verified, token and mandate state unchanged.
2. **Operations spend 5**, slot **508122111**, err null, fee **10000**. Original authority `DmjWy6cC2EpYKbWCMuDfLxBMEEjk2DA6andimY5iAeyD`; sponsored payer 3ws8…. Vault **990 → 985**, Operations available **100 → 95**, destination **10 → 15**.
3. **Root reclaim 890**, slot **508122191**, err null, fee **5000**. Vault **985 → 95**, owner source **0 → 890**, Root available **890 → 0**. Operations' remaining 95 stayed reserved.

Each new action had one signing intent and one forwarding attempt. Signed-wire simulation, signature, expiry, receipt and logs were saved before assertions; finalized account/token reads followed each action. Earlier unsigned simulations and the lost historical rejection are not relabeled as the included failure.

**Explicit preflight exception:** the user requested an included failed descendant transaction. The exact signed packet was first simulated with signature verification and returned 6003; only that diagnostic submission skipped preflight so it could be included and charged. Ordinary CLI actions and every frontend send retain preflight. Evidence records the exception and its reason.

## Arena results and contract boundary

Six additional finalized transactions completed Arena: deposit **30** reclaimed test tokens (vault 95 → 125); reserve reward **25** (Root available 30 → 5, vault unchanged); fund the existing agents' two Submission account rents; submit Research and Data commitments (count 0 → 1 → 2); verifier-select Data and atomically settle **25** (vault 125 → 100, winner ATA 0 → 25). Bounty **3UEKqDwbRviwJk3vHFtUUpQaVkcQvpH8VuN8Dc9wpqxg** is settled with winner **92XK32H2YbZwAZuhQgoVxy13okRGKnujXkgEycdmL4tt**. No additional user SOL transfer or token minting was needed.

The three Arena instructions are create bounty, submit result and settle bounty. There is **no separate on-chain verifier-result or quality-proof instruction**. Trusted verifier selection is local until atomic settlement records the submitted winner and payout. Test commitments are deterministic integration inputs, not autonomous-work evidence. Submission eligibility does not validate Core lineage; Core-blocked agents can submit to Arena. Open bounties have no cancellation instruction.

## Final state

| Node       | PDA                                            | Stored / effective | Own available | Remaining |
| ---------- | ---------------------------------------------- | ------------------ | ------------: | --------: |
| Root       | `8NwP1XmiQbb7gKEQLuyLSNC9Q6FVuF4NgwbfdBVKE2DQ` | active / active    |             5 |       100 |
| Research   | `DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7` | revoked / revoked  |             0 |         0 |
| Data       | `47KcPwqLcFwJBTewVrfBesKE6NVuT4PKr1zRZ921Ktad` | active / blocked   |           100 |       140 |
| Scraper    | `H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB` | active / blocked   |            40 |        40 |
| Operations | `HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21` | active / active    |            95 |        95 |

Amounts are six-decimal test tokens. Descendant stored balances are unusable and must not be summed as active capital. **1030 cumulative funded − 40 spent − 890 reclaimed = 100 vault**. The 30-token redeposit reused reclaimed tokens. Root 5 + Operations 95 accounts for all active capital. Owner source has **860**, Core destination **15**, Arena payout **25**. Lifecycle fees: original **55000** + continuation **65000** = **120000 lamports**, separate from account rent deposits.

## Product and release

Existing static frontend talks directly to RPC and injected wallets. No database/backend is required for these account reads and signatures. Layouts, routes, Story styling and contract semantics stay frozen. Integration changes pace HTTP, honor Retry-After, cache only finalized receipts, stop overlapping polls, preserve partial verified history, and retain signed transaction identity before RPC. Unknown outcomes block further signing until history/receipt/finalized-expiry reconciliation. Public pending metadata survives same-tab reload; no key or signed wire is stored in browser storage. Existing organization/create controls are now reachable after loading the canonical organization.

The canonical organization authority is 3ws8…. Connecting C7j… does not authorize spending its treasury. User reported C7j… connected in DEVNET in their Chrome; this is **manual testimony**, not automated extension-signing verification. Decline/approve creation of a C7j-owned organization and its actual receipt are still pending. Program upgrade authority remains 3ws8….

Updated preview [mandateos-v2-f984ud67a-luzzwaixs-projects.vercel.app](https://mandateos-v2-f984ud67a-luzzwaixs-projects.vercel.app) built successfully with the final RPC/reconnect fixes. Anonymous `/app` read at **15:41:33 UTC** returned **302 → vercel.com/sso-api**. This is not an anonymously accessible judge URL. The optional authenticated CLI curl check exited 1 and is not claimed as a successful hosted browser check. Production publication/protection change awaits the answer to the existing approval request. A configured production domain alone does not establish which build it serves.

Upgrade authority's independently computed local public key matches 3ws8…. Its external private directory has a protected Windows ACL granting only the current user FullControl. Local custody is verified; **offline/encrypted recovery backup is not verified**. No key was exported or authority transferred.

Runtime `npm audit --omit=dev`: **12 flags (5 high, 7 moderate, 0 critical)** in pinned transitive Anchor/Solana packages. Browser bigint-buffer uses pure JS and web3's browser path uses UUID v4; these observations do not resolve advisories or establish production security. Forced dependency downgrades/SDK replacement were not applied.

## Verification

| Check                                         | Observed result                                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Rust fmt / locked check                       | Passed                                                                                                            |
| Rust unit tests                               | **16 passed, 0 failed**                                                                                           |
| Source SBF/Anchor build + isolated validators | Build passed; **64 passed, 0 failed** (48 Core + 16 Arena)                                                        |
| Client/RPC/evidence/budget/UI unit cases      | **51 passed, 0 failed**; clearly labeled stubs                                                                    |
| Root/frontend typecheck                       | Passed                                                                                                            |
| Frontend lint / static production build       | Passed; zero lint warnings                                                                                        |
| Responsive/reduced-motion suite               | **111 assertions passed**, 0 failures after the integration fixes                                                 |
| Real read-only browser + adapter mocks        | Final **12 real-read + 7 mock checks passed**, 0 failures; earlier 429/reconnect failures retained as diagnostics |
| Real extension signature/approval lifecycle   | User connection reported; signed receipt pending                                                                  |
| Anonymous frontend                            | SSO redirect observed; public production not yet authorized                                                       |
| Secret scan / diff check                      | Passed: 171 release files scanned, no findings; diff check passed                                                 |

Earlier browser failures are preserved with raw 429 bodies and page state, not counted as passing. They concerned current receipt reads and a wallet Connecting state that waited for history, not the prior program deployment. Both paths were fixed; the final browser run at **15:38:17 UTC** passed 19 checks with zero runtime errors and zero observed raw RPC errors. C7j's confirmed balance was **7,589,915,066 lamports**, slot **508139247**, and no C7j-owned organization existed at **15:32:55 UTC**. These observations do not establish a browser-signed transaction. Mainnet, x402, another Solana deployment, visual redesign, backend, Git push/merge and submission-video recording were not performed.

## Commands and handoff

From this checkout, preserving any existing local environment:

```powershell
npm ci
npm --prefix web ci
if (!(Test-Path web/.env.local)) { Copy-Item web/.env.example web/.env.local }
npm --prefix web run build
$env:PORT="3101"
node scripts/web-preview.mjs
```

Open `http://127.0.0.1:3101/app` → DEVNET. Public reads need no wallet; actions require the actual controller. Do not import CLI authority keys into the browser. DEMO stays separately labeled.

`npm run verify:devnet:read` checks public proof signatures/current state without signer access. `node scripts/verify-devnet-browser.mjs http://127.0.0.1:3101` checks real reads and labeled adapter mocks, without signing. Set `PLAYWRIGHT_MODULE` to an installed module when needed. Do not rerun `verify:devnet` to create a fresh canonical flow or redeploy. Existing resume commands reconcile their durable journal first.

Branch/start HEAD: **devnet-integration**, **f5b7965dbac9f4b634bfb5eccc6b146046218f68**. All previous dirty work remains preserved. Any final checkpoint is reported by its actual hash.

## All reconciled lifecycle receipts

| Step                                                        | Devnet Explorer signature                                                                                                                                                                                                          | Slot      | Fee lamports | meta.err                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------ | ---------------------------------------- |
| blocked-descendant                                          | [2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv](https://explorer.solana.com/tx/2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv?cluster=devnet) | 508121984 | 10000        | {"InstructionError":[0,{"Custom":6003}]} |
| operations-spend                                            | [4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ](https://explorer.solana.com/tx/4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ?cluster=devnet) | 508122111 | 10000        | null                                     |
| root-reclaim                                                | [47NXub9AtFFmiLaSGKbK18ALwjgHWsKQgLVCiT2UeYurkuxQTuBvtGWq18UHNAGu1nFAJcbjRUzQ4BXej2aVdzHX](https://explorer.solana.com/tx/47NXub9AtFFmiLaSGKbK18ALwjgHWsKQgLVCiT2UeYurkuxQTuBvtGWq18UHNAGu1nFAJcbjRUzQ4BXej2aVdzHX?cluster=devnet) | 508122191 | 5000         | null                                     |
| arena-deposit                                               | [2XzmhEtwocCsaYFmcpCdEA5MqVLPxdcsLUfnf4dLDGV2apz7dq4L2fyRfPcVQ2C7UqJPADMm9SnjkRnvzRqd8J8s](https://explorer.solana.com/tx/2XzmhEtwocCsaYFmcpCdEA5MqVLPxdcsLUfnf4dLDGV2apz7dq4L2fyRfPcVQ2C7UqJPADMm9SnjkRnvzRqd8J8s?cluster=devnet) | 508122514 | 5000         | null                                     |
| arena-create-bounty                                         | [49tb5NYiTr64yMLTrpUVHv5TAF1gzQ5WC6VJyygzsAYBBQZmQzf1aicT22L7DZ5YHspy2fHxhsKUKNiibE4wmeie](https://explorer.solana.com/tx/49tb5NYiTr64yMLTrpUVHv5TAF1gzQ5WC6VJyygzsAYBBQZmQzf1aicT22L7DZ5YHspy2fHxhsKUKNiibE4wmeie?cluster=devnet) | 508122594 | 5000         | null                                     |
| arena-fund-submission-rents                                 | [SuHoY2yk1NNJBUPWYBXq2gpY5azaahDJNMogFjekbiU1VV1DCYvBgQxCrNwdtarahBmhM7s9LYUEdhgCiJR5GZh](https://explorer.solana.com/tx/SuHoY2yk1NNJBUPWYBXq2gpY5azaahDJNMogFjekbiU1VV1DCYvBgQxCrNwdtarahBmhM7s9LYUEdhgCiJR5GZh?cluster=devnet)   | 508122690 | 5000         | null                                     |
| arena-submit-research                                       | [4hXiS4EvKuNYQEQmVxUTjjp5sGvNsP193y5UHocTYprzwje1otLrcTwBLWYhUXgrABvcaBr2uPg7NmswFRAXGaoV](https://explorer.solana.com/tx/4hXiS4EvKuNYQEQmVxUTjjp5sGvNsP193y5UHocTYprzwje1otLrcTwBLWYhUXgrABvcaBr2uPg7NmswFRAXGaoV?cluster=devnet) | 508122775 | 10000        | null                                     |
| arena-submit-data                                           | [SQ5rK8VB42hRHbLhuHZgrsJSv2aaTibfN1YqeCaVEeSQMAb9Gvbq28h1eyAs5uZXPyMvXo4EUyRxTg6BAzzZD4t](https://explorer.solana.com/tx/SQ5rK8VB42hRHbLhuHZgrsJSv2aaTibfN1YqeCaVEeSQMAb9Gvbq28h1eyAs5uZXPyMvXo4EUyRxTg6BAzzZD4t?cluster=devnet)   | 508122861 | 10000        | null                                     |
| arena-settlement                                            | [2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1](https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet) | 508122947 | 5000         | null                                     |
| initial-fund controller rent/fees                           | [56L9TYD1d8xDc3kEn3TR5P1eSND5jXb74YyeKrJJMNiEDJXSkyWWiS5AGQv3WYbUib2XUAx7gwMaq1xpJhZzRPmo](https://explorer.solana.com/tx/56L9TYD1d8xDc3kEn3TR5P1eSND5jXb74YyeKrJJMNiEDJXSkyWWiS5AGQv3WYbUib2XUAx7gwMaq1xpJhZzRPmo?cluster=devnet) | 508108051 | 5000         | null                                     |
| initial-create classic SPL six-decimal test mint (not USDC) | [4VkkhQqJq5KLgeezNB6KdLEWcjXgzWqLJcYrxCqkJ2sx1y2y5VQzTdEPC2TpBJ5tXosbxFhEAAhxnomLqa8fCQqy](https://explorer.solana.com/tx/4VkkhQqJq5KLgeezNB6KdLEWcjXgzWqLJcYrxCqkJ2sx1y2y5VQzTdEPC2TpBJ5tXosbxFhEAAhxnomLqa8fCQqy?cluster=devnet) | 508108094 | 10000        | null                                     |
| initial-initialize treasury                                 | [5LZg4ENJes38qwiz2fF8hUtBmkTh7eekYnPZa7JKnoto18qZ26bXSzyUuLieAW8uwAFvEdbNKbWyYWGZX5i85KkL](https://explorer.solana.com/tx/5LZg4ENJes38qwiz2fF8hUtBmkTh7eekYnPZa7JKnoto18qZ26bXSzyUuLieAW8uwAFvEdbNKbWyYWGZX5i85KkL?cluster=devnet) | 508108103 | 5000         | null                                     |
| initial-deposit 1000 test tokens                            | [46tqW2F7SwfKxYdU1pP6sBPrRnjbFw4viQ8dQfEnivbhqdZEuz2x6NkmFgxz3fs5b9GJrVG2LqaKoovqz4PtCML6](https://explorer.solana.com/tx/46tqW2F7SwfKxYdU1pP6sBPrRnjbFw4viQ8dQfEnivbhqdZEuz2x6NkmFgxz3fs5b9GJrVG2LqaKoovqz4PtCML6?cluster=devnet) | 508108124 | 5000         | null                                     |
| initial-Root to Research                                    | [3DQWULvDUGGc8HiswX7NBCAtvQ69J9Dk9NuDrhaNK184KJZuhC4fnj2D3z4ZwD26Bxr7gmJKuy2g1BrirKDve7MB](https://explorer.solana.com/tx/3DQWULvDUGGc8HiswX7NBCAtvQ69J9Dk9NuDrhaNK184KJZuhC4fnj2D3z4ZwD26Bxr7gmJKuy2g1BrirKDve7MB?cluster=devnet) | 508108157 | 5000         | null                                     |
| initial-Root to Operations sibling                          | [3DgTYnXpy9bwHb7RqsvjTPYsezUVoJr3XfCUNnCvDiGrVnkyGGgrPXAX8KHL1PytTeyPG6H9nEkuwnThnUJTSorK](https://explorer.solana.com/tx/3DgTYnXpy9bwHb7RqsvjTPYsezUVoJr3XfCUNnCvDiGrVnkyGGgrPXAX8KHL1PytTeyPG6H9nEkuwnThnUJTSorK?cluster=devnet) | 508108181 | 5000         | null                                     |
| initial-Research to Data                                    | [5LfcNHWvCy3Md9i1x1phHUShnvGwiSWS6UZpb8CsRuNEYvGzVde2CxN6jxRTVM7ZebMuzA7SMdQTJV5fyw17i8yD](https://explorer.solana.com/tx/5LfcNHWvCy3Md9i1x1phHUShnvGwiSWS6UZpb8CsRuNEYvGzVde2CxN6jxRTVM7ZebMuzA7SMdQTJV5fyw17i8yD?cluster=devnet) | 508108220 | 5000         | null                                     |
| initial-Data to Scraper                                     | [41uFWLmheGWSv4Smmq9zGaaDdEn3azYExs873fB8EgGxUDunmqVPuR12oWG6Nwjtn5ypbPMQ5p6SD6smpAWdar4p](https://explorer.solana.com/tx/41uFWLmheGWSv4Smmq9zGaaDdEn3azYExs873fB8EgGxUDunmqVPuR12oWG6Nwjtn5ypbPMQ5p6SD6smpAWdar4p?cluster=devnet) | 508108234 | 5000         | null                                     |
| initial-valid Scraper spend 10                              | [4p7r8sJPJj1uFZK4SNhqacUku6fi2VryWYPPAjUtr3i6WRaKrEnsatVYJrBGvutDWLKKXmVeSxBNKMjmpC94fKmo](https://explorer.solana.com/tx/4p7r8sJPJj1uFZK4SNhqacUku6fi2VryWYPPAjUtr3i6WRaKrEnsatVYJrBGvutDWLKKXmVeSxBNKMjmpC94fKmo?cluster=devnet) | 508108263 | 5000         | null                                     |
| initial-revoke Research                                     | [5R6mNLVuNhivLsiJRpqRYhYQSJkodhQwzTFrTJqayg6Ywik1oCyhaQwaHWtVchurRqY6qaxrpgdSjZHjWS4Lg7nS](https://explorer.solana.com/tx/5R6mNLVuNhivLsiJRpqRYhYQSJkodhQwzTFrTJqayg6Ywik1oCyhaQwaHWtVchurRqY6qaxrpgdSjZHjWS4Lg7nS?cluster=devnet) | 508108297 | 5000         | null                                     |

## Checkpoint file inventory

This includes preserved prior deployment/buffer work and the current continuation. Ignored artifacts, .env.local, build output and private material are excluded.

- README.md
- docs/DEVNET-BUFFER-DIAGNOSTICS.md
- docs/DEVNET-BUFFER-RESUME.md
- docs/DEVNET-CORE-PARTIAL.md
- docs/DEVNET-DEPLOY-ATTEMPT.md
- docs/DEVNET-MVP-VERIFICATION.md
- docs/DEVNET-PREFLIGHT.md
- docs/DEVNET-RELEASE.md
- docs/DEVNET-SEQUENTIAL-RESUME.md
- docs/DEVNET-SEQUENTIAL-UPLOAD.md
- docs/README-LOCALNET-HISTORY.md
- docs/devnet-mvp-proof.json
- docs/images/devnet-arena.png
- docs/images/devnet-command.png
- package.json
- scripts/diagnose-devnet-buffer.mjs
- scripts/verify-devnet-browser.mjs
- tests/devnet-budget-check.ts
- tests/devnet-budget.ts
- tests/devnet-client.ts
- tests/devnet-evidence-check.ts
- tests/devnet-evidence.ts
- tests/devnet-flow.ts
- tests/devnet-resume.ts
- tests/devnet-rpc-check.ts
- web/.env.example
- web/.gitignore
- web/src/components/arena-world.tsx
- web/src/components/command-world.tsx
- web/src/lib/solana/client.ts
- web/src/lib/solana/program.ts
- web/src/lib/solana/rpc.ts
- web/src/lib/solana/types.ts
- web/src/lib/use-console.ts
