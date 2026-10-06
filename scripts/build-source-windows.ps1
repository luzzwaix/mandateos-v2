$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/setup-windows.ps1"
# Agave's build wrapper creates a random deployment key when absent. Compile
# with its pinned platform compiler and identical strip operation without keys.
$platformRoot = Join-Path $env:USERPROFILE '.cache/solana/v1.52/platform-tools'
$llvmBin = Join-Path $platformRoot 'llvm/bin'
$env:RUSTC = Join-Path $platformRoot 'rust/bin/rustc.exe'
$env:CC = Join-Path $llvmBin 'clang.exe'
$env:AR = Join-Path $llvmBin 'llvm-ar.exe'
$env:CARGO_TARGET_SBF_SOLANA_SOLANA_RUSTFLAGS = '-Zremap-cwd-prefix='
& (Join-Path $platformRoot 'rust/bin/cargo.exe') build --release --target sbf-solana-solana --locked --manifest-path programs/mandateos/Cargo.toml
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
New-Item -ItemType Directory -Path target/deploy -Force | Out-Null
& (Join-Path $llvmBin 'llvm-objcopy.exe') --strip-all target/sbf-solana-solana/release/mandateos.so target/deploy/mandateos.so
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
# IDL generation is a separate native Anchor compilation, with no key creation.
Remove-Item Env:RUSTC
Remove-Item Env:CARGO_TARGET_SBF_SOLANA_SOLANA_RUSTFLAGS
New-Item -ItemType Directory -Path target/idl -Force | Out-Null
anchor idl build -p mandateos -o target/idl/mandateos.json
exit $LASTEXITCODE
