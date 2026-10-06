# Final adversarial QA — 7 October 2026

Local candidate on `devnet-integration`, starting from clean checkpoint `bd64b1f247d15e89b1973b3238edbddef8a46bb2`. No Solana deployment, Devnet signing/submission, authority/key changes, push, merge or history rewrite in this pass. Authority Chamber composition and contract semantics were preserved. The public frontend remains the earlier deployment until the owner reviews this candidate.

Runtime/test checkpoint: `67ccb1659e8bf8e0aafbcec9dd98696ca4bcb5f0`. A separate local documentation checkpoint contains this report, measurements and reviewed captures. Exact documentation files: `README.md`, `docs/DEVNET-MVP-VERIFICATION.md`, `docs/devnet-mvp-proof.json`, `docs/FINAL-ADVERSARIAL-QA.md`, `docs/qa-performance.json`, and the four new `docs/images/qa-*.png` captures linked below. The runtime file table accounts for the other 15 changed files. No ignored environment, signer or generated private material is staged.

## Baseline, captured before edits

All three local production routes and anonymous public routes opened successfully. Lint, frontend/root typechecks, production build, 54 unit checks, 16 Rust unit tests and 111 existing surface assertions passed. Fresh SBF compilation succeeded; the following IDL compilation failed with `os error 112` (disk full), before validator tests started.

Confirmed defects: wallet connection reconstructed the read client and discarded finalized-receipt cache; polling restarted on `busy` changes and could overlap an older read; each refresh verified deployment twice; account refresh awaited the entire paced history and manual reads repeated the waterfall. A stalled RPC had no deadline. Real PDA nodes fell through to an unstyled desktop ledger; generic labels obscured the canonical Research/Data/Scraper lineage. Controller identity and the included failed receipt were absent from the selected-node inspector. Arena's long numeric ID wrapped in its large title, and compact evidence could be squeezed into a narrow column.

No hydration mismatch or runtime/console error was observed. Aborted speculative route/prefetch requests were recorded separately; they were not RPC failures. No permanent RAF loop, live idle animation, canvas/WebGL outside Story, or duplicate wallet listener was found. Current Story is SVG, not an active R3F renderer. Genuine Phantom/Solflare main-thread jank could not be reproduced because the connected browser inventory exposes no extension-enabled Chrome. Adapter tests use only public identity and prohibit signing.

Baseline captures: repository-local ignored `artifacts/adversarial-qa/baseline-surfaces`; other raw measurements/captures are in `D:/MandateOS-QA-1791307776654` to avoid the full C: disk. `baseline-local`, `baseline-tail` and `public-routes` precede edits. The first baseline harness had an incomplete adapter mock; its connection failure is excluded from product findings.

## Root causes and measured comparison

Chromium 149.0.7827.55, 1440×900, DPR 1, production static frontend. These are observed runs on a variable public Devnet RPC, not statistical INP/FPS benchmarks. The same public-only adapter harness was used before and after. No signature was created.

| Measurement                                                              |                           Before |                 Local candidate |
| ------------------------------------------------------------------------ | -------------------------------: | ------------------------------: |
| Cold account read                                                        | 13.120 s / 14 total RPC requests | 9.118 s / 10 total RPC requests |
| First real receipt visible, paired cold run                              |                         70.573 s |                        12.798 s |
| Connect + 65 s observation: total RPC requests                           |                               36 |                              24 |
| Same connect window: repeated `getTransaction`                           |                               12 |                               0 |
| Disconnect/reconnect + 20 s: RPC requests                                |                               19 |                               9 |
| Same reconnect window: `getTransaction`                                  |                                4 |                               0 |
| Connect window main-thread task time                                     |                       327.903 ms |                      288.007 ms |
| Connect window long tasks ≥50 ms                                         |                                0 |                               0 |
| Wallet subscriptions                                                     |                    One per event |                   One per event |
| Connected Arena navigation, excluding deliberate 10 s observation        |                           103 ms |                           99 ms |
| Story/reduced-motion idle: application RAF / running animations / canvas |                        0 / 0 / 0 |                       0 / 0 / 0 |

Cold history now publishes receipts progressively while account freshness continues independently: its 65 s window had 37 requests and 19 commits, versus the old blocking window's 25 requests and 2 commits. This is not a claim that every cold request count decreased. Final cold load included two finite long tasks (83/65 ms); continuous freezing was not observed. Route-navigation mutation counters are excluded because a hard navigation resets them.

