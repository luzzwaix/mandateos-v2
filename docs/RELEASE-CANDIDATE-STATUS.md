# Historical release candidate report — 7 October 2026

Archived results for `80db089`; this is not the overnight release verdict. See [current release procedure](OVERNIGHT-RELEASE.md) and the generated root morning handoff for the final candidate, preview, access and fresh checks. The latest user release authorization supersedes this report's old publication/gate instructions.

7 October 2026. Artifact verification timestamp: `2026-10-06T19:29:09.167Z`.
Scope: the existing Devnet frontend candidate, before publication and genuine Phantom QA. No features, UI, Rust semantics, keys, authority, Program ID or deployment changed. No transactions, wallet approvals, push, merge or history rewrite performed.

## A. Fresh IDL result — PASS

The previously blocked native IDL generation was invoked first, using pinned Anchor CLI **0.32.1** and Rust **1.89.0 GNU**:

```powershell
anchor idl build -p mandateos -o target/release-candidate-20261007-80db089/mandateos.json
```

Exit **0**; native test-profile invocation completed in **2.09 s**, using its existing dependency cache. Anchor generated a new IDL file from the unchanged repository program; no copied-schema fallback was used. The earlier isolated validator run and its artifacts were preserved.

The output path did not exist before this run. Neither `target/idl/mandateos.json` nor the tracked frontend IDL was overwritten.

## B. Fresh SBF result — PASS

Pinned **platform-tools v1.52**, compiler `rustc 1.89.0-dev`, locked Cargo dependencies. A separate initially empty SBF target cache was used; the program and dependencies were compiled again. Successful compile duration: **4m 40s**. Exit **0**, including the repository-prescribed `llvm-objcopy --strip-all` step.

```powershell
# Existing pinned platform cargo; existing MSVC/SDK process environment.
# CARGO_TARGET_DIR = target/release-candidate-20261007-80db089/sbf-fresh
# CARGO_TARGET_SBF_SOLANA_SOLANA_RUSTFLAGS = -Zremap-cwd-prefix=
& "$env:USERPROFILE/.cache/solana/v1.52/platform-tools/rust/bin/cargo.exe" build --release --target sbf-solana-solana --locked --manifest-path programs/mandateos/Cargo.toml
# Strip into the NEW release-candidate output, not target/deploy/mandateos.so.
```

Fresh ELF: `target/release-candidate-20261007-80db089/mandateos.so`.

- ELF magic verified; **462984 bytes**.
- SHA256: **`ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35`**.
- Exact byte equality with existing `target/deploy/mandateos.so` and the candidate's tracked build-evidence hash/size.
- Existing deployment ELF was preserved. No deploy-key file was generated: direct compiler/strip commands avoid the key-generating Agave/Anchor SBF wrapper.

The first fresh SBF invocation could not find the already-installed MSVC `link.exe`. Configuring the existing compiler's process-local PATH/LIB as prescribed by the repository resolved it; no source, tool installation or persistent configuration changed. Both attempts' logs were retained in the ignored output directory.

## C. Program / IDL parity — PASS

Unchanged Program ID: **`125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`**.

Rust `declare_id!`, both Anchor program mappings, fresh IDL address, candidate IDL, tracked build evidence and the local public frontend configuration agree. Full parsed JSON equality was checked against both existing generated IDL and the IDL actually imported by `web/src/lib/solana/program.ts`:

- **9 instructions**, including their arguments, account order, signer/writable flags and PDA definitions.
- **4 account types**, their discriminators/layout types; **15 types**, **9 events**, **17 errors**.
- Semantic/schema diff: **empty**. No tracked generated artifact changed.

Fresh/generated JSON SHA256: `6907e53bec53e21da8972a9abad75e6b0b49cde4bc323718199afa3cacd239d8`.
Tracked frontend JSON SHA256: `1745f85676c40f4caa1d4673601d9a1547e33d703760e8c961b0035ddacab7da`.
These raw-file hashes differ because of JSON formatting; complete parsed content is identical. No synchronization/overwrite was needed.

