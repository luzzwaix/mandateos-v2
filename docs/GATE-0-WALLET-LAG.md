# Gate 0 — wallet lag and read-only Performance traces

Historical report. Its original scope/gate restrictions describe that run; the current overnight release authorization controls the new sprint. Native Phantom observations remain unverified. See [current procedure](OVERNIGHT-RELEASE.md).

7 October 2026. **OPEN: actual Phantom-connected lag could not be reproduced or ruled out.** Disconnected QA is complete. No visual work or Devnet writes followed it.

## Scope and current state

The user's Gate 0 request controls this work. The attached visual specification and pasted startup sprint are contextual documents, not authorization to execute their visual, SDK, branching, deployment or transaction instructions.

- Repository: `C:/Users/ford5/Desktop/Solana Collosseum/mandateos-visual-pass`.
- Branch: `devnet-integration`; unchanged HEAD `80db0898b949056e6a97beebde5a47c5aaa446f1`.
- Public app tested: <https://mandateos-v2.vercel.app/app> and `/arena`. Public deployment Git provenance was not freshly queried in this run; the earlier reports' SHA is not presented as a new verification.
- Local app: `http://127.0.0.1:3101`; rebuilt from current source with `npm --prefix web run build`, exit 0. The existing static-preview process serves that rebuilt export.
- Three pre-existing untracked reports were preserved: `GATE-1-PERFORMANCE-QA.md`, `RELEASE-CANDIDATE-STATUS.md`, `gate1-performance.json`. Other sibling checkouts were untouched.
- Added only this report and `scripts/qa-wallet-performance.mjs`. No app/protocol source edits, indexer, database, keys, branch switch, checkpoint, push, merge or deployment.

## Wallet availability and coverage

The supported browser inventory contained Codex IAB and MCP Apps, with no extension-enabled Chrome session. The preferred browser execution tool was unavailable. In the actual public IAB, Wallet → Connect Phantom returned **“Install Phantom, then refresh this page.”** The temporary tab was closed. Both profiling contexts also reported no Phantom provider, and their real connect buttons produced the same unavailable-provider message. No provider, wallet address, keypair, mock adapter or signer was injected.

| Scenario                                             | Public                  | Local                   |
| ---------------------------------------------------- | ----------------------- | ----------------------- |
| Disconnected direct `/app`, real account reads       | Measured                | Measured                |
| Disconnected direct `/arena`, real account reads     | Measured                | Measured                |
| App → Arena and four repeated route switches         | Measured                | Measured                |
| Command history, Command idle, Arena idle            | Measured                | Measured                |
| Connect attempt with provider absent                 | Measured; no connection | Measured; no connection |
| Genuine connected wallet / provider response time    | **Unavailable**         | **Unavailable**         |
| Genuine disconnect/reconnect or provider event storm | **Unverified**          | **Unverified**          |

## Method and evidence

Fresh headless Chromium **149.0.7827.55**, 1440×900, DPR 1, separate fresh contexts, sequential runs against actual public Devnet accounts. Captured Chrome Performance-format traces with main-thread tasks, stacks, CPU profiling, loading and named phase marks. This is a Performance trace, not merely a Playwright action recording.

The same harness observes long tasks, React root commits, application RAF callbacks, running animations, layout/paint events and every Devnet RPC method with HTTP/response timing. React root commits are an explicit proxy for render activity; production per-component render counts were not measured. Instrumentation, navigation assertions and browser automation add overhead; these are individual observed samples, not statistical INP/FPS estimates or an isolated same-host patch experiment.

The RPC guard allows only enumerated read methods on `api.devnet.solana.com`. Unknown methods, Mainnet RPC POSTs, transaction submission and airdrops are blocked. **Zero forbidden requests were attempted**, in either run. No wallet signing or simulation was requested. HTTP 200 and actual account-backed states were verified on both direct routes. No page runtime errors or HTTP/JSON RPC errors were observed. One public `getSignaturesForAddress` was aborted by deliberate full navigation; the last public read was still pending at trace stop. Local requests all completed.

Raw files, new captures and derived trace summaries are in ignored `target/gate0-20261007/`:

