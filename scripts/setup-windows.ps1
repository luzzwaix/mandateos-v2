$ErrorActionPreference = 'Stop'
# User-local, pinned binaries. No administrator privileges or global PATH edits.
$toolRoot = Join-Path $env:LOCALAPPDATA 'MandateOS\toolchains'
New-Item -ItemType Directory -Path $toolRoot -Force | Out-Null
$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (-not (Test-Path -LiteralPath $vswhere)) { throw 'Install Visual Studio 2022 Build Tools with the x64 C++ tools, or use WSL2; see HANDOFF.md' }
$vsRoot = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $vsRoot) { throw 'Visual Studio x64 C++ tools are missing; see HANDOFF.md' }
$vcVersion = Get-ChildItem -LiteralPath (Join-Path $vsRoot 'VC\Tools\MSVC') -Directory | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
$vcRoot = $vcVersion.FullName
$env:PATH = "$cargoBin;$env:PATH"
if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
    $installer = Join-Path $env:TEMP 'rustup-init.exe'
    Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile $installer
    & $installer -y --profile minimal --default-toolchain none --no-modify-path
    if ($LASTEXITCODE -ne 0) { throw 'Rustup installation failed' }
}
rustup toolchain install 1.89.0-x86_64-pc-windows-gnu --profile minimal --component rustfmt --component clippy
if ($LASTEXITCODE -ne 0) { throw 'Rust toolchain installation failed' }
$anchorPath = Join-Path $toolRoot 'anchor.exe'
if (-not (Test-Path -LiteralPath $anchorPath)) {
    $release = Invoke-RestMethod 'https://api.github.com/repos/solana-foundation/anchor/releases/tags/v0.32.1'
    $asset = $release.assets | Where-Object name -EQ 'anchor-0.32.1-x86_64-pc-windows-msvc.exe'
    if (-not $asset) { throw 'Pinned Anchor Windows release asset not found' }
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $anchorPath
}
$solanaBin = Join-Path $toolRoot 'solana-release\bin'
if (-not (Test-Path -LiteralPath (Join-Path $solanaBin 'solana.exe'))) {
    $release = Invoke-RestMethod 'https://api.github.com/repos/anza-xyz/agave/releases/tags/v2.3.0'
    $asset = $release.assets | Where-Object name -EQ 'solana-release-x86_64-pc-windows-msvc.tar.bz2'
    if (-not $asset) { throw 'Pinned Solana Windows release asset not found' }
    $archive = Join-Path $toolRoot 'agave-2.3.0.tar.bz2'
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive
    tar -xjf $archive -C $toolRoot
    if ($LASTEXITCODE -ne 0) { throw 'Solana archive extraction failed' }
}
$env:PATH = "$toolRoot;$solanaBin;$cargoBin;C:\Program Files\Git\bin;$env:PATH"
$env:RUSTUP_TOOLCHAIN = '1.89.0-x86_64-pc-windows-gnu'
# Obtain only SDK import libraries from Microsoft's pinned NuGet package.
$sdkRoot = Join-Path $toolRoot 'windows-sdk-x64'
if (-not (Test-Path -LiteralPath (Join-Path $sdkRoot 'c\um\x64\kernel32.lib'))) {
    $sdkArchive = Join-Path $toolRoot 'windows-sdk-x64-10.0.26100.4202.zip'
    Invoke-WebRequest -Uri 'https://api.nuget.org/v3-flatcontainer/microsoft.windows.sdk.cpp.x64/10.0.26100.4202/microsoft.windows.sdk.cpp.x64.10.0.26100.4202.nupkg' -OutFile $sdkArchive
    Expand-Archive -LiteralPath $sdkArchive -DestinationPath $sdkRoot -Force
}
$env:PATH = "$(Join-Path $vcRoot 'bin\Hostx64\x64');$env:PATH"
$env:LIB = "$(Join-Path $vcRoot 'lib\x64');$(Join-Path $sdkRoot 'c\um\x64');$(Join-Path $sdkRoot 'c\ucrt\x64');$env:LIB"
# cargo-build-sbf's Windows installer uses a privileged directory symlink.
# Extract the official archive and pre-create an equivalent unprivileged junction.
$platformCache = Join-Path $env:USERPROFILE '.cache\solana\v1.52\platform-tools'
if (-not (Test-Path -LiteralPath (Join-Path $platformCache 'rust\bin\rustc.exe'))) {
    $release = Invoke-RestMethod 'https://api.github.com/repos/anza-xyz/platform-tools/releases/tags/v1.52'
    $asset = $release.assets | Where-Object name -EQ 'platform-tools-windows-x86_64.tar.bz2'
    if (-not $asset) { throw 'Pinned SBF Windows release asset not found' }
    $archive = Join-Path $toolRoot 'platform-tools-v1.52.tar.bz2'
    if (-not (Test-Path -LiteralPath $archive)) {
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive
    }
    if ((Get-Item -LiteralPath $archive).Length -ne $asset.size) { throw 'Incomplete SBF archive; remove this archive and rerun setup' }
    New-Item -ItemType Directory -Path $platformCache -Force | Out-Null
    tar -xjf $archive -C $platformCache
    if ($LASTEXITCODE -ne 0) { throw 'SBF extraction failed' }
}
$sdkLink = Join-Path $solanaBin 'platform-tools-sdk\sbf\dependencies\platform-tools'
# Agave 2.3's corruption check looks for extensionless paths even on Windows.
foreach ($binaryName in 'rustc','cargo') {
    $binaryDirectory = Join-Path $platformCache 'rust\bin'
    $extensionlessPath = Join-Path $binaryDirectory $binaryName
    if (-not (Test-Path -LiteralPath $extensionlessPath)) {
        Copy-Item -LiteralPath (Join-Path $binaryDirectory ($binaryName + '.exe')) -Destination $extensionlessPath
    }
}
if (-not (Test-Path -LiteralPath $sdkLink)) {
    New-Item -ItemType Junction -Path $sdkLink -Target $platformCache | Out-Null
}
node -v
npm -v
rustc --version
cargo --version
anchor --version
solana --version
Write-Host 'Setup complete for this PowerShell session. npm run test:local also resolves these local tool paths.'
