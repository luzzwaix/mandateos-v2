# Devnet pre-transfer budget — 6 October 2026

This is a read-only funding estimate, not deployment or lifecycle evidence. No signer files were read, no message was signed, and no simulation or transaction was submitted in this pass. Frozen Story, Command and Arena are unchanged. Branch remains `devnet-integration`, checkpoint `f5b7965dbac9f4b634bfb5eccc6b146046218f68`; preparation changes are uncommitted.

## Identities and current observations

| Role                                                   | Public address                                 |
| ------------------------------------------------------ | ---------------------------------------------- |
| Program                                                | `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd` |
| Fee payer, initial upgrade authority, buffer authority | `3ws8XCWXKg5oCn9Bv3x6HaVAPgaxBfHTpmQ27Z9oqKAm` |
| Buffer account signer                                  | `3QazcRm23Dm4nHeWzifbPxsBWegxrpr1aJrNUGG4Q8UE` |
| User transfer sender                                   | `C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo` |

The program/payer public keys and buffer public key were independently derived in earlier preparation. This pass checks public metadata and private-file existence/modification times only. The external private directory still has protected ACLs granting access only to the current user. No wallet/configuration or role was changed.

RPC: `https://api.devnet.solana.com`, commitment `confirmed`. Genesis: `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`. Snapshot completed **2026-10-06 11:44:23 UTC**. `getBalance` returned payer **0 lamports**, sender **9,989,995,000 lamports (9.989995 SOL)**, both at slot **508081899**. Program and buffer accounts were absent at the same slot.

ELF: `target/deploy/mandateos.so`, **462,984 bytes**. SHA256:

```text
ecf178ec3a259f3d1ddd48441b86ce9470ae3db74aa60ab7e8fadcae089edd35
```

Hash/length match the app's build manifest; Rust, Anchor Devnet entry, bundled IDL and public frontend configuration agree on the preserved Program ID. No deployed byte comparison is possible yet.

## One transfer budget

Rent RPC has no context slot, so reads are bracketed by `getSlot(confirmed)`: deployment **508081900–508081901**, Core **508081903–508081904**. Fees are `getFeeForMessage` responses for unsigned messages: deployment slot **508081901**, Core **508081905–508081907**, user transfer **508081907**.

| Deposit                                             | Bytes each | Count |    Lamports total |
| --------------------------------------------------- | ---------: | ----: | ----------------: |
| Upgradeable Program                                 |         36 |     1 |           833,120 |
| ProgramData (45 + ELF)                              |    463,029 |     1 |     2,352,837,560 |
| Organization                                        |        171 |     1 |         1,518,920 |
| Root / Research / Data / Scraper / Operations       |        155 |     5 |         7,188,200 |
| Classic SPL test mint, six decimals, **not USDC**   |         82 |     1 |         1,066,800 |
| Vault + owner source ATA + recipient ATA            |        165 |     3 |         4,465,320 |
| Four controller System accounts' rent-exempt floors |          0 |     4 |         2,600,960 |
| **Total retained deposits/floors**                  |            |       | **2,370,510,880** |

Of that total, **2.367909920 SOL** is held in program/token accounts and **0.002600960 SOL** remains as controller wallet rent-exempt floors. No Core instruction closes those accounts. Revoke/reclaim return test-token authority/tokens, not these SOL deposits. Upgradeable-program deposit recovery requires a separate authorized loader operation and is outside this flow.

The buffer minimum for 463,021 bytes is **2,352,796,920 lamports**. Agave 2.3.0 actually funds it with the ProgramData rent **2,352,837,560 lamports**. Deployment drains/reuses that funding for ProgramData, so **it must not be added a second time**. This calculation applies to the command below with no priority-fee flag, no pre-existing buffer/program and one successful upload.

| Budget component                                                          |             SOL |
| ------------------------------------------------------------------------- | --------------: |
| Program + ProgramData deposit, including reused buffer funding            |     2.353670680 |
| Core protocol/token deposits                                              |     0.014239240 |
| Controller wallet rent-exempt floors                                      |     0.002600960 |
| Deployment fees: 10,000 + 458 × 5,000 + 10,000 lamports, 460 transactions |     0.002310000 |
| Core fees: 12 transactions, mint setup has two signers; all others one    |     0.000065000 |
| Small payer reserve                                                       |     0.010000000 |
| **Transfer C7j… → 3ws8…**                                                 | **2.382885880** |