- [Public Performance trace](../target/gate0-20261007/public/performance.trace.json), [request/phase measurements](../target/gate0-20261007/public/measurements.json), [trace-event summary](../target/gate0-20261007/public/trace-summary.json).
- [Local Performance trace](../target/gate0-20261007/local/performance.trace.json), [request/phase measurements](../target/gate0-20261007/local/measurements.json), [trace-event summary](../target/gate0-20261007/local/trace-summary.json).
- Public/local [Command before](../target/gate0-20261007/public/command.png) / [after](../target/gate0-20261007/local/command.png), [Arena before](../target/gate0-20261007/public/arena.png) / [after](../target/gate0-20261007/local/arena.png). All four images were opened and inspected. They show existing account state and historical receipts, not fresh wallet transactions or a new visual pass.

Main-thread times below are sums of `RunTask` events bounded by the trace's phase marks. This avoids cumulative CDP counters across document navigation. The initial public harness incorrectly zeroed the previous CDP CPU counters on navigation; its raw cross-document `taskMs/scriptMs/layoutMs/styleMs` fields are excluded. The preserved raw trace is valid; its marker-bounded sums supply the report. The saved harness was corrected, and the local run retains both raw CPU snapshots for audit.

## Observed before → after

“Before” means current public app and “after” means rebuilt current local candidate. The candidate's earlier read fixes already existed in `67ccb16`; this run did not introduce them. Hosting, existing UI differences, public RPC variability and sampling/polling phase alignment affect these numbers.

| Observation                                          |                   Public |              Local candidate |
| ---------------------------------------------------- | -----------------------: | ---------------------------: |
| Cold `/app`, navigation → confirmed account reads    |                 17.055 s |                     10.021 s |
| RPC through that readiness                           |                       14 |                           10 |
| Deployment verification sequences in cold `/app`     |                        2 |                            1 |
| Cold `/app` React root commits                       |                       52 |                            7 |
| Cold `/app` main-thread task time                    |                992.48 ms |                    725.38 ms |
| Cold `/app` long tasks observed                      | 4: 138 / 66 / 72 / 91 ms | 5: 81 / 60 / 76 / 76 / 54 ms |
| Cold `/app` layout time                              |                119.26 ms |                    105.60 ms |
| Command history 65 s: RPC / root commits             |                   25 / 2 |                      36 / 19 |
| Same history phase: main-thread time / long tasks    |            278.42 ms / 0 |                475.87 ms / 0 |
| Command idle 20 s: RPC / root commits                |                   20 / 3 |                        5 / 1 |
| Command idle main-thread time / long tasks           |            236.48 ms / 0 |                 26.26 ms / 0 |
| App → Arena route availability                       |                   140 ms |                       117 ms |
| Arena idle 20 s: RPC / root commits                  |                   20 / 4 |                        9 / 3 |
| Arena idle main-thread time / long tasks             |            210.99 ms / 0 |                176.44 ms / 0 |
| Four repeated switches, individually                 |     87 / 88 / 87 / 95 ms |         71 / 87 / 73 / 79 ms |
| Direct `/arena` navigation → account-backed state    |                 13.924 s |                      9.815 s |
| Direct Arena readiness RPC / root commits            |                  14 / 32 |                       10 / 6 |
| Direct Arena main-thread task time                   |                537.34 ms |                    476.65 ms |
| Direct Arena long tasks                              |               One: 67 ms |                   One: 59 ms |
| All completed RPC response times: median / p95 / max |      108 / 518 / 1299 ms |          105 / 751 / 2340 ms |
| Median gap between request starts                    |                  1001 ms |                      1001 ms |
| p95 gap between request starts                       |                  3501 ms |                      3502 ms |
| Total recorded RPC calls, whole scenario             |                      102 |                           81 |

The local history phase deliberately publishes receipts progressively and allows account refreshes independently. It has **more** history-window requests/commits and task time; this is not a claim that every metric improved. Its remote RPC p95 and worst response were also higher in this sample. Client-route readiness does not mean a fresh chain read finished; the existing snapshot is retained. No RPC was started during the measured client-route-switch phases.

