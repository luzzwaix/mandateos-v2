> Current result: Core and supported Arena settlement are finalized. See [Devnet MVP verification](DEVNET-MVP-VERIFICATION.md) and its real receipts. Browser signing/public-access gates are tracked there. The following text preserves the earlier phase; incomplete-Core statements below are historical.

# Sequential resume with identical-byte forwarding — 6 October 2026

**Upload and deployment succeeded.** Executable Program, ProgramData, upgrade authority and full ELF parity were independently verified at finalized commitment. Core reached Research revoke, then stopped; Operations action and reclaim remain unverified. The previous [stopped uploader report](DEVNET-SEQUENTIAL-UPLOAD.md) remains a historical record, including its unconfirmed submission. The user subsequently authorized the specific expired-offset replacement below and identical-byte forwarding while a blockhash remains valid.

Branch and starting HEAD: `devnet-integration`, `f5b7965dbac9f4b634bfb5eccc6b146046218f68`. Existing user changes remain preserved. Program ID, program/payer/buffer keys, buffer authority and Rust source were not changed. No new Devnet buffer was created or explicitly closed. No SOL transfer was requested or performed.

## Resolve previous offset before any new signature

Saved offset **52,624**, signature:

```text
fWBYZjYea3wou35CfX6nQLJUwVZP1EYu1YzprERXVCEX4AHejWeQoAwijFQpoafzxNWEFskubxXrXAKa4DScdYi
```

Saved blockhash `97S34Rit2bVkwrRvxFeUm8Q357ADL6kRvRnQdtrkGYAa`, last valid block height **495338674**.

