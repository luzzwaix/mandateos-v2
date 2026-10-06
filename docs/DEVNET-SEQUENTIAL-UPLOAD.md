# Existing-buffer sequential upload — 6 October 2026

The user authorized a temporary sequential uploader on the public Devnet endpoint after confirming that no dedicated RPC exists. This supersedes the previous dedicated-RPC prerequisite. No bulk CLI `write-buffer`, replacement ID, new Devnet buffer, close, Rust edit, wallet rotation or transfer was performed.

**Result: 16 additional writes finalized; the next submitted signature did not confirm and its blockhash expired. The uploader stopped without resubmission/re-signing. Full payload hash still differs, so final deploy was not invoked. Program/ProgramData and Core remain unverified.**

Branch and both starting/ending HEAD: `devnet-integration`, `f5b7965dbac9f4b634bfb5eccc6b146046218f68`. Existing dirty integration work was preserved; no new commit, reset, branch switch, push or merge occurred.

## Verified identities and initial state

Endpoint `https://api.devnet.solana.com`, commitment `confirmed`, genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`.

| Role                                    | Exact address                                  |
| --------------------------------------- | ---------------------------------------------- |
| Intended Program ID                     | `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd` |
| Fee payer and existing buffer authority | `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm` |
| Existing buffer                         | `3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE` |
| Canonical ProgramData, currently absent | `5n3oHHm4RxzchLBpcM3MXZG4WeQdAkGf6mEQourVw9J2` |

3ws8… remains the intended initial upgrade authority; there is no deployed ProgramData authority yet. The existing external signer was loaded only inside the authorized signing process and its computed public key was checked against 3ws8…. No signer contents were logged, copied, changed or committed.

Initial read-only check at slot **508096256**: loader owner, Buffer tag 1, authority Some(3ws8…), non-executable, length 463,021. First **36,432 bytes** exactly matched the current ELF; remaining tail was entirely zero. Payer balance **46,972,440 lamports** at slot **508096259**. Program and ProgramData absent at **508096261**. These checks were repeated immediately before signing at slots **508096757–508096763**.

ELF `target/deploy/mandateos.so`: **462,984 bytes**, unchanged SHA256:

```text
ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35
```

## Exact installed-version serialization and local validation

Installed `solana-cli 2.3.0`, commit `a2e21dda295b18dd09ac06542834c5e9b1b2dc84`. Its [program implementation](https://github.com/anza-xyz/agave/blob/a2e21dda295b18dd09ac06542834c5e9b1b2dc84/cli/src/program.rs) and [Cargo.lock](https://github.com/anza-xyz/agave/blob/a2e21dda295b18dd09ac06542834c5e9b1b2dc84/Cargo.lock) were inspected. CLI depends on loader-v3-interface **5.0.0**. Its published crate was downloaded as public evidence and checked against lockfile checksum `6f7162a05b8b0773156b443bccd674ea78bb9aa406325b467ea78c06c99a63a2` before inspecting the actual instruction/state source.

Write bincode: u32-LE tag 1, u32-LE program-relative offset, u64-LE vector length, payload. Accounts: writable non-signer buffer, readonly signer authority. Payer is the same authority; no compute-budget/priority-price instructions. Empty signed transaction baseline is **219 bytes**. CLI formula `1232 - 219 - 1` gives **1,012-byte chunks**. The extra shortvec length byte makes a complete signed full-chunk wire transaction **1,232 bytes**. Payload starts at account offset 37; final chunk is offset 462,484, length 500.

Temporary code lives in ignored `artifacts/devnet-release/sequential-uploader/`, outside product sources. Public source/evidence copies remain ignored. No application dependency, SDK or backend was added.

Before any Devnet send, a fresh isolated **Agave 2.3.0 local validator** executed **12 passing checks, 0 final failures**: serialization/account roles, packet size, actual loader initialization, confirmed writes at offsets 0/36,432/462,484, retained prefix/unwritten gaps, final 500-byte tail, intentionally lost send response recovered through the existing signature and offset with exactly one send, matching-chunk skip, Retry-After seconds/date, and per-request limiter/raw-error retention. Local identities existed only in process memory and did not replace Devnet keys. Validator was stopped afterward. An initial packet-size expectation of 1,231 failed; the shortvec expansion was measured and the expectation corrected to the actual 1,232. [Final local evidence](../artifacts/devnet-release/sequential-uploader/local-validation.json).

## Sender behavior and actual outcomes

The uploader sends one transaction, waits for confirmed/finalized status, and re-reads that exact offset before proceeding. Every HTTP JSON-RPC request passes the same serial limiter. Configured and observed minimum request-start gap: **750 ms**, 195 requests in the upload/preflight journal. Retry-After seconds/HTTP-date is honored; raw HTTP status, headers, body and JSON-RPC errors are retained. Read retries are bounded. `sendTransaction` keeps preflight enabled, uses `confirmed`, and `maxRetries: 0`; each offset gets one durable intent/signature before submission. No send is automatically repeated and no second signature is created on timeout. Unresolved persisted intents prevent blind continuation.

This conservative forwarding policy does not guarantee confirmation: RPC accepting a signature is not proof of inclusion. A future sender policy could forward the **same signed transaction** while its blockhash is valid after checking signature/offset, without generating a new signature. This attempt did not implement or perform that forwarding. The expired signature below cannot now be forwarded successfully; completing its offset requires a deliberate fresh signature after the recorded audit, rather than treating the previous submission as success. The preserved one-signing-attempt constraint prevented that here.

**16 new transactions finalized**, slots **508096774–508097015**, `err=null`, each exact loader Write verified from `getTransaction`, each fee **5,000 lamports**, total **80,000**. Their instruction bytes/account roles equal the source-based serializer and target ELF bytes. [All 16 confirmed signatures and Explorer links](../artifacts/devnet-release/sequential-uploader/confirmed-write-statuses.md).

- [First confirmed write](https://explorer.solana.com/tx/4pHYiKpB5QsfExRF6deDV35nRnv4PvKxzCQ1DRFh6PxM7p9sKVwW4kX536cY5isaevzgnBKGwFMMg9xe6LXRYE4h?cluster=devnet): offset 36,432, slot 508096774.
- [Last confirmed write](https://explorer.solana.com/tx/4SKx1oDGdiDCmARFDi6v7uKy1rzjQtauFp6wAUV3aALigMKdQjJadF2tDDtfRbn99oXWAujojyN44hxvN5w73Q98?cluster=devnet): offset 51,612, slot 508097015.

The next signed transaction, offset **52,624**, was accepted by `sendTransaction` at 12:44:39 UTC:

```text
fWBYZjYea3wou35CfX6nQLJUwVZP1EYu1YzprERXVCEX4AHejWeQoAwijFQpoafzxNWEFskubxXrXAKa4DScdYi
```

It remained `getSignatureStatuses=null`; the 120-second timeout then read that offset and found unchanged zero bytes. The post-stop audit also found `getTransaction=null`, finalized block height **495339289** greater than last valid height **495338674**. This is **submitted, expired and unconfirmed**, not a confirmed failed-on-chain transaction, simulation rejection or client rejection. No receipt/fee is invented. There were **zero observed HTTP/JSON-RPC errors** in this send run; the actual local error was `Unresolved signature …; bytes match=false. No resend/re-sign performed.` There is no evidence of 429 as its cause, and no precise network/validator cause can be established from null status alone.

## Post-stop read-only state and remaining gate

Audit completed **2026-10-06 12:48:10 UTC**. Full buffer read slot **508097792**, unchanged re-read **508097912**. All **37 previous transactions** (initialization plus 36 writes) are still finalized; all 16 new writes finalized. Original 36,432-byte prefix retained exactly. Matching prefix is now **52,624 bytes**, tail remains zero, **406 chunks** missing. Exact next program offset **52,624**, absolute account offset **52,661**.

Current full payload SHA256:

```text
b93f126261d14a47078a86819a836d68f9ebfb81cd13358dc89013e44857891e
```

It does **not** match the expected ELF hash. The final deploy hash gate therefore failed; executable Program, ProgramData, deployed upgrade authority and Core lifecycle remain unverified. Program/ProgramData still absent at slot **508097797**. Arena settlement/video evidence is not claimed.

Payer: **46,892,440 lamports / 0.046892440 SOL**, confirmed balance slot **508097795**. Buffer deposit unchanged: **2,352,837,560 lamports / 2.352837560 SOL**. No additional SOL transfer is requested. Remaining quoted deployment cost with unchanged fee rates: `406 × 5000 + 833120 Program rent + 10000 final fee = 2,873,120 lamports`, beyond the already-funded buffer deposit; sufficient funds remain for the previously quoted Core budget. This is an estimate, not a completed deployment fee.

[Complete read-only audit/statuses/receipts](../artifacts/devnet-release/sequential-uploader/post-stop-audit.json), [raw upload RPC journal](../artifacts/devnet-release/sequential-uploader/rpc-journal.jsonl), [post-stop RPC journal](../artifacts/devnet-release/sequential-uploader/post-stop-rpc.jsonl), [RPC rate evidence](../artifacts/devnet-release/sequential-uploader/rpc-rate-verification.json). Re-running `upload` is intentionally blocked by the unresolved persisted intent; do not delete its journal to bypass this gate.

Additional current checks: root typecheck passed; Devnet client **17 passed / 0 failed** (RPC stubs); existing UI **15 passed / 0 failed**; secret scan **156 files, 0 findings**; `git diff --check` passed. Rust/build/full integration and production browser checks were not repeated in this uploader-only phase; their prior results are historical, not fresh Devnet/browser evidence.
