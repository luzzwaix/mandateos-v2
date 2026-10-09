# Contributing

Start with [README](README.md), [AGENTS.md](AGENTS.md) and the [documentation index](docs/README.md). Keep changes scoped and explain the user-facing or protocol effect.

## Setup and checks

Use Node ≥20.18 and the committed lockfiles. Run `npm ci`, then `npm ci --prefix web` if working on the console. `npm run build:sdk` builds the shared client; `npm run build:agent` compiles the reference worker.

Run checks relevant to your change:

- Documentation/media: verify destinations and readable image rendering; run `npm run check:secrets` and `git diff --check`.
- SDK/worker: `npm run typecheck`, `npm run test:sdk`, `npm run test:agent`.
- Frontend: `npm run lint --prefix web`, `npm run typecheck --prefix web`, `npm run build --prefix web`; inspect desktop/mobile and reduced motion.
- Program: follow [documented release toolchain](docs/DEVNET-RELEASE.md), run the real local-validator suite and review accounting, authorization and ancestry invariants.

SDK tests that require the program binary need the documented build artifacts. Do not substitute an old binary and describe it as freshly generated.

## Evidence and safety

Keep simulation, RPC observations, stubbed tests and historical receipts distinct. Do not invent signatures, balances, wallet success or autonomous payment claims.

Never commit private keys, seed phrases, credentials, local environment files, validator ledgers, dependency directories or generated build/package outputs. `.env.example` contains configuration examples only. Review staged files and run the secret check before committing.

Use an isolated local organization for write testing. Obtain explicit owner authorization before Devnet transactions, deployment, changes to program identity/authorities, publication or production promotion. Never blindly retry an unknown transaction.

## Submitting changes

Provide a focused diff, actual check results and limitations. Preserve unrelated work and protocol semantics. Repository visibility, default-branch changes, releases and license decisions belong to the owner.

There is currently no approved project license. This guide does not add a license or grant redistribution rights.
