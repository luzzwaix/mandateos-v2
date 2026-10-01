# MandateOS V2 Core

**Don't give agents wallets. Give them mandates.**

MandateOS lets organizations delegate capital authority recursively without sharing treasury keys. One organization has one SPL Token vault. Mandates represent bounded authority; spending updates the full lineage, and revoking one branch invalidates all descendants without walking them.

Core exposes exactly `create_organization`, `deposit`, `delegate`, `spend`, `revoke_branch`, and `reclaim`. Rust logic is separated into state, instructions, lineage validation, errors, and events. See [the protocol](docs/PROTOCOL.md) and [two-laptop handoff](docs/HANDOFF.md).

## Local setup

Use Node 20.18+, Rust 1.89.0, Anchor 0.32.1, Solana/Agave 2.3.0, and SBF platform tools v1.52. Versions and both dependency lockfiles are pinned. Native Windows also needs Visual Studio 2022 Build Tools with the x64 C++ tools. On Windows with those prerequisites, Node, and Git installed:

```powershell
.\scripts\setup-windows.ps1
npm ci
npm run typecheck
npm run test:local
```

The setup installs official binaries and Microsoft SDK import libraries under your user profile without changing global PATH. It uses a directory junction to avoid Solana's privileged Windows symlink installer and supplies the extensionless paths its toolchain check expects. WSL2/Ubuntu is also supported; exact setup is in HANDOFF. Initial setup downloads platform tools (~568 MB on Windows).

## Build and test

```text
cargo fmt --all -- --check
cargo check --locked
cargo test --locked --lib
anchor build
npm run typecheck
npm run test:local
```

The Windows setup sets the GNU Rust toolchain for this shell because an incomplete Visual Studio SDK cannot link regular host builds. `npm run test:local` sets tool paths automatically, creates fresh wallets and a fresh deployment ID in an ignored working copy, and runs `anchor build`. On Windows it starts the real validator in log mode and runs `anchor test --skip-build --skip-local-validator --skip-deploy`; on Linux it runs `anchor test --skip-build`. It never needs your personal wallet or devnet and leaves tracked source unchanged. The checked-in program ID is a public source identifier, not a published deployment; no corresponding deployment private key is committed. Use the supported runner to avoid the Windows validator's privileged log symlink.

## Acceptance scenario

A normal local six-decimal SPL mint funds Root with 1000 tokens. Root delegates Research 400; Research delegates Data 150; Data delegates Scraper 50. Scraper spends 10. Revoking Research returns its unused 390 to Root, leaving Root available/remaining at 990/990. A subsequent Scraper spend fails in program validation. Root reclaims 990, leaving the vault empty.

The validator suite covers this scenario, authorization, depth, ancestor substitution/ordering/ownership/type, reserved capital, wrong mints, zero amounts, revocation, and failed-CPI rollback. Rust tests independently exercise the actual lineage and serialization helpers. Execution results and limitations are recorded in HANDOFF; written tests are not counted as passing until executed.

Current verified status: `anchor build` passes, all 48 validator tests and all 16 Rust tests pass, and strict Clippy, TypeScript type checking, and formatting pass. Windows validator tests use six fresh banks to avoid Agave's privileged snapshot symlink. See HANDOFF for execution evidence and setup details.

Next planned layer: **Arena Lite + real frontend integration**, after Core acceptance is green. Arena is not implemented.