Injected stalled-RPC and wrong-genesis tests are explicitly synthetic: the old UI still had no timeout after 20 s; the candidate displays a bounded timeout and remains interactive. Unit tests also cover a response body that stalls after headers. Ambiguous sends are never automatically replayed. Genuine browser-extension connect stabilization and background idle CPU remain unverified.

## Fixes and exact systems

| Files                                                                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/src/lib/use-console.ts`                                                                            | Stable wallet-independent reader/cache; single-flight account reads; completion-based 15 s account / 30 s history polling; visibility cleanup; progressive history independent of action completion; new post-confirmation read generation; explicit rejection provenance.                                                                                                                    |
| `web/src/lib/solana/client.ts`, `rpc.ts`, `types.ts`                                                    | One full deployment verification per load; incremental immutable receipts; cancellable history scheduling; 15 s request/body deadline; decode actual instruction/account identities and failure index before associating a receipt with a mandate. Send semantics and enabled preflight retained.                                                                                             |
| `web/src/lib/solana/fixture-labels.ts`, `authority-layout.ts`                                           | Exact recorded PDA labels and topology qualification. Names are presentation metadata, not invented Rust account fields. Arbitrary organizations retain the nested ledger. No synthetic Analysis account is added.                                                                                                                                                                            |
| `capital-authority-instrument.tsx`, `capital-operating.css`                                             | Existing approved geometry accepts actual PDA identity; nested ledger styled at desktop too; Research cut styles follow visual role while actual account IDs remain intact. Correct evidence contrast and Arena evidence width.                                                                                                                                                               |
| `command-world.tsx`                                                                                     | Controller identity, complete ancestry and historical finalized 6003 receipt in the blocked inspector; selected-node last receipt with decoded amount, finality, slot and Explorer link; distinct failure provenance; real slots/fees; revoke signer eligibility; positive/available amount checks; stale/pending explanations. Transaction fields open only after explicit action selection. |
| `arena-world.tsx`, `story-world.tsx`                                                                    | Two Story clarity lines distinguish mandate from controller and identify Solana. Arena keeps ID as metadata and explicitly describes trusted-verifier atomic payout. No composition/motion rewrite.                                                                                                                                                                                           |
| `tests/authority-ui.ts`, `devnet-client.ts`, `devnet-rpc-check.ts`, `scripts/verify-devnet-browser.mjs` | Regressions for PDA topology, parity-before-create, sponsored receipt identity, unrelated instruction failure, stalled RPC/body, progressive cache, cancellation, actual Research cut/contrast and historical denial link. Existing tests retained.                                                                                                                                           |

Second visual inspection caught a real-PDA Research frame that still inherited the demo-only fill selector and dark evidence text inherited from the bone inspector. Both were fixed and verified in the actual browser. Controller and receipt changes were inspected after rendering, not accepted from source alone.

## Screenshots reviewed, after fixes

1. Story final recursive hierarchy (`final-local/story-recursive.png`, explicitly DEMO).
2. Authority Trace (`final-local/story-trace.png`, DEMO).
3. Pre-revoke Blast Radius (`final-local/story-blast.png`, DEMO).
4. Completed cascade ([saved DEMO capture](images/qa-story-cascade-demo.png)); its animation is not a confirmed Devnet action.
5. Scraper blocked inspector ([actual Devnet reads and historical failure](images/qa-scraper-devnet.png)).
6. Operations unaffected, with its actual 5-token historical receipt ([capture](images/qa-operations-devnet.png)).
7. Command connected/read-only (`final-local/command-connected-read-only.png`; public-only adapter mock, no extension signing).
8. Spend review (`final-responsive-validated/1440-spend-review-disabled-wrong-controller.png`); wrong-controller action stays disabled. Pending recovery is an explicitly labeled replay of a real CLI receipt, not a newly submitted browser transaction.
9. Arena settled ([actual 25-token account/receipt](images/qa-arena-devnet.png)). The capture also truthfully retains the missing-extension client rejection; it is unrelated to the historical settlement.
10. Mobile/narrow (`release-mobile/scraper.png`, `final-responsive-validated/390-arena.png`, `final-local/story-mobile-cascade.png`).

Raw captures use the D: directory above. Fifteen responsive/reflow states passed without horizontal overflow, runtime errors or sends, including 1440, 1366, 1024 and 390 px. The latest 390 px Scraper capture was inspected again after adding receipt amounts. Keyboard focus, Escape, interrupted motion and reduced-motion states passed existing browser assertions. Widths 720/683/512 emulate 200% reflow; native browser 200% zoom is still a manual gate. A synthetic CSS `zoom:2` stress experiment overflowed; that test does not reproduce native browser zoom and is not reported as a pass.

## Solana truth and provenance

Read-only reconciliation at **2026-10-06T18:21:38.981Z**, finalized account slot **508181631**, confirmed all **19 historical finalized lifecycle receipts**. Payer balance: **20,089,520 lamports**. Program executable and ProgramData/authority unchanged. Local ELF SHA256 remains `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35` (462984 bytes). RPC `https://api.devnet.solana.com`; genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.

