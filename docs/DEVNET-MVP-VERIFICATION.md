# Devnet MVP verification — 6 October 2026

Core and the contract's supported Arena sequence completed on the existing deployment. This supersedes [the partial Core stopping point](DEVNET-CORE-PARTIAL.md), which is preserved as history. Anonymous production access and real Devnet reads are now verified. A fresh owner-browser wallet-signing lifecycle remains the release gate; CLI receipts and mocks do not satisfy it.

The subsequent [7 October adversarial QA](FINAL-ADVERSARIAL-QA.md) preserves these receipts and contract semantics. Read-only reconciliation at 2026-10-06T18:21:38.981Z, finalized slot 508181631, verified all 19 receipts again. The local performance/clarity candidate has not been published and creates no new browser-signed Devnet evidence.

## Identity

RPC `https://api.devnet.solana.com`; genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. Read-only reconciliation at **2026-10-06 16:39:16 UTC**, finalized account slot **508155921**, verified all **19** lifecycle receipts and unchanged authority without reading a signer or sending transactions.

| Identity                      | Verified value                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Executable Program            | `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`                                           |
| ProgramData                   | `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2`                                           |
| Fee payer / upgrade authority | `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`                                           |
| Organization                  | `EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A`                                           |
| Shared vault                  | `6nDTB65MgSm2H3cikxLUoeYY8GdkC89vMbcjY5j84eUq`                                           |
| Classic SPL mint, decimals 6  | `6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9` — test TOKENS, **not USDC**               |
| ELF                           | 462,984 bytes; SHA256 `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35` |
| Payer balance at read         | 20,089,520 lamports                                                                      |

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

## Current product and release

