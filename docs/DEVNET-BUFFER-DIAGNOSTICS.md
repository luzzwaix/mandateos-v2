# Existing Devnet buffer — read-only diagnosis and unexecuted continuation

No deployment, write, buffer creation/close, signature, transfer or configuration change was performed during this diagnosis. Only read-only RPC methods were allowed by the diagnostic script. No signer file was read. The existing branch/checkpoints/user work are preserved.

## Observed account and bytes

RPC `https://api.devnet.solana.com`, commitment `confirmed`, verified Devnet genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. RPC reports `solana-core: 4.4.0-beta.0`. Diagnosis completed **2026-10-06 12:09:22 UTC**; initial account/balance read slot **508088047**, transaction-status read **508088053**, final account byte/balance equality check **508088165**.

| Property                                                             | Observed result                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| Buffer                                                               | `3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE`         |
| Owner                                                                | `BPFLoaderUpgradeab1e11111111111111111111111`          |
| State                                                                | Upgradeable-loader `Buffer`, tag 1, non-executable     |
| Authority                                                            | `Some(3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm)`   |
| Balance                                                              | 2,352,837,560 lamports / **2.352837560 SOL**           |
| Account length                                                       | 463,021 bytes: 37-byte metadata + 462,984-byte payload |
| Payer balance                                                        | 47,072,440 lamports / **0.047072440 SOL**              |
| Program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`               | Absent                                                 |
| Canonical ProgramData `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2` | Absent                                                 |

Current `target/deploy/mandateos.so` remains **462,984 bytes**, matching the source-build manifest, SHA256:

```text
ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35
```

Current public buffer payload SHA256:

```text
e824fe9e8a917078d9c3b55b37375c6259119a4f5b8e4eeab09fb0ff8b115811
```

The payload is incomplete, so the full hashes differ. The first **16,192 bytes** match exactly. Receipt decoding proves sixteen contiguous successful 1,012-byte writes at offsets `0, 1012, 2024, 3036, 4048, 5060, 6072, 7084, 8096, 9108, 10120, 11132, 12144, 13156, 14168, 15180`. Every write's payload matches both the ELF at that offset and the observed buffer. The remaining tail is all zero; equal zero bytes there must not be counted as written program bytes.

**Exact next program-relative write offset: 16,192.** The absolute account-data offset is **16,229** after the 37-byte buffer header. The next payload is ELF bytes `[16192, 17204)`, length 1,012. There are **442 missing chunks**, **446,792 bytes**, ending with offset **462,484**, length **500**. These offsets assume the preserved same payer/authority and no compute-unit-price instruction. Neither CLI command provides a manual `--offset` option; it recomputes the comparison and skips matching chunks.

## All discoverable write transaction statuses

The complete returned buffer address history contains **17 transactions**: one initialization and **16 writes**. `getSignatureStatuses(searchTransactionHistory=true)` and all seventeen `getTransaction` receipts were fetched, with pacing. All are **finalized**, transaction `err=null`. Each write fee is **5,000 lamports**; initialization fee **10,000**; verified sum **90,000 lamports**. This reconciles the transfer, buffer deposit and remaining payer balance exactly.

[All 16 write signatures, offsets and statuses](../artifacts/devnet-release/buffer-diagnostics/write-status-table.md). [Full public RPC report and receipts](../artifacts/devnet-release/buffer-diagnostics/report.json).

No signatures for the remaining 442 planned writes were recorded in CLI output. They are not present as confirmed transactions in the returned history and their target bytes are not written. This does **not** determine whether each was never submitted, rejected before submission, dropped, expired or otherwise unconfirmed. Their individual submission/error status cannot be reconstructed without the original signatures or transport logs. No failed-on-chain transaction is inferred from the generic CLI error.

## Installed CLI, help and exact-version source

Installed executable: `%LOCALAPPDATA%\MandateOS\toolchains\solana-release\bin\solana.exe`.

```text
solana-cli 2.3.0 (src:a2e21dda; feat:3640012085, client:Agave)
channel: v2.3.0
commit: a2e21dda295b18dd09ac06542834c5e9b1b2dc84
target: x86_64-pc-windows-msvc
executable SHA256: faad5d7f2cba5edffec9c891bb1579a681b9436f272f489b3e19c4eaf3811fd1
```

`program deploy --help` and `program write-buffer --help` were run safely and saved in ignored diagnosis artifacts. Both accept `--use-rpc`, `--buffer`, explicit signer roles and `--max-sign-attempts`. Write-buffer has `--buffer-authority`; deploy has `--upgrade-authority` and `--program-id`. Deploy's positional ELF path is optional; write-buffer's is required. Default signing rounds are five; the failed attempt explicitly selected one.

The public source at the installed commit was downloaded and checked byte-identical to the v2.3.0 tag. [CLI program implementation](https://github.com/anza-xyz/agave/blob/a2e21dda295b18dd09ac06542834c5e9b1b2dc84/cli/src/program.rs) confirms existing-buffer layout/owner/authority checks, chunk comparison, existing-buffer public-key support and deployment without an ELF pathname. Exact-commit `tpu-client/src/tpu_client.rs` sets `DEFAULT_TPU_ENABLE_UDP = false`; `cli/src/main.rs` therefore defaults to the QUIC code branch. The original attempt's `--use-rpc` selected HTTP RPC sending in that default branch; no flag/endpoint incompatibility was found. Explicit `--use-quic --use-rpc` makes the same selection with no TPU client. Despite the flag name, selecting that branch with `--use-rpc` does not send these writes over QUIC. The UDP branch does not implement the same RPC selection.

The current HTTPS endpoint is the [documented Devnet JSON-RPC endpoint](https://solana.com/docs/references/clusters), compatible with RPC sending. The already confirmed initialization/writes show this endpoint/CLI combination accepted loader-v3 transactions during the authorized attempt. This read-only diagnosis cannot test fresh `sendTransaction` acceptance or guarantee throughput. Public limits are documented as 100 requests/10 seconds/IP and 40 requests/10 seconds/IP for one method, subject to change. The CLI sender schedules writes 10 ms apart and exposes no write-rate/concurrency flag in either inspected help.

The [exact sender implementation](https://github.com/anza-xyz/agave/blob/a2e21dda295b18dd09ac06542834c5e9b1b2dc84/client/src/send_and_confirm_transactions_in_parallel.rs) returns `Max retries exceeded` when unconfirmed entries remain after the configured signing rounds. The attempt used one round. The sole actual deploy-log error is:

```text
Data writes to account failed: Custom error: Max retries exceeded
```

There is no 429 in that deploy log. A later read-only receipt fetch received 429. Public-RPC burst limits are a continuation risk, **not an established cause of the deployment failure**. The diagnosis successfully obtained all seventeen receipts using 1.5-second spacing.

## Supported continuation — prepared only, not executed

This is a source/help-verified CLI procedure, not a successfully executed recovery. It requires separate authorization to send. Recheck genesis, buffer owner/state/authority/deposit, exact ELF hash, payer balance and program absence immediately before any action. For dependable bulk CLI upload, use a Devnet RPC with verified capacity for this sender or a separately reviewed sequential uploader paced to the current public endpoint. Increasing signing rounds alone does not control request rate. No alternate endpoint or sequential signing worker was introduced in this diagnosis.

From the existing repository, resolve the existing dedicated payer/program paths from ignored public metadata. The buffer is passed as its **public address**, so these commands do not have its account-creation signer; a missing buffer must stop the process. Do not omit these identity arguments.

**Stage 1: write only the missing data into this existing buffer. This template retains the current endpoint; its burst/rate risk remains. Do not run it blindly against the same public endpoint.**

```powershell
$releaseIdentity = Get-Content artifacts/devnet-release/identity-local.json -Raw | ConvertFrom-Json
$cli = "$env:LOCALAPPDATA\MandateOS\toolchains\solana-release\bin\solana.exe"
& $cli program write-buffer (Join-Path (Get-Location) 'target\deploy\mandateos.so') `
  --url https://api.devnet.solana.com --commitment confirmed `
  --keypair $releaseIdentity.files.payer --fee-payer $releaseIdentity.files.payer `
  --buffer 3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE `
  --buffer-authority $releaseIdentity.files.payer `
  --max-len 462984 --max-sign-attempts 1 --use-quic --use-rpc
```