Initial read-only resolution at **12:56:16 UTC**, explicit endpoint `https://api.devnet.solana.com`, verified Devnet genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`:

- `getSignatureStatuses(searchTransactionHistory=true)` returned `null`, status context slot **508099934**; `getTransaction` returned `null`.
- Confirmed block height **495341395** and finalized block height **495341397** exceeded the saved last valid height.
- Full buffer and the exact `[52661, 53673)` account-data range were read with **finalized** commitment. Slice slot **508099937**, length **1,012**: all zero, not equal to the expected chunk. The full-buffer/slice bytes agreed; metadata retained authority **3ws8…** and the existing deposit.
- Thus the previous submission is expired and unconfirmed. It is not a confirmed failed-on-chain transaction and has no observed receipt/fee. No attempt was made to forward an expired packet or relabel it as confirmed.

[Read-only resolution and saved original intent](../artifacts/devnet-release/sequential-uploader/pending-resolution.json). These conditions were repeated immediately before signing in the new uploader; [second audit](../artifacts/devnet-release/sequential-uploader/v2/old-pending-resolution-v2.json).

## Temporary uploader v2 and local checks

Temporary code/evidence remains under ignored `artifacts/devnet-release/sequential-uploader/v2`, outside product sources. The original uploader and journals remain preserved. Agave CLI **2.3.0**, its source-verified loader-v3 **5.0.0** serializer and **1,012-byte** chunk partition remain unchanged. Local artifact remains **462,984 bytes**, SHA256:

```text
ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35
```

Every HTTP RPC request shares one serial limiter configured for **750 ms** spacing; observed minimum was **749 ms**, a 1 ms scheduling variance. Retry-After is honored and raw errors retained. Each chunk gets one signed transaction; the public signed wire is saved durably for recovery. Retries verify the same wire SHA256/signature/blockhash, check history/status, check current block height and offset bytes, and resend only the identical packet while valid. Preflight remains enabled. There is no signing call in the resend branch. Unexpected nonzero bytes or a new unresolved expiry stop the process without creating another signature. The specifically authorized old offset 52,624 receives one fresh replacement after the expired/null/finalized-zero gate; no blanket blind re-sign policy was enabled.

The [official Solana retry guidance](https://solana.com/developers/cookbook/transactions/retry) documents client rebroadcasting of a signed transaction and expiration checks before re-signing. This implementation retains preflight rather than copying the documentation's skip-preflight example.

Fresh **Agave 2.3.0 local validator: 15 passed, 0 failed** before Devnet signing. Besides actual loader writes and serialization, tests covered dropped-first-forwarding recovery using two identical packets with one signing intent, lost-response recovery, expiration/history/finalized-zero replacement gate, rejection of unexpected nonzero finalized bytes, final 500-byte chunk, matching prefix preservation, and RPC pacing/Retry-After/raw errors. Local test identities were temporary in-memory identities and did not replace any Devnet signer. Validator was stopped. [Local validation](../artifacts/devnet-release/sequential-uploader/v2/local-validation-v2.json).

## Observed resumed writes

Fresh replacement for offset **52,624** confirmed at slot **508100927**:

[5xKVWoi52xiBcKWFHSsuUX8czGf4ohWfgy4VSZUawKFnoJdjTbi6aDhm159fWX3392VSsMgyUoFk1ChdVZTV4AL2](https://explorer.solana.com/tx/5xKVWoi52xiBcKWFHSsuUX8czGf4ohWfgy4VSZUawKFnoJdjTbi6aDhm159fWX3392VSsMgyUoFk1ChdVZTV4AL2?cluster=devnet).

A real identical-byte resend at offset **141,680** finalized at slot **508102497**:

[4q2iWUq7N8xqUBVYRdrt65TsDpuLP2myP4zPDTdswd5jkJSuLrBJucEv8fZzWsGo7jxJpJdxVAxXyJQHnPRZ1Q4P](https://explorer.solana.com/tx/4q2iWUq7N8xqUBVYRdrt65TsDpuLP2myP4zPDTdswd5jkJSuLrBJucEv8fZzWsGo7jxJpJdxVAxXyJQHnPRZ1Q4P?cluster=devnet). Exactly one signing intent exists for that signature; before resend, the journal records status, still-valid height and offset bytes. It was not signed again.

## Completed upload and final hash gate

**406 unique signing intents, 406 finalized new writes**, preserving earlier records. Complete audit: **459 finalized transactions (init + 458 writes)**. Five sends repeated identical signed bytes with the same signature and one signing intent each. Sampled receipts charged 5,000 lamports once per unique write; new write balance delta was 2,030,000 lamports. Raw uploader RPC errors: **0**. The earlier expired signature remains absent, not a confirmed failed transaction.

Full **462,984-byte** finalized payload at slots **508107625** and **508107725** exactly matched the local ELF and SHA256 above. [Complete buffer audit](../artifacts/devnet-release/sequential-uploader/v2/complete-upload-audit.json), [all 406 new finalized signatures and Explorer links](../artifacts/devnet-release/sequential-uploader/v2/all-confirmed-writes.md). Original signature/blockhash/wire evidence and old finalized writes were retained.

## Final deployment — invoked once

Only after full hash equality, CLI 2.3.0 deployed from the existing buffer with **no positional ELF path**, explicit Devnet endpoint, preflight, max-sign-attempts 1 and unchanged existing signers. The unique invocation marker remains. No additional upload, buffer creation or explicit close was performed. The loader consumed the existing buffer deposit into ProgramData; the old buffer is now absent as the normal deployment result.

[Confirmed/finalized deploy signature](https://explorer.solana.com/tx/7aVaURGC1D5pZbEKur2kna8Jxogfz7e2JxsyBdSUWRGp2WSECujNA58yhVqwsreRxfYGc72NibScYwQ1AYfH55B?cluster=devnet), slot **508107891**, fee **10000 lamports**, err null.

Finalized read at slot **508107951** independently verified:

- Program **125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd**, executable true, loader-v3 owner, state tag 2.
- Canonical ProgramData **5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2**, state tag 3, deployed slot matching the receipt.
- Actual upgrade authority and fee payer **3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm** unchanged.
- Deployed bytes exactly equal local ELF; deployed SHA256 **ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35**.
- Source-generated bundled IDL equals build IDL and contains the same Program ID. App uses bundled IDL; no on-chain IDL publication was needed or performed.
- Rent deposits: Program **833,120**, ProgramData **2,352,837,560**, total **2,353,670,680 lamports**. Payer post-deploy balance **44,019,320 lamports** at slot 508107953.

[Full independent deployment verification](../artifacts/devnet-release/sequential-uploader/v2/deployment-verification.json), [exact once-only invocation/preflight](../artifacts/devnet-release/sequential-uploader/v2/final-deploy-preflight.json), [CLI output](../artifacts/devnet-release/sequential-uploader/v2/final-deploy-cli.log).

## Core result and stopping condition

[Core report](DEVNET-CORE-PARTIAL.md) contains every observed signature, final state and exact fresh diagnostic simulation. Ten Core transactions finalized through Research revoke. The next assertion stopped the runner; no further transaction was submitted after stopping. Original rejection was masked by an assertion before evidence capture and is not recoverable. A read-only reproduction establishes Scraper is at rent floor and its next 5,000-lamport fee fails admission. A clearly separate unsigned treasury-fee-payer simulation returns **AncestorRevoked / 6003** without submission, signature or charged fee.

Operations remains active in observed account state; its valid action and Root reclaim have **not** been executed. Full wallet lifecycle, browser extension signing and Arena settlement remain unverified. No x402. No Rust, keys, Program ID, authority or frontend design changes.

## Local repairs and checks

The Core budget now retains one simulated-spend fee above rent floor for Scraper; it is reported as spendable headroom, neither charged fee nor rent. Error evidence is saved before asserting the exact expected program code. The temporary Core wrapper now patches both installed web3 copies (root and frontend) into its single paced RPC transport; its four mock checks use no network/signature/submission. These fixes were not used to rerun Core or redeploy.

Fresh uploader local-validator checks **15 passed / 0 failed**. Budget tests **2 passed / 0 failed**, Devnet client stub tests **17 passed / 0 failed**, authority UI tests **15 passed / 0 failed**. Root TypeScript passed. Frontend lint (zero warnings), TypeScript and production build passed. Secret scan covered 159 release files with zero findings; git diff --check passed. Rust build/test and browser wallet verification are not claimed as newly run in this continuation. Existing ELF remained unchanged.

Branch/start/end HEAD: **devnet-integration**, **f5b7965dbac9f4b634bfb5eccc6b146046218f68**. No new commit, push, merge, reset or branch switch. Existing dirty work remains preserved.
