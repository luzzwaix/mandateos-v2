# Startup v1 — measured receipt contention

7 October 2026. Starting source: `80db0898b949056e6a97beebde5a47c5aaa446f1`.

Demonstrated cause: the shared RPC queue awaited a historical receipt's complete response body and receipt-specific pacing before admitting independent account reads. A slow receipt could therefore delay account freshness by its entire timeout. Two serialized lanes now share one launch limiter and provider backoff. At most one current request and one receipt request are in flight. Current requests still serialize; reads retry boundedly; ambiguous sends are never replayed by this transport. Queued aborted requests never launch.

## Controlled comparison

`node scripts/measure-rpc-contention.cjs before` on the starting transport, then `node scripts/measure-rpc-contention.cjs after` on the patch. Identical conditions: five fresh limiter instances per version, synthetic 600 ms receipt latency, zero account latency, 25 ms aggregate launch spacing. No wallet, chain state or network evidence is claimed by this benchmark.

| Account-read delay behind a receipt |                                     Before |                                 After |
| ----------------------------------- | -----------------------------------------: | ------------------------------------: |
| Samples, ms                         | 645.72 / 622.32 / 618.11 / 619.70 / 619.21 | 66.78 / 31.16 / 30.03 / 30.68 / 29.97 |
| Mean, ms                            |                                     625.01 |                                 37.72 |

The regression test holds a receipt open until the independent account read finishes. Additional checks cover aggregate spacing, cancellation, body/header deadlines, Retry-After, no send replay, immutable receipt reuse and real error provenance. Client/transport suite: 38 passing.

## Real disconnected browser observations

One fresh Chromium 149.0.7827.55 context per version; 1440×900, DPR 1; local static production exports, actual public Devnet RPC and recorded organization; no Phantom injection, signing, send or airdrop. Baseline export is frozen in `target/startup-v1/baseline-export`, served on port 3102; candidate on 3101. Same harness: the existing, preserved `scripts/qa-wallet-performance.mjs`. Full raw request/phase/CPU records: `target/startup-v1/performance-baseline` and `performance-final`. Earlier exploratory runs interrupted by rebuilding their preview are excluded.

| Observation                            |            Before |             After |
| -------------------------------------- | ----------------: | ----------------: |
| Command navigation → account readiness | 21.710 s / 10 RPC | 10.286 s / 10 RPC |
| Direct Arena → account readiness       | 10.353 s / 10 RPC | 10.084 s / 10 RPC |
| Command idle, 20 s                     |             6 RPC |            10 RPC |
| Arena idle, 20 s after route switch    |            11 RPC |            12 RPC |
| Direct Arena idle, 20 s                |             8 RPC |            12 RPC |
| Four warm route transitions, total     |            323 ms |            578 ms |

Both runs had zero application errors and no idle animation/RAF/canvas. Public RPC latency, polling phase, concurrent verification workloads and one sample limit interpretation: the cold Command difference does **not** establish that this patch reduced cold network latency. Idle request counts and route timings did not improve. The independently repeatable improvement is removal of receipt head-of-line blocking; reduced request count was not its objective. Final frontend adds the bounded visual pass; desktop account-read semantics remain unchanged.

Real Phantom is unavailable: supported browser inventory exposes IAB and MCP Apps only; browser-client connection reports an unavailable trusted bridge. The genuine connected-wallet lag, provider latency, and browser-signing flow remain **open**. No on-chain write occurred. Next performance step: repeat this harness and connect/route/idle observations in the owner's extension-enabled browser, with no transaction approval needed for reads.