The existing buffer is fetched and matching chunks are skipped. No initial allocation or rent top-up is needed for its present state. No new buffer/authority is intended. A write-buffer success message is not sufficient: re-fetch all public payload bytes and require **exact length and full SHA256 equality** with the frozen ELF. On error or mismatch, stop and inspect returned signatures/state; no automatic second invocation.

**Stage 2, only after full equality and a fresh absence check: final deployment from the completed existing buffer, with no positional ELF path.**

```powershell
& $cli program deploy `
  --url https://api.devnet.solana.com --commitment confirmed `
  --keypair $releaseIdentity.files.payer --fee-payer $releaseIdentity.files.payer `
  --buffer 3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE `
  --program-id $releaseIdentity.files.program `
  --upgrade-authority $releaseIdentity.files.payer `
  --max-len 462984 --max-sign-attempts 1 --use-quic --use-rpc
```

With no ELF pathname and a verified existing buffer, source selects buffer bytes, verifies the ELF, constructs no upload messages and performs the final deploy. This preserves Program ID **125Z…** and fee payer/initial upgrade authority **3ws8…**. The loader's successful final deployment drains/consumes the buffer deposit to fund ProgramData and clears the buffer balance; therefore this final action also requires authorization to consume the existing buffer. No separate `program close` action is needed or proposed.

After that future confirmed final transaction, re-read executable Program, canonical ProgramData, deployed SHA256 and actual upgrade authority before allowing Core lifecycle transactions. Neither stage was executed here.

## Cost and risks

Fresh unsigned-message quotes at slot **508088969**: missing write fee 5,000; final deploy fee 10,000 lamports. Rent reads were bracketed by slots **508088967–508088968**: Program 833,120; ProgramData 2,352,837,560; buffer minimum 2,352,796,920. Existing buffer already covers ProgramData's rent; top-up is **zero**.

One successful continuation costs **442 × 5,000 + 10,000 + 833,120 = 3,053,120 lamports (0.003053120 SOL)** beyond the existing buffer deposit. Current payer covers this and the previously quoted Core budget 16,905,200 lamports, leaving an estimated **27,114,120 lamports** after both. These are estimates, not observed future balances; new fees/priority price/signing rounds may change them.

- Public RPC bursts, service outages and status-query lag can leave writes unconfirmed again. No throughput guarantee was verified.
- One signing round does not re-sign after expiration. Increasing it permits new signatures/re-sends and extra fees; do not infer success from a submission response or repeat automatically after error.
- The 442 missing writes have no recoverable original signatures. Their old individual outcomes remain unknown; re-read bytes and signature history before choosing work to send.
- Current buffer is incomplete and must not be finalized. Full hash equality is a required gate; future ELF/authority/buffer changes invalidate this diagnosis.
- Priority-fee instructions or a different payer/authority change message size/chunk boundaries and costs. Preserve roles and omit the compute-unit-price flag, including an explicit zero, for the recorded offsets.
- CLI defaults can choose another network or random identities when required arguments are omitted. Keep explicit Devnet URL, existing buffer address, exact program signer and 3ws8… role arguments.
- Final loader deployment consumes the buffer deposit; it is not a read-only continuation. Runtime ELF/feature verification and the final transaction still have to pass. Deployed authority, Core lifecycle and Arena settlement remain unverified.

Read-only reproduction: `node scripts/diagnose-devnet-buffer.mjs`. This script audits/allowlists RPC methods and paces individual receipt reads; its only writes are public local evidence files. No deployment/continuation command is invoked by it.
