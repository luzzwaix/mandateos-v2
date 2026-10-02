# Frontend deployment and devnet continuation

## Static frontend

Ready preview: https://mandateos-v2-qdi2zz8ve-luzzwaixs-projects.vercel.app

Deployment: `dpl_8Zq2YmGaShEc7MYoWELo11jTsHvg`, target `preview`. Vercel's install, Next.js production compilation, TypeScript, static page generation and output deployment completed successfully. CLI inspection returned **Ready**. No request was made to the deployed site to claim a remote browser test; the final application flow was tested locally.

The frontend uses Next.js App Router, TypeScript, Tailwind and Lucide. Its real Anchor client talks directly from the connected browser to Solana. It has no API routes, server actions, database or backend deployment.

```powershell
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run build
npm --prefix web start
```

Build produces `web/out`. The last command serves that static directory locally, without `next start` (unsupported for an exported app). Stop any existing port-3000 process first.

Vercel project: `luzzwaixs-projects/mandateos-v2`. The checked-in `web/vercel.json` uses the static (Other) preset, install `npm ci`, build `npm run build`, output `out`. The application remains Next.js App Router; its browser talks directly to Solana. Do not pair Vercel's server Next.js preset with an overridden `out` directory: that combination compiled but failed looking for a server routes manifest.

For a Git import, select branch `submission-v1` and root directory `web`. Wallets, ledgers, local environment files, dependencies and output are excluded from uploads through `web/.vercelignore`. Vercel project linkage in `.vercel` is machine-local and ignored.

To recreate an authenticated preview from laptop #2:

```powershell
Set-Location web
vercel link --yes --project mandateos-v2 --scope luzzwaixs-projects
vercel deploy --yes --target preview --build-env NEXT_PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899 --build-env NEXT_PUBLIC_MANDATEOS_PROGRAM_ID=Fg6PaFpoGXkYsidMpWxTWqkZ5gnk9j8GaZ9epbEYwPqG --build-env NEXT_PUBLIC_ENABLE_LOCAL_DEMO=false
```

The published build currently points to LOCALNET and disables disposable signing. Without a validator on the visitor's machine, it displays an explicitly illustrative hierarchy and no invented balances. It does not pretend to be a live devnet deployment. Replace the two public deployment values only after actually deploying the program, then rebuild. Existing Vercel preview protection remains enabled.

Set public build variables before building:

- `NEXT_PUBLIC_SOLANA_RPC_URL`: publicly accessible RPC, without secrets.
- `NEXT_PUBLIC_MANDATEOS_PROGRAM_ID`: the actual deployed program address matching the generated IDL.
- `NEXT_PUBLIC_MANDATEOS_ORGANIZATION`: optional public organization PDA.
- `NEXT_PUBLIC_ENABLE_LOCAL_DEMO=false` for hosted builds.

These variables are visible in the browser and compiled at build time. Rebuild on changes. A hosted localhost-RPC build will try to contact the judge's own machine; it is suitable only for judges running a local validator. A public standalone demo needs a real reachable devnet deployment and funded organization. HTTPS is needed for ordinary injected-wallet and SHA-256 browser APIs.

## Observed devnet blocker

The Solana CLI selects mainnet-beta. Its configured local keypair path `%USERPROFILE%\.config\solana\id.json` is absent. There was no existing funded devnet wallet, so the conditional devnet deployment was not attempted. The checked-in public source identifier is **not a deployed devnet address**.

## Exact continuation

Use the pinned tools from HANDOFF. Keep wallet and deployment keypair outside the repository. If needed, create a new wallet interactively without overwriting an existing file:

```powershell
$walletDirectory = Join-Path $env:USERPROFILE '.config\solana'
New-Item -ItemType Directory -Path $walletDirectory -Force
$machineWallet = Join-Path $walletDirectory 'mandateos-devnet.json'
solana-keygen new --outfile $machineWallet
solana config set --url https://api.devnet.solana.com --keypair $machineWallet
solana airdrop 2
solana balance
```

Keep the recovery phrase private. Airdrops depend on faucet availability; program rent can require more than two SOL. Verify adequate funds using the build size and rent before deploying.

Generate a distinct deployment keypair locally:

```powershell
$programKey = Join-Path $walletDirectory 'mandateos-program.json'
solana-keygen new --no-bip39-passphrase --outfile $programKey
solana address --keypair $programKey
```

Set that **public** address in `declare_id!` and Anchor's localnet/devnet program entries, rebuild with `npm run build:program` and rerun `npm run test:local`. Core logic/accounting must remain unchanged. Deploy explicitly to devnet:

```powershell
solana program deploy --url https://api.devnet.solana.com --keypair $machineWallet --program-id $programKey target/deploy/mandateos.so
solana program show --url https://api.devnet.solana.com PUBLIC_PROGRAM_ADDRESS
```

Replace PUBLIC_PROGRAM_ADDRESS with the output of `solana address --keypair $programKey`. Keep upgrade-authority material local. Do not commit either keypair.

Set the frontend RPC to devnet and program ID to that confirmed deployment, disable local demo signing, rebuild and publish. Connect a separately funded devnet browser wallet; create/select a classic SPL demo mint and organization and perform the actions through the real client. No disposable local key is transported to devnet. The native localnet demo mint is a test token, not Circle-issued USDC.