Program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`; ProgramData `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2`; upgrade authority `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`. Classic SPL test mint `6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9`, six decimals; Devnet UI uses TOKENS, never labels this mint USDC.

| Flow                                                            | Real receipts / contract                                                       | Browser status                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Treasury, funding, recursive delegation, valid spend            | CLI-finalized historical receipts                                              | Real account reads; fresh wallet approvals unverified                                                |
| Research revoke                                                 | Target stored Revoked; parent authority/accounting released; no token movement | Real observed state; DEMO cascade separately labeled                                                 |
| Data / Scraper after ancestor revoke                            | Stored Active, effectively blocked by complete lineage                         | Real state, controller, Treasury → Research → Data → Scraper and earliest invalid Research displayed |
| Included Scraper failure                                        | Finalized `InstructionError [0, Custom 6003]`, `AncestorRevoked`, fee 10000    | Actual historical receipt linked from inspector; not browser initiated                               |
| Operations survives / spends 5                                  | CLI-finalized; available 95, remains active                                    | Actual sibling state read; fresh wallet write unverified                                             |
| Reclaim 890                                                     | CLI-finalized separate Root-only transfer                                      | Actual accounting read; fresh wallet write unverified                                                |
| Arena reward / two submissions / settlement 25                  | CLI-finalized; trusted verifier signs atomic winner payout                     | Actual settled account and Explorer evidence read                                                    |
| Separate verifier proof / autonomous work / bounty cancellation | No corresponding instruction                                                   | Not claimed                                                                                          |
| Pending recovery / wallet rejection / wrong genesis             | Unit stubs + explicitly labeled browser adapter/fault/receipt-replay tests     | Not real approval or new on-chain failure                                                            |

Key real receipts: [Scraper denial](https://explorer.solana.com/tx/2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv?cluster=devnet), [Operations spend](https://explorer.solana.com/tx/4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ?cluster=devnet), [Root reclaim](https://explorer.solana.com/tx/47NXub9AtFFmiLaSGKbK18ALwjgHWsKQgLVCiT2UeYurkuxQTuBvtGWq18UHNAGu1nFAJcbjRUzQ4BXej2aVdzHX?cluster=devnet), [Arena settlement](https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet). Full receipts remain in [public proof](devnet-mvp-proof.json). **Browser-initiated confirmed transactions: zero.**

The included failed CLI transaction used the previously authorized diagnostic preflight exception after observing 6003 simulation. This pass does not repeat it; ordinary client paths retain preflight. Arena submission eligibility does not validate Core lineage. Revoked descendants' historical stored balances are not spendable capacity and must not be double counted. Current vault 100 equals active Root 5 + Operations 95; Data 100 and Scraper 40 are blocked stored records.

## Verification

- Frontend lint: pass, zero warnings; frontend/root typecheck: pass; production build: pass, `/`, `/app`, `/arena` exported.
- Rust formatting/check: pass; Rust unit tests: **16 passed, 0 failed**.
- Source SBF build: pass. Fresh IDL compiler: **failed, disk-full OS error 112**. The isolated generated fixture's unchanged Rust/tests were compared; its successfully built SBF was tested using the previously generated matching IDL schema with that existing Localnet artifact address. `npm run test:local -- --reuse .localnet/run-1791307776654/workspace`: **64 passed, 0 failed**, eight fresh disposable banks. This does not relabel the failed fresh IDL build as successful.
- Authority/client/RPC/evidence/budget units: **61 passed, 0 failed**.
- Capital surfaces: **111 passed, 0 failed**; finite motion/interruption: **10 passed, 0 failed**.
- Actual Devnet reads + explicitly labeled adapter/recovery edge cases: **33 passed, 0 failed**, zero sends/signatures; real extension signing absent. An earlier run stopped on a `display: contents` screenshot target; the capture now uses its rendered parent and the complete rerun passed.
- Anonymous local/public direct routes: **6/6 HTTP 200**, zero runtime/console/hydration errors. Aborted speculative prefetches were recorded separately.
- Secret scan and `git diff --check`: pass. Manual Impeccable detector returned no findings; screenshot review remains the quality evidence.
- Repository `npm run format:check`: **failed on four unchanged pre-existing files** (`scripts/measure-control-instrument.mjs`, `docs/CONTROL-INSTRUMENT.md`, `docs/SPATIAL-DIRECTOR.md`, `docs/VISUAL-JUMP.md`). They are outside this correctness pass and were preserved; the new report was formatted separately.
- Fresh frontend `npm audit --omit=dev --json`: exit **1**, **12 runtime advisories (5 high, 7 moderate, 0 critical)**. Anchor/transitive TOML and bigint-buffer advisories have no compatible automatic fix; suggested Solana dependency changes include incompatible major versions or a downgrade. No forced dependency migration or lockfile change was made. These remain release/security limitations.

Run browser checks with `node scripts/verify-devnet-browser.mjs http://127.0.0.1:3101 <new-output-directory>`. Run unit suite with `npx ts-mocha -p tsconfig.json tests/authority-ui.ts tests/devnet-client.ts tests/devnet-rpc-check.ts tests/devnet-evidence-check.ts tests/devnet-budget-check.ts`. Launch production static preview with `npm --prefix web run build`, set `$env:PORT="3101"` in PowerShell, then `npm --prefix web start`. Existing agent read/simulate/execute quickstart remains in README; a manual DEMO click is not autonomous-agent evidence.

