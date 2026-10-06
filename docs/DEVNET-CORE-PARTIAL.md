> Current result: Core and supported Arena settlement are finalized. See [Devnet MVP verification](DEVNET-MVP-VERIFICATION.md) and its real receipts. Browser signing/public-access gates are tracked there. The following text preserves the earlier phase; incomplete-Core statements below are historical.

# Devnet Core — confirmed through revoke, stopped before completion

Observed 6 October 2026. Endpoint **https://api.devnet.solana.com**, verified genesis **EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG**. Actual program: **125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd**. [Deployment/hash report](DEVNET-SEQUENTIAL-RESUME.md). Dedicated script wallets were used; browser wallet approval was not tested and C7j… was not used to sign. Preflight remained enabled. No production/mainnet assets.

## Observed transactions

All ten below were confirmed and independently rechecked **finalized**, err null. These are actual returned signatures, not simulations. Total charged Core fees **55000 lamports**. State was fetched after authority actions.

| Step                                                | Devnet Explorer signature                                                                                                                                                                                                          | Slot      | Fee lamports |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------ |
| fund controller rent/fees                           | [56L9TYD1d8xDc3kEn3TR5P1eSND5jXb74YyeKrJJMNiEDJXSkyWWiS5AGQv3WYbUib2XUAx7gwMaq1xpJhZzRPmo](https://explorer.solana.com/tx/56L9TYD1d8xDc3kEn3TR5P1eSND5jXb74YyeKrJJMNiEDJXSkyWWiS5AGQv3WYbUib2XUAx7gwMaq1xpJhZzRPmo?cluster=devnet) | 508108051 | 5000         |
| create classic SPL six-decimal test mint (not USDC) | [4VkkhQqJq5KLgeezNB6KdLEWcjXgzWqLJcYrxCqkJ2sx1y2y5VQzTdEPC2TpBJ5tXosbxFhEAAhxnomLqa8fCQqy](https://explorer.solana.com/tx/4VkkhQqJq5KLgeezNB6KdLEWcjXgzWqLJcYrxCqkJ2sx1y2y5VQzTdEPC2TpBJ5tXosbxFhEAAhxnomLqa8fCQqy?cluster=devnet) | 508108094 | 10000        |
| initialize treasury                                 | [5LZg4ENJes38qwiz2fF8hUtBmkTh7eekYnPZa7JKnoto18qZ26bXSzyUuLieAW8uwAFvEdbNKbWyYWGZX5i85KkL](https://explorer.solana.com/tx/5LZg4ENJes38qwiz2fF8hUtBmkTh7eekYnPZa7JKnoto18qZ26bXSzyUuLieAW8uwAFvEdbNKbWyYWGZX5i85KkL?cluster=devnet) | 508108103 | 5000         |
| deposit 1000 test tokens                            | [46tqW2F7SwfKxYdU1pP6sBPrRnjbFw4viQ8dQfEnivbhqdZEuz2x6NkmFgxz3fs5b9GJrVG2LqaKoovqz4PtCML6](https://explorer.solana.com/tx/46tqW2F7SwfKxYdU1pP6sBPrRnjbFw4viQ8dQfEnivbhqdZEuz2x6NkmFgxz3fs5b9GJrVG2LqaKoovqz4PtCML6?cluster=devnet) | 508108124 | 5000         |
| Root to Research                                    | [3DQWULvDUGGc8HiswX7NBCAtvQ69J9Dk9NuDrhaNK184KJZuhC4fnj2D3z4ZwD26Bxr7gmJKuy2g1BrirKDve7MB](https://explorer.solana.com/tx/3DQWULvDUGGc8HiswX7NBCAtvQ69J9Dk9NuDrhaNK184KJZuhC4fnj2D3z4ZwD26Bxr7gmJKuy2g1BrirKDve7MB?cluster=devnet) | 508108157 | 5000         |
| Root to Operations sibling                          | [3DgTYnXpy9bwHb7RqsvjTPYsezUVoJr3XfCUNnCvDiGrVnkyGGgrPXAX8KHL1PytTeyPG6H9nEkuwnThnUJTSorK](https://explorer.solana.com/tx/3DgTYnXpy9bwHb7RqsvjTPYsezUVoJr3XfCUNnCvDiGrVnkyGGgrPXAX8KHL1PytTeyPG6H9nEkuwnThnUJTSorK?cluster=devnet) | 508108181 | 5000         |
| Research to Data                                    | [5LfcNHWvCy3Md9i1x1phHUShnvGwiSWS6UZpb8CsRuNEYvGzVde2CxN6jxRTVM7ZebMuzA7SMdQTJV5fyw17i8yD](https://explorer.solana.com/tx/5LfcNHWvCy3Md9i1x1phHUShnvGwiSWS6UZpb8CsRuNEYvGzVde2CxN6jxRTVM7ZebMuzA7SMdQTJV5fyw17i8yD?cluster=devnet) | 508108220 | 5000         |
| Data to Scraper                                     | [41uFWLmheGWSv4Smmq9zGaaDdEn3azYExs873fB8EgGxUDunmqVPuR12oWG6Nwjtn5ypbPMQ5p6SD6smpAWdar4p](https://explorer.solana.com/tx/41uFWLmheGWSv4Smmq9zGaaDdEn3azYExs873fB8EgGxUDunmqVPuR12oWG6Nwjtn5ypbPMQ5p6SD6smpAWdar4p?cluster=devnet) | 508108234 | 5000         |
| valid Scraper spend 10                              | [4p7r8sJPJj1uFZK4SNhqacUku6fi2VryWYPPAjUtr3i6WRaKrEnsatVYJrBGvutDWLKKXmVeSxBNKMjmpC94fKmo](https://explorer.solana.com/tx/4p7r8sJPJj1uFZK4SNhqacUku6fi2VryWYPPAjUtr3i6WRaKrEnsatVYJrBGvutDWLKKXmVeSxBNKMjmpC94fKmo?cluster=devnet) | 508108263 | 5000         |
| revoke Research                                     | [5R6mNLVuNhivLsiJRpqRYhYQSJkodhQwzTFrTJqayg6Ywik1oCyhaQwaHWtVchurRqY6qaxrpgdSjZHjWS4Lg7nS](https://explorer.solana.com/tx/5R6mNLVuNhivLsiJRpqRYhYQSJkodhQwzTFrTJqayg6Ywik1oCyhaQwaHWtVchurRqY6qaxrpgdSjZHjWS4Lg7nS?cluster=devnet) | 508108297 | 5000         |

Organization **EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A**. Vault **6nDTB65MgSm2H3cikxLUoeYY8GdkC89vMbcjY5j84eUq**. Classic SPL test mint **6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9**, decimals 6, verified mint/supply/authority by the runner; these are **test tokens, not USDC**. Deposit 1,000; Research allocation 400, Operations 100, Data 150, Scraper 50; valid Scraper spend 10.

## Read-back after revoke

Fresh finalized accounts read slot **508109836**. Stored status is separate from effective authority derived from the complete observed lineage:

| Node       | PDA                                          | Stored / effective | Own available | Subtree remaining |
| ---------- | -------------------------------------------- | ------------------ | ------------: | ----------------: |
| Data       | 47KcPwqLcFwJBTewVrfBesKE6NVuT4PKr1zRZ921Ktad | active / blocked   |           100 |               140 |
| Root       | 8NwP1XmiQbb7gKEQLuyLSNC9Q6FVuF4NgwbfdBVKE2DQ | active / active    |           890 |               990 |
| Research   | DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7 | revoked / revoked  |             0 |                 0 |
| Scraper    | H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB | active / blocked   |            40 |                40 |
| Operations | HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21 | active / active    |           100 |               100 |

Vault holds **990 test tokens**. Revoke returns Research's unspent 390 to Root available without moving vault tokens or traversing descendants. Root available is 890; Operations still reserves 100. Root-only reclaim of available 890 is contract-permitted by this state but **has not been executed**. Operations spend likewise **not executed**.

## Stopped attempt versus fresh read-only diagnosis

The next descendant attempt entered client submission but returned no captured transaction signature. The runner stopped on expected AncestorRevoked versus actual undefined code. A catch assertion preceded error capture, so the original rejection details are **unrecoverable**, not retroactively attributed to the diagnostic below. No confirmed/submitted-failed transaction or fee is claimed for it. The runner did not proceed to Operations or reclaim and was not rerun.

Read-only unsigned simulations (no signer reads, sigVerify false, replaceRecentBlockhash true, no submission):

1. Original Scraper fee payer **DAKmyXzMzoJX4FUVSjyCXFEk8QCQvUMxYXVaompPdvJg**: balance **650,240 lamports** at confirmed slot **508109839**, equal to RPC rent floor. Fee quote **5,000** at slot **508109849**. Simulation slot **508109852** returns **InsufficientFundsForRent { account_index: 0 }**, no program logs, 0 units. This is rejection before program execution, not a confirmed failed transaction.
2. Explicit diagnostic-only treasury fee payer **3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm**, original Scraper instruction authority: fee quote 10,000 at slot 508109856; simulation slot **508109859** reaches the deployed program and returns **InstructionError [0, Custom 6003] / AncestorRevoked / 0x1773**, validation.rs:124, 19,197 units. No roles were changed on-chain. This unsigned diagnostic proves program rejection in simulation, not a completed signed wallet lifecycle.

Core transport limitation: temporary wrapper originally patched root web3 only; frontend imports a different installed copy and its RPC was unpaced. Actual 429 messages occurred in this Core phase. Uploader/deploy succeeded and uploader raw RPC error count was zero; 429 is not claimed as a deployment failure cause. Wrapper now patches both copies and passed four mock checks; no further Core transactions ran.

## Safe local fix and remaining verification

Budget allocates Scraper an extra fee quote of spendable SOL above rent floor for the rejected-spend preflight. The sum distinguishes this headroom from rent and charged fees. Catch branches now record exact errors before preserving the expected AncestorRevoked assertion. Two fee-rise/network budget tests, 17 client tests and 15 authority UI tests pass without weakening assertions.

Before any future resume, preserve these organization/mint/controller identities and resolve fee headroom for the existing Scraper; no new organization or redeploy is necessary. This report does not execute a top-up or request more user SOL. Operations valid action, actual reclaim, browser wallet lifecycle and Arena settlement remain unverified. No submission video presenting this as a complete Core lifecycle was recorded.

[Original lifecycle evidence](../artifacts/devnet-release/lifecycle-1791293314080/evidence.json), [fresh read-only diagnosis and ten finalized statuses](../artifacts/devnet-release/sequential-uploader/v2/core-readonly-diagnostic.json), [raw diagnostic RPC journal](../artifacts/devnet-release/sequential-uploader/v2/core-readonly-rpc.jsonl).
