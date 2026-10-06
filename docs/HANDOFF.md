# Two-laptop handoff

**Current integration, 6 October 2026:** [DEVNET-INTEGRATION.md](DEVNET-INTEGRATION.md) supersedes the five-instruction/`CvRj...` gate described below. The client targets the existing nine-instruction Rust/IDL program and uses preflight plus source-binary verification. No Devnet deployment exists at the intended address in the fresh audit; no successful Devnet lifecycle is claimed.

## Current Devnet-only frontend refinement

The current console targets `https://api.devnet.solana.com`, requested program `CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63`. The account and matching IDL are absent; its five-instruction ABI differs from this repository's Core. Transactions and local disposable signing are disabled. See [MOTION-DEVNET.md](MOTION-DEVNET.md) and the public [audit report](devnet-audit.json). No private key is needed to inspect or resolve the public program/IDL mismatch.

For this frontend pass: copy `web/.env.example` to ignored `web/.env.local`, then run `npm --prefix web run dev`. `npm --prefix web run build` and `npm --prefix web start` build and preview the static production output. Existing protocol tests still use the supported isolated local-validator runner. The localnet setup/recording instructions below belong to release `submission-v1.0.3`; they do not enable localnet in the current Devnet-only console. The existing hosted Vercel preview also remains at that earlier checkpoint.

## Checkpoint and repository

- Branch: `submission-v1`. Original `main` remains at `8391db2`, tagged `core-v0.1.0`.
- Private remote: https://github.com/luzzwaix/mandateos-v2.git
- Latest submission commit: `git log -1 --format=%H submission-v1`; release tag: `submission-v1.0.3`. Inspect the checkout with `git log -1 --oneline`.
- Arena checkpoint: `4ebb266`.
- Capital-tree polish and confirmed transaction motion checkpoint: `7f8d0fb`.
- Vercel preview: https://mandateos-v2-qdi2zz8ve-luzzwaixs-projects.vercel.app · target `preview`, status `Ready`. Hosted signing demo is disabled; RPC remains LOCALNET.
- Both dependency lockfiles and the generated public frontend IDL are tracked. Wallets, ledgers, deployment keys, local environment and build output are ignored.

## Laptop #2: exact quick start

Current Devnet-only console:

```powershell
git clone --branch submission-v1 https://github.com/luzzwaix/mandateos-v2.git
Set-Location mandateos-v2
npm ci
npm --prefix web ci
Copy-Item web/.env.example web/.env.local
node scripts/audit-devnet.mjs
npm --prefix web run build
npm --prefix web start
```

The audit currently exits 2 with the documented missing-program/IDL blocker. The frontend still builds and opens with truthful blocked-state feedback. Signing keys remain machine-local; never send them in chat or commit them.

## Historical localnet release routine

The following recording routine requires checking out `submission-v1.0.3`; it does not apply to the current Devnet-only frontend.

GitHub access to this private repository, Git, Node 20.18+, Git Bash and Visual Studio 2022 x64 C++ tools are prerequisites on native Windows. Laptop #1 already has them. Setup downloads official user-local binaries/platform tools and Microsoft SDK import libraries; the first download can be substantial.

```powershell
git clone --branch submission-v1 https://github.com/luzzwaix/mandateos-v2.git
Set-Location mandateos-v2
.\scripts\setup-windows.ps1
npm ci
npm --prefix web ci
npm run build:program
npm run test:local
npm run demo:local
```

Leave the final command running. In another terminal at the same repository root:

```powershell
npm --prefix web run dev
```

Open http://127.0.0.1:3000, click Initialize local demo, and select the **generated disposable wallet** path printed by the demo runner. It reads locally into browser memory and signs actual localnet transactions. Never select a personal wallet. Reloading clears the in-memory demo keys/labels; initialize a fresh organization or open an existing public organization with a real wallet.

The demo runner funds its generated owner through validator genesis, so it does not depend on the native Windows faucet. Controller keys are generated in tab memory. Root receives 1,000 six-decimal demo tokens; Research 400 → Data 150 → Scraper 50, with Search 100 alongside Data, and initial Scraper spending of 10.

## Public environment

The runner copies the **actual built IDL** to the frontend and creates public-only `web/.env.local` when missing. It preserves an existing file: check its RPC/program settings when switching validators.

Manual alternative:

```powershell
Copy-Item web/.env.example web/.env.local
```

An empty `NEXT_PUBLIC_MANDATEOS_PROGRAM_ID` uses the generated IDL address. Set an explicit address only to a real deployment with matching instructions. The optional organization PDA is public. Local disposable signing requires localhost RPC plus `NEXT_PUBLIC_ENABLE_LOCAL_DEMO=true`. Set it to false for a hosted build. Never put RPC credentials in a `NEXT_PUBLIC_*` variable: browser configuration is public.

