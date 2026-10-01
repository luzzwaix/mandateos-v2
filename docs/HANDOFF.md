# Two-laptop handoff

## Git checkpoint

- Branch: `main`.
- Core checkpoint commit: `4edca98` (`feat: implement recursive mandate capital authority and lineage validation`).
- Final tests/docs checkpoint: tag `core-v0.1.0`; resolve its exact commit with `git rev-parse core-v0.1.0`.
- Check current checkout with `git log -1 --oneline` and `git status --short --branch`.
- No remote was configured during this session. No push was performed.

## Completed functionality

Six Anchor instructions, one shared classic SPL Token vault per organization, deterministic recursive mandates, complete canonical lineage validation, checked spending and ancestor serialization, O(depth) branch revocation, Root-only reclaim, compact events, and explicit errors. Arena and frontend are not implemented.

## Verification evidence

On laptop #1, Node v24.14.0, npm 11.9.0, Rust/Cargo 1.89.0 (Windows GNU), Anchor 0.32.1, and Solana/Agave 2.3.0 are available. Rust, Anchor, and Solana were initially absent; official binaries and user-local Rust were installed without changing the personal Solana wallet or global PATH.

- `cargo +1.89.0-x86_64-pc-windows-gnu check --locked`: passed.
- `cargo +1.89.0-x86_64-pc-windows-gnu test --locked --lib`: 16 passed, zero failed.
- `npm run typecheck`: passed.
- `cargo +1.89.0-x86_64-pc-windows-gnu clippy --locked --all-targets -- -D warnings`: passed.
- Rust/TypeScript/Markdown formatting and tracked-file secret/build-output checks: passed.
- `anchor build`: passed from the repository root and isolated localnet workspace; compiled SBF binary and IDL produced.
- `npm run test:local -- --reuse .localnet/run-1790889668255/workspace`: passed, six batches of eight tests, **48 validator tests passed / zero failed**.
- Default fresh-key `npm run test:local` reproduction check: see the final verification update below.

The Rust tests exercise actual protocol validation and serialization helpers, not token transfers or Solana runtime rollback. `tests/mandateos.ts` invokes real deployed program instructions on a local validator and checks exact Anchor error codes. Its scenario, amounts, and assertions are deterministic; addresses and signing keys are freshly generated for isolation.

The packaged Windows Solana SBF SDK's `syscalls.txt` is empty, so SBF post-processing warns about standard Solana syscalls. The real validator executed the program's PDA, token CPI, and log syscalls successfully. This warning is SDK metadata, not an observed program runtime failure. The pinned legacy Anchor/SPL and Mocha dependency trees also have `npm audit` advisories; no incompatible force downgrade was applied. This is an unaudited local MVP, not a production client release.

Initial Windows setup diagnosis: WSL is not installed, the session is non-administrator, and `wsl --install --no-distribution` returned exit 1. Visual Studio has the C++ linker but no usable Windows SDK import libraries: native MSVC host compilation failed with `LNK1181: cannot open input file kernel32.lib`. GNU Rust avoids that host linker problem. Official Windows Anchor and Agave binaries are installed under `%LOCALAPPDATA%\MandateOS\toolchains`; `scripts/setup-windows.ps1` reproduces that setup.

Native SBF builds need the MSVC host linker even when regular Cargo uses GNU Rust. The setup fetches Microsoft's `Microsoft.Windows.SDK.CPP.x64` 10.0.26100.4202 import libraries into the same user-local tool directory and sets process-local `LIB`. It also pre-extracts platform tools, creates an unprivileged SDK directory junction, and copies `rustc.exe`/`cargo.exe` to extensionless names expected by Agave 2.3's toolchain check. These changes avoid the observed installer error 1314 and false corrupted-toolchain check without a Windows SDK system installation.

## Connect GitHub from laptop #1

Run in the project directory after creating an empty GitHub repository named `mandateos-v2` under your account. Substitute your GitHub handle; do not paste tokens into URLs:

```powershell
git remote add origin https://github.com/YOUR_GITHUB_HANDLE/mandateos-v2.git
git push -u origin main
git push origin core-v0.1.0
```

If GitHub CLI is installed and authenticated, an alternative is:

```powershell
gh repo create mandateos-v2 --private --source . --remote origin --push
git push origin core-v0.1.0
```

These commands are for the user to run later; this session did not publish anything.

## Laptop #2: clone or pull, then run tests

PowerShell, with Git and Node 20.18+ installed:

