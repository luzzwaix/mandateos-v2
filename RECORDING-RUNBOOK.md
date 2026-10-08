# Morning recording — verified UI, Demo and historical Devnet

Start locally at **http://127.0.0.1:3201/** using the final isolated candidate server. The morning handoff supplies the immutable preview URL and its access requirement; substitute that base only after its route verification passes. Existing production `https://mandateos-v2.vercel.app/` serves an older commit and must not be presented as this candidate.

Use a 1440×900 desktop window, no wallet connected. Story is always **DEMO MODE**. Direct `/app` and `/arena` loads default to **DEVNET**. These routes do not implement `?mode=demo`, `?scene=...`, `?node=...` or `?bounty=...`; do not claim those unsupported links restore selection. Reload resets illustrative Story/mode/selection. Recovery is deliberate: load the exact route, set the visible mode, and repeat the documented selection clicks. Organization selection persists separately; verify/reset it to the public fixture below through Organization address → Open. This exact fresh-load/reload/replay is exercised by `scripts/release-rehearsal.mjs`.

## Technical recording — 2m55s maximum

| Time      | Starting URL / mode     | Clicks and screen                                                                                                                                                                                                                                                                                                        |
| --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:15 | `/` / Demo              | Root, one treasury. Say: “This interactive authority model submits no transactions.”                                                                                                                                                                                                                                     |
| 0:15–0:35 | Story                   | **Delegate Research → Delegate further → Trace Scraper**. Show Root → Research → Data → Scraper. Operations is Root's separate branch.                                                                                                                                                                                   |
| 0:35–0:55 | Story                   | **Preview Research revoke → Confirm demo revoke**. Preview leaves all mandates active; cut marks Research revoked and three descendants blocked, Operations remains active. This is simulated authority/accounting, not a token transfer.                                                                                |
| 0:55–1:15 | Story → Command / Demo  | **Inspect authority in Command**. Scraper is selected; local ACTIVE / effective BLOCKED, earliest invalid ancestor Research. **Attempt demo spend** is simulated denial with no signature. Select Operations to show surviving authority.                                                                                |
| 1:15–1:50 | Fresh `/app` / Devnet   | Confirm Product mode DEVNET and organization below; wait for **CONFIRMED ACCOUNT READS**. Select **Scraper**; show real PDA, local/effective state and full ancestry. Expand **History** when needed. Attribute 6003 to the historical receipt below, not this browser session. Select **Operations**, currently active. |
| 1:50–2:20 | Fresh `/arena` / Devnet | Same organization. Select bounty `3UEK…wpqxg` if multiple appear. Show recorded 25.00 test-token reward, two submission commitments, trusted verifier, observed settlement. Inspect the losing submission, then recorded winner; settlement/winner must stay unchanged.                                                  |
| 2:20–2:45 | Terminal                | Show `npm run agent:inspect` output: real read-only Devnet Scraper ACTIVE/BLOCKED, complete path, Research blocker, stop before spend. SDK export builds/imports independently. Worker spend has RPC-stub tests; do not describe them as a live agent payment.                                                           |
| 2:45–2:55 | Explorer                | Open historical 6003 or settlement receipt. Explain genuine chain evidence is historical CLI execution. Native Phantom signing remains the next owner-approved gate.                                                                                                                                                     |

For a fresh recording take: navigate to `/` and repeat the five Story buttons. For fresh Devnet `/app`, wait for confirmed reads and click Scraper again; a reload does not preserve that selected node. For `/arena`, fresh inspection defaults to the existing bounty; verify its full account address and winner instead of relying on list order. No need for Phantom for these read-only scenes.

## Exact real account identifiers

| Item                                         | Devnet address                                 |
| -------------------------------------------- | ---------------------------------------------- |
| Program                                      | `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd` |
| Organization                                 | `EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A` |
| Root                                         | `8NwP1XmiQbb7gKEQLuyLSNC9Q6FVuF4NgwbfdBVKE2DQ` |
| Research                                     | `DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7` |
| Data                                         | `47KcPwqLcFwJBTewVrfBesKE6NVuT4PKr1zRZ921Ktad` |
| Scraper                                      | `H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB` |
| Operations                                   | `HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21` |
| Classic SPL test mint (6 decimals; NOT USDC) | `6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9` |
| Settled bounty                               | `3UEKqDwbRviwJk3vHFtUUpQaVkcQvpH8VuN8Dc9wpqxg` |
| Recorded winner                              | `92XK32H2YbZwAZuhQgoVxy13okRGKnujXkgEycdmL4tt` |

The real fixture has five mandates; Analysis is illustrative Demo topology, not a claimed sixth real account. Fresh read verification observed vault 100.00 test tokens, Root own available 5.00, Operations 95.00. Nested Data/Scraper stored amounts are authority envelopes blocked by Research; never add them to vault funds. Actual program upgrade authority and historical fixture controller are `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`; connection of a different wallet grants no execution rights.

## Historical Devnet evidence — distinct from Demo

All three links below use `cluster=devnet`. Reconcile receipts before recording; they prove historical outcomes, not new browser/worker actions.

- [Blocked descendant: finalized program error 6003](https://explorer.solana.com/tx/2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv?cluster=devnet).
- [Operations sibling spend succeeded](https://explorer.solana.com/tx/4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ?cluster=devnet).
- [Atomic Arena settlement: 25 test tokens to recorded winner](https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet).

## Clearly labeled fallback

If RPC is slow, wait for the visible read status; keep the last confirmed snapshot on screen and say it is retained data. If it fails, do not call stale/unverified data live. Load `/`, repeat the five Story actions, open Command, keep **DEMO MODE** visible. Arena: navigate by Arena link, select Demo if necessary, **Reset demo → Fund demo mission → Submit 3 demo results**, select Submission A, **Select A & settle in demo**, inspect C to show the winner stays A. Say “Simulated; no transactions.” Keep the historical Explorer links or saved genuine receipts in a separate tab. Neither fallback screenshots nor simulation logs are new chain proof.

## Founder pitch — 2m50s maximum

- **0:00–0:25 — Problem / target user:** Teams deploying autonomous agents need bounded spending and an immediate way to stop a delegated branch. This is the intended user, not a claim of acquired customers.
- **0:25–1:05 — Product:** Show Story delegation, ancestry and the Research cut. One shared treasury; parent revocation invalidates descendants while Operations survives. Label this explanation Demo.
- **1:05–1:45 — Evidence:** Open current Devnet Command and Arena reads. Show the separate historical 6003 failure, successful sibling spend and 25-token settlement. Explain trusted verifier and atomic token payout. Real local-validator tests cover program invariants; SDK and worker are developer interfaces.
- **1:45–2:20 — Business hypothesis:** Hypothesis: agent platforms and treasury operators may pay for controlled execution integrations/support. There is no verified adoption, revenue, customer interest or audit to present.
- **2:20–2:50 — Next milestone:** Owner-controlled Phantom browser lifecycle on Devnet with explicit approvals; measure connected-provider performance, validate with prospective users, then decide the next product milestone. Do not promise Mainnet/security readiness.