The payer reserve includes its own zero-data account floor **650,240 lamports**, leaving **9,349,760 lamports** above that floor after the planned flow. The reserve covers fee changes/limited retry costs; it is not a claimed charge or guarantee of network availability.

Sender additionally pays the transfer fee: current unsigned-message quote **5,000 lamports**. Total sender debit for a direct standard transfer: **2.382890880 SOL**; expected sender remainder **7.607104120 SOL**. A wallet may add priority fees; those are paid by the sender separately and do not change the required recipient amount. Nothing has been transferred.

Core funding uses **2,092,880 lamports each** for Research/Data (child rent + delegation fee + residual wallet floor), **655,240 each** for Scraper/Operations (spend fee + residual floor). These transfers distribute the already counted budget; they are not an additional expense. The old fixed grants and implicit faucet request were removed from the verification script.

The 12 planned Core transactions are controller funding, mint/two-ATA setup, treasury creation, deposit, four delegations, Scraper spend, Research revoke, Operations spend and Root reclaim. The descendant attempt should be rejected by preflight with `AncestorRevoked`, with no submission signature or charged transaction fee. Actual future outcomes must be recorded precisely, including any submitted failure.

No on-chain IDL publication is needed: the app uses its bundled source-generated IDL and validates the deployed ELF. Budget **0** for publication. No existing verified test mint is assumed; the setup creates and verifies a dedicated classic SPL mint before using it. No SOL-valued treasury capital is required for its 1,000 minted test tokens. Arena/bounty/submission accounts, x402, optional repetitions and a backend are excluded. Arena may enter the recording only after a separately verified Devnet settlement.

## Prepared deployment command — do not run before transfer confirmation

Run from this repository. Private paths are resolved from the existing ignored public identity metadata. These commands have **not** been executed in this pass.

```powershell
$releaseIdentity = Get-Content artifacts/devnet-release/identity-local.json -Raw | ConvertFrom-Json
$privateDir = Split-Path -Parent $releaseIdentity.files.payer
& "$env:LOCALAPPDATA\MandateOS\toolchains\solana-release\bin\solana.exe" program deploy `
  (Join-Path (Get-Location) 'target\deploy\mandateos.so') `
  --url https://api.devnet.solana.com --commitment confirmed `
  --keypair "$privateDir\payer-keypair.json" `
  --fee-payer "$privateDir\payer-keypair.json" `
  --program-id "$privateDir\program-keypair.json" `
  --upgrade-authority "$privateDir\payer-keypair.json" `
  --buffer "$privateDir\buffer-keypair.json" `
  --max-len 462984 --max-sign-attempts 1 --use-rpc
```

Preflight remains enabled. `--keypair`, `--fee-payer` and `--upgrade-authority` all reference the same previously verified 3ws8… signer. The program signer remains 125Z… and the buffer signer remains 3Qaz…; the buffer authority is 3ws8….

After user confirmation of the transfer: recheck confirmed balance, genesis, account absence, unchanged ELF hash and roles, then invoke this deployment once. On error, inspect actual state/returned signatures and stop before any automatic redeployment. On success, verify ProgramData bytes, program slot and actual upgrade authority, then execute the canonical runner with the dedicated payer and fresh state reads after each confirmed action. Record real receipts and distinguish preflight rejection from submitted failure. Browser wallet interaction and a real submission recording remain unverified until those steps happen.

Read-only reproduction: `node -r ts-node/register/transpile-only tests/devnet-budget.ts`. Public machine-readable snapshot: ignored `artifacts/devnet-release/pretransfer-budget.json`. Preparation checks: root typecheck passed, transport/binary tests **17 passed**, new wrong-network/changed-fee funding checks **2 passed**, `git diff --check` passed. These are local/RPC-stub checks, not Devnet lifecycle success.