`npm run build:program` runs Anchor build and synchronizes the root IDL. Default `npm run demo:local` loads that compiled SBF at the same public address. Test runner program IDs are fresh, ignored and independent; do not copy a test ID into a frontend targeting the default demo.

## Existing clone / update routine

Before working on either laptop:

```powershell
git status --short --branch
git switch submission-v1
git pull --ff-only origin submission-v1
npm ci
npm --prefix web ci
```

After work and verification:

```powershell
git status
git add PATHS_YOU_CHANGED
git diff --cached
git commit -m "Describe the verified change"
git push origin submission-v1
```

Pull before editing on the other laptop. Do not independently edit divergent, unpulled branches on both machines. A non-fast-forward pull is a real conflict to resolve; do not force-push over another laptop.

## Verification routines

After Windows setup in the current PowerShell shell:

```powershell
cargo fmt --all -- --check
cargo check --locked
cargo test --locked --lib
cargo clippy --locked --all-targets -- -D warnings
npm run typecheck
npm run build:program
npm run test:local
npm run format:check
npm run check:secrets
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run build
```

Stop the demo validator before validator tests; both use port 8899. The supported runner creates an isolated ignored working copy, fresh test wallets and deployment ID. Windows executes eight fresh banks of eight cases, with every scenario intact inside its own bank; Linux uses `anchor test --skip-build`. No validation or token CPI is mocked.

To rerun an already-built debug workspace:

```powershell
npm run test:local -- --reuse .localnet/run-TIMESTAMP/workspace
```

This tests that copied source/binary. Use the default fresh command to test current tracked source. Host Cargo uses GNU Rust because laptop #1's MSVC SDK was incomplete. Setup applies PATH, LIB and RUSTUP_TOOLCHAIN only to its shell; a fresh raw-Cargo shell needs setup again. The Node build/test wrappers locate user-local tools themselves.

All **64 validator tests + 16 Rust tests passed** this session. See [verification evidence](VERIFICATION.md), including actual browser signatures, token balances and saved screenshots.

## Windows validator limitation

Agave 2.3's log symlink is avoided with `--log`. Its snapshot service can attempt a privileged symlink after slot 100 and terminate RPC with error 1314. The interactive demo uses 512 ticks per slot, providing at least roughly 13 minutes before slot 100 on laptop #1, with about eight seconds per confirmation. The snapshot failure can occur later. Timing depends on the machine.

The runner reports the blocker, stops its own validator and preserves the ignored ledger. It does not replay fake transactions or silently reset state. For another recording, stop the old runner, run `npm run demo:local` again, and initialize with its new disposable wallet. For long sessions use WSL2/Linux or Windows symlink privileges. No machine security settings were changed in this session.

## WSL2 / Linux alternative

WSL is absent and this session is non-administrator; native Windows was used. Install Ubuntu from an administrator PowerShell if needed:

```powershell
wsl --install -d Ubuntu-24.04
```

Inside Ubuntu use a Linux home-directory clone, separate from Windows node_modules. Install build-essential, pkg-config, libssl-dev, libudev-dev, curl, Git, bzip2, Node 22, Rust 1.89.0, Agave 2.3.0 and Anchor 0.32.1 from their official sources. Then:

```bash
git clone --branch submission-v1 https://github.com/luzzwaix/mandateos-v2.git
cd mandateos-v2
npm ci
npm --prefix web ci
npm run build:program
npm run test:local
npm run demo:local
# another terminal in the same clone
npm --prefix web run dev
```

Linux continuation commands were not executed on this Windows laptop. Tool references: [Solana setup](https://solana.com/docs/intro/installation), [Anchor 0.32.1](https://www.anchor-lang.com/docs/updates/release-notes/0-32-1).

## Devnet and wallets

No devnet deployment was attempted: CLI currently points to mainnet-beta, and its configured `%USERPROFILE%\.config\solana\id.json` does not exist. No funded devnet wallet is available. [Deployment continuation](DEPLOYMENT.md) explains the exact steps.

Each laptop keeps its own signing and deployment material outside Git. A clone never supplies a personal or upgrade-authority wallet. Never commit Solana keypair JSON, recovery phrases, private keys, credential-bearing RPC URLs, `.env.local`, deployment authority or ledgers. Generated local demo wallets are disposable and already ignored.

## Founder action

Record the Capital Cascade → failed descendant payment → Arena winner payout using a fresh local demo. On native Windows, start the recording promptly after setup. The repo is private by explicit request; provide judges access or deliberately publish it before submitting its URL.