All Command/Arena idle samples had **zero long tasks**, **zero application RAF callbacks**, **zero running animations at phase end** and **zero canvas elements**. Finite route-entry animations were present immediately after navigation and completed during idle. Idle includes background polling and progressive history, so it does not mean zero RPC or zero paints. Direct Arena's first 20 seconds still included history reads and finite entry animation painting.

## Cause assessment and minimal-change decision

**Established for disconnected loading:** the read pipeline is the dominant delay. Public `/app` required 17.055 seconds elapsed with 0.992 seconds of measured main-thread tasks; there was no multi-second main-thread task. The typical RPC response was approximately 0.1 seconds, while request starts were spaced approximately 1 second apart. `createRpcFetch` serializes requests with a 1000 ms interval and separately paces `getTransaction` at 3500 ms. Public cold reads repeat deployment verification; the candidate removes that repetition. Trace gaps and request method counts corroborate the source, so this identifies **client RPC scheduling/waterfall**, not proof that the RPC server spent 17 seconds serving one request.

**Not established:** the reported lag after native Phantom connection. A wallet provider's approval time, extension event behavior, wallet-triggered read/cache invalidation and connected route/idle behavior remain unobserved. The public source creates its read client from wallet state; the candidate's existing stable reader survives connect/disconnect. That source difference is a plausible mechanism requiring real-provider verification, not newly fabricated connected evidence.

**No additional runtime correction is justified by this run.** The already committed candidate demonstrably reduces duplicate cold reads and sampled idle RPC volume. Disconnected idle shows no render/animation storm. Adding an indexer, replacing the RPC, weakening pacing or introducing speculative memoization would exceed the evidence. The current candidate still takes about 10 seconds to load cold accounts; that remaining paced latency is visible and is not labeled resolved.

## Browser write flow — deferred until Gate 0 closes

No Devnet transaction is approved or prepared for execution by this report. The prior handoff's wallet, balances and fee/rent numbers are historical; they must not be reused as current quotes. The existing UI/client's unknown-signature storage/reconciliation and fresh account refetch paths were inspected, but this is not a new browser-signing test.

When the real-wallet lag gate is resolved, every Devnet write must have a concrete approval packet immediately before signing:

1. Exact action and instruction; signer/controller and fee payer; network **Devnet**, verified genesis and program **`125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`**.
2. Organization/mandate/parent and full ancestry; exact human/base-unit amount, mint and decimals; source and destination accounts/PDAs, including every new account.
3. Expected authority/accounting/token changes stated separately; fresh account state used to derive them.
4. Read-only fee quote for the exact unsigned message and current rent quote for each account allocation/conditional ATA creation. State any unavailable estimate; never substitute an old quote.
5. Wait for the user's **explicit per-action approval**, then request native wallet approval once. A general workflow approval does not authorize the next write.
6. Preserve the signed signature before submission; verify the real receipt, `meta.err`, slot/finality, fee, program logs and relevant token balances; refetch organization, mandate ancestry, vault and affected Arena accounts. Do not treat an Explorer link or confirmation notification alone as proof of expected state.
7. If outcome is unknown, query the saved signature/history, receipt, finalized block height versus its validity horizon, and relevant on-chain state before considering another action. Never silently generate a replacement transaction. The existing reconciliation helper requires finalized expiry and absent history/receipt to classify an absent submission as expired.

Mainnet writes and Solana program deployment remain prohibited. No local-validator write was needed for this performance audit.

## Validation and next step

- Rebuilt production export and its TypeScript phase: **passed**, direct routes exported.
- Harness syntax check, formatter and `git diff --check`: **passed**.
- Both fresh read-only harness runs: **exit 0**, traces captured, no blocked write attempts, no page runtime errors.
- Existing earlier unit/validator results were not relabeled as fresh tests. No app or contract source change required a new validator suite, and no checkpoint was made.

The next necessary input is an accessible extension-enabled Phantom session or an owner-recorded Performance trace spanning disconnected → real connect → `/app` ↔ `/arena` → idle. It must use connect/reads only, without submitting writes. **Gate 0 remains OPEN** until the reported connected behavior has evidence. Visual changes and the approved-write lifecycle remain deferred.