Frontend remains Devnet-only: RPC `https://api.devnet.solana.com`, expected Devnet genesis, local disposable signing disabled. No private key file was read. Upgrade authority remains the previously verified `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`; no authority command was invoked. This build-only pass does not claim a new live-network reconciliation.

## D. Production checks — PASS

| Command/check                    | Result                                                                   |
| -------------------------------- | ------------------------------------------------------------------------ |
| `npm --prefix web run lint`      | Exit 0; zero ESLint warnings                                             |
| `npm run typecheck`              | Exit 0                                                                   |
| `npm --prefix web run typecheck` | Exit 0                                                                   |
| `npm --prefix web run build`     | Exit 0; static export completed                                          |
| `git diff --check`               | Exit 0                                                                   |
| `npm run check:secrets`          | Exit 0; no recognized secret/environment/build material in release files |

Fresh `web/out/index.html`, `app.html`, `arena.html` are present and nonempty. Static routes `/`, `/app`, `/arena` exported. Build emitted the existing optional bigint native-binding warning and successfully used the pure-JS fallback; it is not a compilation failure.

Expensive unit/validator/browser suites were not repeated: program source, frontend source, complete IDL content and ELF bytes are unchanged. Their exact previous results and limitations remain in [FINAL-ADVERSARIAL-QA.md](FINAL-ADVERSARIAL-QA.md). This report does not relabel those earlier executions as fresh tests.

Disk: **6,794,862,592 bytes free on C:** at initial verification; **6,929,854,464 bytes** at artifact verification. No cache or user-file deletion was required or performed.

## E. Exact HEAD

Branch: **`devnet-integration`**.

HEAD, unchanged: **`80db0898b949056e6a97beebde5a47c5aaa446f1`**.

This is the exact source checkpoint for the release candidate. No new commit was made in this build-only pass.

## F. Exact Git status

Initial `git status --porcelain=v1`: **empty**, clean working tree.

Final status after writing this report:

```text
?? docs/RELEASE-CANDIDATE-STATUS.md
```

No staged changes or modifications to tracked files. Compiler outputs, logs and parity verification files remain in ignored `target/release-candidate-20261007-80db089/`. No ignored environment, keys or generated private material is staged.

## G. Publication decision

**READY for publication of this Devnet frontend candidate, after explicit owner approval.** The disk-related build gate is closed; no Solana deployment is necessary. This decision is not a claim that genuine browser signing has passed, that all submission criteria are complete, or that Mainnet/security readiness is established.

Publish only the existing `web/` frontend to its existing Vercel project. The public site still serves the prior frontend until that action is authorized and executed. No publication or push was performed here.

The previously reported **5 high / 7 moderate dependency advisories** and four pre-existing formatting findings were not changed or re-audited. They remain documented limitations; this pass is solely the fresh compilation/parity/build release gate.

## H. Remaining gates before genuine Phantom lifecycle

1. Owner approval for frontend publication; verify the deployed candidate opens anonymously and still uses the verified Devnet Program ID/configuration.
2. An extension-enabled Chrome with the owner's separate Devnet Phantom wallet, then explicitly authorized approvals. Existing headless/public-adapter checks do not establish real extension signing or its connect performance.
3. A new isolated owner-controlled organization, reviewed PDAs/amounts and sufficient Devnet SOL/test tokens for its actions. The C7j wallet does not control the historical fixture. Present exact action, destination, fees and state change before each approval; preserve old receipts and reconcile unknown signatures before any retry.

Then execute the supported Core/Arena UI lifecycle and capture real receipts. Native 200% zoom and encrypted recovery-backup verification remain separate outstanding QA/operational checks from the previous report; neither was silently marked complete. No additional feature or polish pass is needed before public/browser QA.
