> Current result: Core and supported Arena settlement are finalized. See [Devnet MVP verification](DEVNET-MVP-VERIFICATION.md) and its real receipts. Browser signing/public-access gates are tracked there. The following text preserves the earlier phase; incomplete-Core statements below are historical.

# Devnet continuation — 6 October 2026

## Latest verified continuation — completed deployment, partial Core

**Deployment succeeded once from the existing buffer.** [Sequential resume](DEVNET-SEQUENTIAL-RESUME.md) records expired-offset resolution, all 406 new finalized writes, exact full SHA256 equality and executable/ProgramData/upgrade-authority verification. Program **125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd**; authority **3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm**. [Finalized deploy receipt](https://explorer.solana.com/tx/7aVaURGC1D5pZbEKur2kna8Jxogfz7e2JxsyBdSUWRGp2WSECujNA58yhVqwsreRxfYGc72NibScYwQ1AYfH55B?cluster=devnet), slot **508107891**, fee 10,000 lamports, err null. Deployed SHA **ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35** equals the unchanged 462,984-byte ELF.

**Core is incomplete.** [Core receipts and blocker](DEVNET-CORE-PARTIAL.md): ten finalized transactions through valid spend and Research revoke; fresh state derives Data/Scraper blocked and Operations active. The original descendant rejection was masked by an assertion. Read-only reproduction detects Scraper at rent floor; a separately labeled unsigned sponsored simulation reaches AncestorRevoked/6003. No Operations action or reclaim transaction occurred. Local budget/error capture/temporary transport fixes were checked without restarting Core. Browser wallet approval and Arena settlement remain unverified. No x402 or design change.

Current branch and both start/end commits: **devnet-integration**, **f5b7965dbac9f4b634bfb5eccc6b146046218f68**; all user changes preserved, no new commit/push/merge. Changed in this continuation: this document, DEVNET-SEQUENTIAL-RESUME.md, DEVNET-CORE-PARTIAL.md, tests/devnet-budget.ts, tests/devnet-budget-check.ts, tests/devnet-flow.ts. Ignored temporary upload/diagnostic helpers and evidence remain local; no secrets staged.

Fresh verification: Agave local uploader 15/0; mocked transport 4/0; budget 2/0; client 17/0; authority UI 15/0; root TypeScript passed. Frontend lint (zero warnings), TypeScript and production build passed. Secret scan covered 159 release files with zero findings; git diff --check passed. Rust/build and prior browser results below are historical, not newly executed in this continuation.

## Historical phases — superseded by the latest report

The following entries are retained as the audit trail. Their absent-program, funding, dedicated-RPC and ongoing-upload blockers describe earlier observations, not the current deployed state.

**Active continuation:** the user authorized resolution of the old expired offset and paced rebroadcasting of identical signed bytes. [Sequential resume report](DEVNET-SEQUENTIAL-RESUME.md) records the finalized-zero expiration gate, 15 fresh local-validator checks, the confirmed offset 52,624 replacement, and the ongoing upload. The stopped state below is historical. Final deploy/Core are still gated by full finalized buffer hash equality and deployed-program verification.

**Latest state (12:48:10 UTC):** the user authorized a temporary paced public-RPC uploader after confirming no dedicated endpoint exists. [Sequential-upload report](DEVNET-SEQUENTIAL-UPLOAD.md): 12 local-validator checks passed before signing; 16 new writes finalized and independently read back; matching prefix is now 52,624 bytes. The following submission remained unconfirmed and expired; no repeat signature/send or final deploy was performed. All original finalized records, identities and the buffer deposit remain preserved. Full payload SHA256 differs, Program/ProgramData are still absent, and Core remains unverified. The 36-chunk/dedicated-RPC-only paragraphs below describe earlier phases and are superseded by this latest report.

The authorized source/IDL identity is **`125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`**. It is built locally and remains undeployed. The exact program key and dedicated payer/initial upgrade-authority key exist outside the repository. The user funded the payer with 2.4 Devnet SOL; the authorized deployment was invoked once and stopped on `Data writes to account failed: Custom error: Max retries exceeded`. Program/ProgramData are absent; the partly written buffer and its rent deposit remain controlled by 3ws8…. No Core lifecycle transaction was submitted. See [the actual attempt and confirmed receipts](DEVNET-DEPLOY-ATTEMPT.md) for the latest state; earlier audit/budget snapshots below predate this attempt.

The subsequent [authorized existing-buffer continuation](DEVNET-BUFFER-RESUME.md) invoked `write-buffer` once and encountered the same generic error. Twenty new writes are finalized; buffer now has 36 matching chunks, next offset 36,432, and still fails the full ELF hash gate. Final deployment was not invoked. That continuation report is the latest state; no new buffer, role or Rust change was made.

The next continuation now requires a dedicated Devnet RPC and prohibits another public-endpoint bulk upload. Local discovery on 6 October at 12:31:38 UTC found no dedicated RPC in Process/User/Machine environment, nine environment files across the five known project checkouts/backups, Solana CLI configuration location or known MandateOS private RPC configuration locations. Only standard public/local endpoints were found. This continuation stopped before any network request/signature/send. The local ELF hash still matches; the 36-chunk buffer state above is previous on-chain evidence, not a fresh dedicated-RPC observation. Public discovery metadata is saved in ignored `artifacts/devnet-release/dedicated-rpc-discovery.json` without URL credentials. A private external configuration path or environment-variable name is needed; no API key should be supplied in chat, Git, browser configuration or terminal/report output. The prior public-RPC upload command templates are historical and must not be reused for the newly authorized continuation.

Work remained on `devnet-integration`. Starting commit: `324fe7ae4c184279537130d928f53d0e07ff3213`. The full 24-file integration diff was reviewed, secret-scanned and saved as local checkpoint `c48bbca73e871f848b577cf7e86f06bdaa7bb2a4`. No reset, branch switch, discarded work, push or merge occurred. The separate dirty `mandateos-v2` checkout and all backups were read only.

## Identity and network evidence

- The search was bounded to `mandateos-visual-pass`, `mandateos-v2` and the three known checkpoint/preservation/rollback backups. It inspected 2,019 project JSON files (small JSON arrays parsed privately), including 114 valid keypair files. None matched `Fg6PaFpoGXkYsidMpWxTWqkZ5gnk9j8GaZ9epbEYwPqG`. Accessible project Git history was also inspected. No key contents were printed or copied.
- `Fg6Pa...` entered `Anchor.toml` in foundation commit `06605a5`, then Rust in `4edca98`. No signer or deployment provenance was recorded. Calling it a placeholder is an inference from this history and the absence of matching signing material; a deliberately chosen signer-backed identity was not documented.
- Explicit `https://api.devnet.solana.com` genesis: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. At slot **508044881**, both historical configured IDs (`Fg6Pa...` and `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63`) were absent and owned **zero accounts**. Neither had ProgramData, a deployed upgrade authority or project state. This verifies these project identities, not every unrelated program on Devnet. [Identity audit](devnet-identity-audit.json).
- Only after these checks was the user's conditional authorization applied. A new program signer and payer were created in the external MandateOS private directory. Their public keys were independently checked with `solana address`, and the private session directory's Windows ACL was restricted to the current user. No secrets entered Git or browser code.
- Fresh [program audit](devnet-integration-audit.json): source/IDL/Anchor agree, local binary hash matches, but the new program is absent. Published IDL and upgrade authority therefore do not exist. The new payer is only the intended initial authority until deployment assigns it.

## Build and unchanged contract semantics

Pinned Anchor **0.32.1**, Agave **2.3.0**, platform-tools **v1.52**, host Rust **1.89.0 Windows GNU** built the source ELF and regenerated IDL. Artifact: `target/deploy/mandateos.so`, **462,984 bytes**, SHA-256 **`ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35`**. The deploy key was not auto-generated by the build.

Rust changed only `declare_id!`. Parsed regenerated IDL equals the checkpoint IDL after replacing only its address, and equals `target/idl/mandateos.json`. No instruction, account, validation, event or arithmetic semantics changed. The [Rust truth table](DEVNET-INTEGRATION.md#contract-truth-from-rust) remains applicable. Local tests now derive the source ID before replacing it only in their isolated test copy.

The lifecycle verifier stores all new Devnet signing material outside Git and public receipts in a new ignored artifact directory. It accepts an existing dedicated test wallet only inside that private directory, never copies that signer, verifies the deployed binary before signing, keeps preflight enabled, verifies a freshly created classic SPL mint's decimals/supply/authority and explicitly labels it **test tokens, not USDC**. It fetches and records state after each authority action. Transport observations preserve actual returned signatures even when confirmation times out; a stopping error retains available exact program logs/code/slot/fee, without fabricating an outcome for an unknown RPC result. Wallet-script verification and browser extension verification remain distinct.

## Funding and last verified step

Two faucet attempts returned no signature:

1. RPC request for 2 SOL: `Internal error`; balance remained 0.
2. Explicit Devnet CLI request for 1 SOL: `Error: airdrop request failed. This can happen when the rate limit is reached.`; exit 1.

These are faucet rejections before a returned signature, not simulated program failures or failed on-chain transactions. No fee or Explorer transaction link is claimed. [Funding observations](devnet-funding-attempts.json).

At the [readiness observation](devnet-release-readiness.json), payer balance was **0 lamports** and the new program was absent, with zero program-owned accounts and no configured organization. RPC rent estimates for the actual artifact were Program account **833,120**, ProgramData **2,352,837,560**, temporary write buffer **2,352,796,920 lamports**; fees and IDL-account funding are additional. These are account rent estimates, not an executed deployment's total charge.

The last verified release step is **source build, generated ABI parity, key public-key verification and Devnet genesis/account/balance/rent reads**. Deployment was not attempted with an unfunded payer. Neither a deploy key nor an authority key is missing now; Devnet SOL funding is missing.

## Core lifecycle results

| Step                                       | Current Devnet result                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Connect dedicated wallet / confirm cluster | Dedicated signer public key and Devnet genesis verified. Browser extension connection unverified. |
| Initialize/load treasury                   | Not reached: program absent.                                                                      |
| Fund treasury                              | Not reached; no verified Devnet mint or vault exists for this run.                                |
| Root → Research                            | Not reached.                                                                                      |
| Research → Data → Scraper                  | Not reached.                                                                                      |
| Valid Scraper spend                        | Not reached.                                                                                      |
| Revoke Research                            | Not reached.                                                                                      |
| Re-read descendants / effective authority  | Not reached.                                                                                      |
| Attempt descendant action                  | Not reached; no simulation-rejected or submitted-failed claim.                                    |
| Operations action                          | Not reached.                                                                                      |
| Root-only reclaim                          | Not reached.                                                                                      |

`npm run verify:devnet` stopped at the deployment gate with `Devnet program account not found`. It created no lifecycle keys, mint, organization or transactions. No Devnet core-flow success is claimed. All chain lifecycle invariants remain unverified on Devnet even when local-validator tests pass.

## Verification and files

| Check                                         | Result in this continuation                                                                                                                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source SBF build + Anchor IDL generation      | Passed; exact hash and byte count above.                                                                                                                                                                                                              |
| Cargo fmt / check / unit tests                | fmt/check passed; 16 passed, 0 failed.                                                                                                                                                                                                                |
| Fresh local-validator integration             | 64 passed, 0 failed: eight fresh Windows validator batches (48 Core + 16 Arena).                                                                                                                                                                      |
| Root TypeScript                               | Passed, including the modified lifecycle runner.                                                                                                                                                                                                      |
| Devnet client transport/binary unit tests     | 17 passed, 0 failed; RPC stubs, not Devnet transactions.                                                                                                                                                                                              |
| Existing UI unit tests                        | 15 passed, 0 failed.                                                                                                                                                                                                                                  |
| Frontend TypeScript / lint / production build | Passed; zero lint warnings; existing Story, Command and Arena routes exported.                                                                                                                                                                        |
| Production browser capital checks             | 111 passed, 0 failed, zero captured console errors, five widths.                                                                                                                                                                                      |
| Existing signature-motion checks              | 10 passed, 0 failed.                                                                                                                                                                                                                                  |
| Actual in-app browser checks                  | Observed DEMO simulation label; Devnet mode shows the new exact ID, official RPC and matching source ABI; actual absent-program message; disconnected wallet and missing Phantom feedback; zero warning/error logs. No wallet/RPC state was injected. |
| `npm run audit:devnet`                        | Exit 2: successful network/account audit, deployment absent.                                                                                                                                                                                          |
| `npm run verify:devnet`                       | Exit 2 at deployment gate; 0 lifecycle transactions.                                                                                                                                                                                                  |
| Secret scan / `git diff --check`              | Passed. Ignored environments, keys and compiled binaries excluded from staging.                                                                                                                                                                       |

Browser evidence was written to a fresh ignored directory: [capital assertions](../artifacts/devnet-release/browser/artifacts/final-finish/qa/results.json), [motion assertions](../artifacts/devnet-release/browser/artifacts/final-finish/qa/signature-motion.json). Actual signed browser pending, confirmation, approval rejection, timeout and on-chain program rejection remain unverified; the transport cases cover their handling with clearly labeled stubs.

Exact files changed since frozen `324fe7a` (32 files, including the original 24-file checkpoint):

```text
Anchor.toml
README.md
docs/DEPLOYMENT.md
docs/DEVNET-INTEGRATION.md
docs/DEVNET-RELEASE.md
docs/HANDOFF.md
docs/devnet-funding-attempts.json
docs/devnet-identity-audit.json
docs/devnet-integration-audit.json
docs/devnet-release-readiness.json
package.json
programs/mandateos/src/lib.rs
scripts/audit-devnet.mjs
scripts/build-program.mjs
scripts/build-source-windows.ps1
scripts/check-secrets.mjs
scripts/local-test.mjs
tests/devnet-client.ts
tests/devnet-flow.ts
web/.env.example
web/src/components/arena-world.tsx
web/src/components/command-world.tsx
web/src/components/console.tsx
web/src/components/world-shell.tsx
web/src/lib/solana/build-evidence.json
web/src/lib/solana/client.ts
web/src/lib/solana/deployment.ts
web/src/lib/solana/mandateos.json
web/src/lib/solana/program.ts
web/src/lib/solana/types.ts
web/src/lib/solana/wallet.ts
web/src/lib/use-console.ts
```

Only 16 of those files changed after `c48bbca`; the original 24 changes remain preserved. Story source/styles, routes, the frozen capital instrument/CSS, dependency locks and existing protocol/UI tests remain unchanged. The final local checkpoint commit is identified in the task's final response; no commit records private paths or key contents.

## Resume after funding

Keep the existing external program and payer keys; do not generate another identity. Local private paths are in ignored `artifacts/devnet-release/identity-local.json`. Recheck Devnet genesis, signer public keys, payer balance and artifact hash before deployment. Use explicit Devnet RPC, the exact program key, payer and initial upgrade authority, keep preflight enabled, and use an explicitly saved external buffer signer so failed deployment output cannot expose a generated recovery phrase. Never use `--skip-preflight` or `anchor keys sync`.

After deployment, compare ProgramData bytes to the recorded ELF and inspect actual upgrade authority and slot. The app imports its source-generated bundled IDL and verifies the binary; on-chain IDL publication is not required for Core verification and is excluded from the submission budget. If a published IDL exists, the audit must still check its ABI for a mismatch. Run `npm run audit:devnet` and `npm run verify:devnet -- --wallet <external-dedicated-test-wallet-path>`. Rebuild the static frontend and verify actual injected-wallet confirmations/rejections through the existing product. No hosting publication, x402, backend, mainnet operation or visual redesign was performed in this pass.

The read-only combined budget is reproducible with `node -r ts-node/register/transpile-only tests/devnet-budget.ts`. It checks Devnet genesis, the current binary hash, absent program/buffer accounts and confirmed balances, then queries rent and fees for unsigned deployment/Core messages. It does not read signer files, sign, simulate or submit. Controller funding in the lifecycle runner now covers each controller's account rent floor, its actual required fees and (Research/Data only) one child account rent, replacing fixed excess grants and implicit faucet requests. No protocol or frontend semantics changed.
