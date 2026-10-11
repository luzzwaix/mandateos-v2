# Local development

Requires Node ≥20.18. Use the committed lockfiles.

```sh
npm ci
npm ci --prefix web
npm run build --prefix web
npm run start --prefix web
```

Open `http://localhost:3000`. The web build builds the SDK and prepares downloadable artifacts automatically. [Configuration](../web/.env.example) uses public Devnet defaults. Public reads and Demo need no wallet or private keys.

For SDK and the read-only worker:

```sh
npm run build:sdk
npm run build:agent
npm run agent:inspect
```

The last command performs public reads only. The reference worker contains no LLM and loads no signing wallet.

Root `npm run typecheck`, frontend lint/typecheck/build, and focused SDK/worker tests should match the scope of a change. [CONTRIBUTING](../CONTRIBUTING.md) lists checks. Program development uses [Anchor.toml](../Anchor.toml), the committed Cargo lockfile and [build-program.mjs](../scripts/build-program.mjs). The [historical release toolchain report](DEVNET-RELEASE.md) records binary generation limitations and real validator runs; it is not current deployment status.

No keys, local environment files, validator ledgers, compiled outputs or package tarballs belong in Git. Run `npm run check:secrets` and `git diff --check` before committing. Devnet writes and production deployment require separate approval.
