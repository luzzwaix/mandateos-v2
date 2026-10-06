# Authorized existing-buffer continuation — stopped, 6 October 2026

The user authorized one continuation through the exact commands prepared in `DEVNET-BUFFER-DIAGNOSTICS.md`. Only the **write-buffer stage** was invoked. It again exited with code **1**; the final deploy was **not invoked**. No new buffer, buffer-close operation, replacement identity, authority change, Rust change or Core transaction was performed.

## Fresh preflight and exact invocation

Preflight completed **12:20:40 UTC**, explicit RPC `https://api.devnet.solana.com`, commitment `confirmed`; Devnet genesis matched `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.

- Program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd` and canonical ProgramData were absent at slot **508090999**.
- Existing buffer `3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE` had loader-v3 owner, Buffer state and authority `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`; deposit **2,352,837,560 lamports**.
- Payer balance **47,072,440 lamports**, slot **508091000**, covered the calculated remainder and Core budget.
- Local ELF remained **462,984 bytes**, SHA256 `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35`; existing payer/program signer public keys were independently verified via CLI address output, with no secret output.
- Installed CLI remained **2.3.0**, source `a2e21dda`.
- Buffer still had 16 matching chunks; first missing program-relative offset **16,192**.

This exact prepared command ran once, starting **12:20:54 UTC**, ending **12:22:16 UTC**:

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

Preflight was enabled, no priority-fee flag was added, and the buffer was its existing public address rather than a new account signer. A local public attempt marker prevents blindly repeating this invocation. Actual CLI log:

```text
Error: Data writes to account failed: Custom error: Max retries exceeded
```

The log contains no 429. A precise HTTP/network cause is not established. This generic CLI failure is not a confirmed failed on-chain transaction and returned no completion signature.

## Confirmed progress and final read-only gate

After the CLI error, all actions were read-only. Diagnosis completed **12:24:18 UTC**. Buffer/program state was read at slot **508091624**, payer balance at **508091625**, transaction statuses at **508091630**. Final read at **508091916** verified unchanged buffer bytes and deposit during the diagnosis.

| Property                               | Actual result                                              |
| -------------------------------------- | ---------------------------------------------------------- |
| Existing buffer                        | Preserved, loader-v3 Buffer, non-executable                |
| Authority                              | Still `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm`       |
| Buffer balance                         | **2.352837560 SOL**                                        |
| Payer balance                          | **0.046972440 SOL**                                        |
| Program / ProgramData                  | Both absent                                                |
| New writes from this invocation        | **20**, all finalized, transaction `err=null`              |
| Fees for these new writes              | **100,000 lamports / 0.000100000 SOL**                     |
| All buffer transactions                | **37 finalized successes**: one initialization + 36 writes |
| Verified cumulative fees               | **190,000 lamports**                                       |
| Payload matching contiguous ELF prefix | **36,432 bytes**, 36 complete 1,012-byte chunks            |
| Missing payload                        | **426,552 bytes**, 422 chunks                              |
| Next program-relative offset           | **36,432**                                                 |
| Next absolute account-data offset      | **36,469**                                                 |

Every observed write payload was decoded and checked against both the local ELF and current buffer bytes. The new writes cover offsets **16,192–35,420**, each length 1,012, with no rewrites of the sixteen previously confirmed chunks. Full payload SHA256 is now:

```text
f19f5c82de77a5d77f92418cf34b4734bbf14590bcecade507ca2649783b6638
```

It does **not** match the required `ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35`. The user's full-hash gate therefore failed, in addition to the CLI error. Final deploy was not attempted; executable Program, deployed ProgramData and actual deployed upgrade authority remain unverified. The stored buffer authority is verified separately.

[All twenty new real signatures, slots, finalized statuses, fees and offsets](../artifacts/devnet-release/buffer-resume-diagnostics/new-write-statuses.md). [Machine-readable new receipts](../artifacts/devnet-release/buffer-resume-diagnostics/new-write-statuses.json). [All thirty-seven RPC receipts and byte comparison](../artifacts/devnet-release/buffer-resume-diagnostics/report.json).

The first new write was [2ung2uPxrfvQSBmkhUQr1pNuMmZsv3xzkNshMG86ADB9mmejJbj7qT5reQhwKasRVLDUNviLpJuaMdbGXeFtZCrx](https://explorer.solana.com/tx/2ung2uPxrfvQSBmkhUQr1pNuMmZsv3xzkNshMG86ADB9mmejJbj7qT5reQhwKasRVLDUNviLpJuaMdbGXeFtZCrx?cluster=devnet), finalized at slot **508091080**. The final new write by offset was [2AbTWd69FCqYu563RKfHXhRQbqsa77EbMQLYWUyKFBbGHYwqrw9oqYAeV6Ca5wBVD2M2J6gknVxHtp49pELDFFRB](https://explorer.solana.com/tx/2AbTWd69FCqYu563RKfHXhRQbqsa77EbMQLYWUyKFBbGHYwqrw9oqYAeV6Ca5wBVD2M2J6gknVxHtp49pELDFFRB?cluster=devnet), finalized at slot **508091081**.

No original signatures are available for the remaining missing planned writes. Their individual submission/error outcomes are unknown; no simulation rejection or failed-on-chain result is fabricated. No completion or final-deployment signature exists from this continuation.

## Preservation and limits

Branch remains `devnet-integration`, HEAD `f5b7965dbac9f4b634bfb5eccc6b146046218f68`. Existing work is preserved, with no commit/reset/switch/push/merge. The diagnostic helper now accepts a constrained public `--output-dir` so previous evidence is retained rather than overwritten. This is a local evidence-output change, not a protocol or wallet change. New evidence is under ignored `artifacts/devnet-release/buffer-resume-diagnostics`; private signer material remains outside Git.

Syntax check, formatting, secret scan and `git diff --check` passed. No Rust/Anchor/frontend build or validator test suite was rerun for this upload-only attempt. Core lifecycle, injected-browser wallet flow, Arena settlement and submission video remain unverified. Sending stopped at the first write-buffer error; no new transaction is proposed as part of this stopped attempt.