## Public release and next approvals

[Public app](https://mandateos-v2.vercel.app/) and direct `/app` / `/arena` remain anonymous HTTP 200. Vercel production `dpl_6zwRZT42yGPaNsCVnPNJsAs6T3UN` is Ready. This is the earlier frontend, **not this local performance/clarity candidate**. Devnet default and public settings are unchanged; secrets are not placed in NEXT_PUBLIC, browser code or Vercel. No new backend is required for direct program reads/signing.

Owner-browser approval remains a release gate. The C7j… wallet cannot act as controller of the historical 3ws8… fixture. Next signing must use a new isolated C7-owned organization. First action: `create_organization`, wallet `C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo`, verified test mint above, zero token transfer, new organization/root/vault PDAs derived from its chosen organization ID; C7 pays Devnet SOL rent/fee. Destination PDA and fresh rent/fee quote must be shown before asking for approval. No approval is requested in this QA pass.

Later separate approvals: deposit chosen test-token amount to that new vault; bounded Root → Research/Operations and Research → Data → Scraper delegations; valid spend to an explicitly reviewed token account; Research revoke (accounting release, no transfer); descendant preflight rejection (no invented Explorer receipt); Operations spend; Root-only reclaim to owner's token account. Arena requires its actual creator, submission agent and trusted verifier signers. Amounts, derived addresses and fees must be reviewed per action; old fixture receipts must remain intact. Unknown results must be reconciled before another signing intent.

Remaining gates: publish this reviewed candidate; genuine Chrome/Phantom approval/refusal/reconnect and wallet-connect performance on the owner's browser; native 200% zoom; fresh UI Core/Arena writes; fresh IDL compiler after freeing disk space; independently confirm an encrypted recovery backup under owner's control. Runtime dependency advisories remain; this pass makes no Mainnet-safety claim. Automatic approval review rejected deletion of this pass's failed local compiler cache, so no cleanup or deletion workaround was performed.

## Judge cold read / verdict

MandateOS is recursive, revocable capital authority assigned to agent controllers over one treasury. Solana validates the complete ancestry and capital accounting atomically for each supported action. The difference from a wallet limit is inherited authority with bounded recursive delegation and ancestor invalidation. The memorable moment is Research's cut, structurally present but blocked Scraper with a real 6003 receipt, and live Operations. The weakest remaining evidence is genuine owner-browser signing and the unpublished candidate.

Subjective local candidate scores: visual polish **8/10**, performance **8/10**, clarity **8/10**, Solana proof **8.5/10**, judge readiness **7.5/10**, overall submission readiness **7/10**. **Not yet fully Devnet submission-ready under the owner's end-to-end wallet criteria.** High-ROI next work is owner review/publication, then the explicitly approved fresh wallet flow; no new product features or redesign are needed.