Public [Command](https://mandateos-v2.vercel.app/app) and [Arena](https://mandateos-v2.vercel.app/arena) are anonymously reachable. The production deployment is READY: **mandateos-v2-2sapm55z0-luzzwaixs-projects.vercel.app**, frontend source checkpoint **7ce740a585774eb195ef8626876ae4a3db9f9000**. HTTP checks supplied no cookies or authorization: Story / Command / Arena all 200, no SSO redirect. Preview deployments retain SSO. Four Vercel variables are public Devnet configuration only; no signer or RPC secret is uploaded.

The initial production attempt returned direct-route 404s; static `cleanUrls` corrected the .html routing. A later QA race matched Command's historical "Bounty settled" before Arena navigation; the failed capture is preserved and the test now waits for the actual Arena route. Neither failure is counted as a pass.

UI now defaults Command/Arena to Devnet while retaining labeled Demo. Address typing does not initiate reads; changing organization clears previous capital values and obsolete reads cannot replace new state. Selected PDA and unresolved public signature/horizon survive same-tab reload. A lost create response preserves its PDA; reconciliation runs even when that account is absent. Repeated action clicks are locked synchronously, and a mismatched wallet message or RPC signature cannot manufacture confirmation. Every normal send retains preflight.

| Function                                   | Devnet UI                                  | Real receipts                                           | Demo / unsupported / external gate                                                               |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Program, mint, capital and lineage reads   | Verified anonymously on production         | Actual chain state and Explorer links                   | No wallet required                                                                               |
| Treasury initialization / deposit          | Actual client instructions wired           | Canonical CLI finalized                                 | Fresh owner UI approval pending                                                                  |
| Delegation / nested delegation / spend     | Actual signer/ancestor path wired          | Canonical CLI finalized                                 | Fresh browser signing unverified                                                                 |
| Revoke / descendant authority loss         | Actual state reads verified                | Canonical revoke + included failed spend 6003 finalized | New browser rejection remains unverified; ordinary preflight must not fabricate a failed receipt |
| Operations / reclaim                       | Actual client wired                        | Canonical CLI finalized                                 | Fresh browser signing unverified                                                                 |
| Arena reserve / commitment / atomic payout | Actual settled state visible on production | Canonical CLI finalized                                 | Fresh browser signing unverified                                                                 |
| Separate verifier-result / quality proof   | Not supported                              | No such instruction                                     | Trusted local selection precedes settlement                                                      |
| Demo                                       | Visibly separate                           | None                                                    | Simulated accounting only                                                                        |

**Real confirmed browser transactions: 0.** Tool inventory exposes only Codex's browser without the user's Phantom/Solflare. C7j… has not yet provided a create receipt; the latest scan found zero owned organizations. Owner approval is requested in Chrome; no key export is required.

Test-token provisioning has finalized: [38kmERsdZm7rJW8sGYoDMkj2cbTMLz429ZyDYo5eaMzUzX6BXW7ryHieKRmvFPovs9mhLLJ2w7jGDNTinY46LBKW](https://explorer.solana.com/tx/38kmERsdZm7rJW8sGYoDMkj2cbTMLz429ZyDYo5eaMzUzX6BXW7ryHieKRmvFPovs9mhLLJ2w7jGDNTinY46LBKW?cluster=devnet), slot 508153696, err null, fee 5000. Existing mint authority 3ws8… created C7j…'s ATA and minted 200 test TOKENS; this is CLI fixture preparation, not a browser transaction or mandate-controlled spend. Canonical vault/state stayed unchanged. Mint supply is now 1200 test tokens. No further SOL transfer is needed.

Dedicated local signer control was checked by its matching public key and the real provisioning signature. Its Windows ACL allows the local owner; no key contents were printed or copied. An encrypted/offline recovery backup is not independently verified.

## Current verification results

| Check                                      | Exact final result                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Rust fmt / locked check                    | Pass; supported Rust 1.89.0 Windows GNU                                                                         |
| Rust unit tests                            | 16 passed, 0 failed                                                                                             |
| SBF build / real local validator           | Build passed; 64 tests passed, 0 failed in eight batches (48 Core, 16 Arena)                                    |
| TypeScript unit suites                     | 54 passed, 0 failed: 15 UI, 25 client, 5 RPC, 7 evidence, 2 budget                                              |
| Root / frontend typecheck                  | Pass                                                                                                            |
| Frontend lint                              | Pass, zero warnings                                                                                             |
| Local and Vercel production builds         | Pass; static Story/Command/Arena exported                                                                       |
| Final public desktop browser               | 29 passed, 0 failed; actual reads + explicitly labeled adapter mocks and recovery replay, no signing/submission |
| Public mobile/reduced-motion account views | 13 passed, 0 failed; widths 390 and 768; no overflow/runtime errors; viewport emulation, not physical devices   |
| Frozen responsive demo / motion regression | 111 + 10 passed, 0 failed                                                                                       |
| Devnet receipt reconciliation              | All 19 canonical lifecycle receipts finalized; current program binary/authority match                           |
| Fixture preparation                        | One actual finalized CLI mint/ATA setup receipt, err null                                                       |
| Real extension-signing lifecycle           | Unverified, blocked on owner approval/access                                                                    |
| Secret scan / generated static-output scan | 175 tracked/new files and 49 static text files: no recognized secret findings                                   |
| git diff --check                           | Pass                                                                                                            |

Runtime dependency audit still reports 12 advisories (5 high, 7 moderate, 0 critical); forced incompatible SDK migrations were not applied. No Mainnet safety or independent security-review claim is made. No backend, x402, visual redesign or new Solana deployment was added.

**Verdict: not Devnet submission-ready under the requested definition**, because the complete fresh browser wallet-signing flow has not been observed. Public reads and CLI lifecycle completion are verified. The exact next sequence and expected—not claimed—accounting is in [browser handoff](DEVNET-BROWSER-HANDOFF.md).

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

Current continuation branch/start HEAD: **devnet-integration**, **3596fc3a5ee810f210d6a5224e1b4f06baf4324d**, initially clean. Prior work is preserved. Functional checkpoint: **7ce740a585774eb195ef8626876ae4a3db9f9000**. The final documentation checkpoint is reported by its actual hash. Push is authorized only to this branch; no merge/reset/rebase/force push.

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

## Earlier integration checkpoint file inventory

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