Native Windows additionally requires Visual Studio 2022 Build Tools with the x64 C++ compiler/linker. Laptop #1 already had those tools. If laptop #2 lacks them, install with the following command and accept the Windows installer prompt, or use the WSL alternative below:

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --override "--wait --passive --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64"
```

```powershell
git clone https://github.com/YOUR_GITHUB_HANDLE/mandateos-v2.git
Set-Location mandateos-v2
git switch main
.\scripts\setup-windows.ps1
npm ci
node -v
npm -v
rustc --version
cargo --version
solana --version
anchor --version
cargo fmt --all -- --check
cargo check --locked
cargo test --locked --lib
npm run typecheck
npm run test:local
```

For an existing clean clone:

```powershell
Set-Location mandateos-v2
git switch main
git pull --ff-only origin main
.\scripts\setup-windows.ps1
npm ci
npm run test:local
```

The Windows setup only changes PATH, `LIB`, and `RUSTUP_TOOLCHAIN` in that PowerShell process. The Node test runner resolves user-local Windows tools and the installed Visual Studio linker automatically in later shells. Raw host Cargo commands in a fresh shell may need `cargo +1.89.0-x86_64-pc-windows-gnu ...` or rerunning setup. Git Bash must be installed, as Anchor executes its test script through `bash`.

The runner builds with `anchor build` (SBF version is pinned in Cargo workspace metadata). On Linux it then executes `anchor test --skip-build`. On Windows it starts the real validator with `--log --reset`, loads the compiled SBF program at genesis, and executes `anchor test --skip-build --skip-local-validator --skip-deploy`. This avoids another Agave Windows error 1314: its default logger creates a privileged file symlink, while `--log` streams logs to a regular file. No instruction validation is mocked or bypassed. The runner resets only its verified local workspace ledger and terminates its validator afterward.

Agave's Windows snapshot service also attempts a privileged symlink at slot 100 and stops the validator on error 1314. The first unbatched run completed the mandatory scenario and 20 other tests before that process failure; subsequent RPC failures were environmental. The Windows runner therefore schedules all 48 independent cases across six fresh validator batches (eight cases each). Every full scenario remains intact within one bank and every negative test still invokes actual on-chain validation. Linux runs all cases together. Batching avoids the snapshot failure rather than changing protocol code or using mocked validation.

Every fresh run generates its own provider wallet and deployment keypair inside `.localnet/run-*/workspace` and updates only that ignored copy's public program ID. No devnet wallet is used. Source remains portable even when the two laptops use different local program IDs.

To re-run validator tests after debugging in the printed working copy:

```powershell
npm run test:local -- --reuse .localnet/run-TIMESTAMP/workspace
```

This re-runs the existing compiled program and copied tests on a fresh ledger. To test the latest tracked source, run `npm run test:local` again from the repository root. Plain `anchor test` with its default Windows validator startup requires Windows symlink privileges; the supported runner avoids that requirement.

## WSL2/Ubuntu alternative

If native Windows Solana is blocked, install Ubuntu 24.04 from an **administrator PowerShell**, then restart if Windows requests it:

```powershell
wsl --install -d Ubuntu-24.04
```

Open Ubuntu and finish its first-run local username/password setup. Inside Ubuntu, use a Linux home-directory clone (do not reuse Windows `node_modules`):

```bash
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev libudev-dev curl git bzip2
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain 1.89.0
. "$HOME/.cargo/env"
sh -c "$(curl -sSfL https://release.anza.xyz/v2.3.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
mkdir -p "$HOME/.local/bin"
curl -fL https://github.com/solana-foundation/anchor/releases/download/v0.32.1/anchor-0.32.1-x86_64-unknown-linux-gnu -o "$HOME/.local/bin/anchor"
chmod +x "$HOME/.local/bin/anchor"
export PATH="$HOME/.local/bin:$PATH"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 22
git clone https://github.com/YOUR_GITHUB_HANDLE/mandateos-v2.git
cd mandateos-v2
npm ci
node -v
npm -v
rustc --version
cargo --version
solana --version
anchor --version
npm run test:local
```

Installer references: [Solana local setup](https://solana.com/docs/intro/installation), [Anchor 0.32.1 compatibility](https://www.anchor-lang.com/docs/updates/release-notes/0-32-1), [Rust Windows toolchains](https://rust-lang.github.io/rustup/installation/windows.html). All Linux setup commands are a continuation recipe; they have not been run in this Windows session.

## Devnet wallets stay machine-local

Local tests require no personal or devnet wallet. Neither laptop's devnet credentials are copied by the repository. No devnet program has been deployed by this session.

If laptop #2 already has its own wallet, select its existing local keypair **outside the repository** (replace this example filename with the actual local path):

```powershell
$machineWallet = Join-Path $env:USERPROFILE '.config\solana\id.json'
Test-Path -LiteralPath $machineWallet
solana config set --url https://api.devnet.solana.com --keypair $machineWallet
solana address --keypair $machineWallet
solana balance
```

If it has no wallet, generate a new wallet locally; the command is interactive and its recovery phrase is private:

```powershell
$walletDirectory = Join-Path $env:USERPROFILE '.config\solana'
New-Item -ItemType Directory -Path $walletDirectory -Force
$machineWallet = Join-Path $walletDirectory 'mandateos-devnet.json'
solana-keygen new --outfile $machineWallet
solana config set --url https://api.devnet.solana.com --keypair $machineWallet
solana address --keypair $machineWallet
solana airdrop 2
solana balance
```

`solana-keygen new` must not overwrite an existing wallet. Keep recovery phrases and any encrypted key backup outside Git. Airdrops depend on devnet faucet availability. Windows and WSL have separate home directories and Solana configurations; select the wallet inside the environment you actually use.

Never commit private keys, seed phrases, keypair JSON, CLI config/credentials, `.env` secrets, deployment authority material, or local test/build output. `.gitignore` excludes those standard locations and filename patterns. Both Cargo and npm lockfiles are committed; generated keys are not. Future devnet deployment must create/select a machine-local program deployment keypair, set the public program ID deliberately, and preserve the upgrade authority securely outside Git. The Core source ID is not a deployed devnet address.

## Next milestone

First complete any outstanding Core build/validator verification listed below. Once Core acceptance is green: **Arena Lite + real frontend integration** using `create_bounty`, `submit_result`, and `settle_bounty`, without redesigning mandate accounting.

## Final verification update

Core verification is green: 48 real-validator tests and 16 Rust tests passed. The default fresh-key reproduction command is being checked before the final checkpoint; its exact observed result will be recorded here.
