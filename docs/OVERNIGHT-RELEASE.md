# Reproducible Devnet candidate — 9 October 2026

The recording rehearsal found one release blocker: a more specific legacy account-backed Arena grid rule placed Mission over a submission, intercepting pointer selection. The final stylesheet now applies the approved Mission column to both Demo and real-account layouts, including the tablet breakpoint. Pointer inspection is rechecked; winner/settlement handlers are unchanged.

This release consolidates the already implemented UI, SDK and worker. The original baseline is `startup-v1-lab` / `744997767e90889eff8fdf97e36ad9aba8e44440`; 11 tracked modifications and 16 untracked files. Every listed file was reviewed/classified. Runtime imports require the three untracked stylesheets and `mission-channels.tsx`; they belong in Git with all modified application source. SDK, worker, package manifests/locks and Rust source already belong to Git. No new design or protocol features are included.

The complete starting diff, source copies, hashes and classification are preserved in ignored `artifacts/overnight-release/`. Existing recordings, ledgers, keys, local environment files and build output remain ignored. Small historical QA reports/scripts are committed with their original dates; their old permission/gate statements do not override this sprint. No unrelated work is discarded. `MORNING-RELEASE-HANDOFF.md` is a generated local verification receipt written after execution, rather than an input to the application build. It must identify the actual candidate SHA and deployment without creating a self-referencing Git commit.

## Fresh checkout

Use the exact SHA from the final handoff; never use another checkout's `web/out` or uncommitted source. Node >=20.18; the Vercel project uses Node 24.x.

```powershell
git worktree add --detach ../mandateos-release-candidate EXACT_SHA
Set-Location ../mandateos-release-candidate
npm ci
npm --prefix web ci
Copy-Item web/.env.example web/.env.local
npm run typecheck
npm run build:agent
npm --prefix web run lint
npm --prefix web run typecheck
npm --prefix web run build
$env:PORT = '3102'
npm --prefix web start
```

Both lockfiles and the SDK source are needed. `web` imports `../packages/sdk/src`; uploading only web source for a remote build omits required code. The documented environment has four public settings: Devnet RPC, unchanged program `125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd`, organization `EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A`, and disposable local signing disabled. No frontend secrets. Never copy a wallet or private environment into the checkout.

## Verification

`test:devnet-client` includes seven actual-ELF parity tests and requires a fresh `target/deploy/mandateos.so`. In a new checkout run `npm run build:program` first with the supported toolchain. Without that step those seven tests fail ENOENT; preserve that initial failed log and record the fresh-build rerun. Never copy a historical binary and describe it as fresh.

Protected preview checks use `scripts/verify-preview.mjs` and `scripts/release-rehearsal.mjs` via `vercel env run --cwd web --scope luzzwaixs-projects -- node ../scripts/SCRIPT.mjs PREVIEW_URL OUTPUT_DIRECTORY`. The short-lived development OIDC stays in process memory and is attached only to the deployment origin, never RPC/Explorer. Signed-out access is measured separately before authenticated hashes/rehearsal. No project protection change is required or authorized.

Fresh dependency audit: root 6 high / 8 moderate / 1 low; web 10 high / 7 moderate. These are unresolved transitive toolchain/Anchor/Solana advisories, including native bigint-buffer and toml dependencies; npm suggests incompatible major downgrades for several paths. No forced dependency replacement is justified in this frozen release. Treat remediation/compatibility verification as P1 and do not present the candidate as security-audited or production-ready.

Required program checks: `cargo fmt --all -- --check`, `cargo check --locked`, `npm run test:local`. The existing local runner creates an ignored disposable test copy and generates isolated local wallets. Its eight Windows validator batches execute real program instructions. Its disposable program address is not the canonical Devnet deployment. Tests cover controller/owner/discriminator/organization/path/depth validation, checked accounting, revoked ancestry, sibling survival, vault self-transfer rejection, reservation and atomic verifier settlement. Do not call RPC-stub SDK tests chain proof.

Run `npm run test:ui`, `npm run test:devnet-client`, `npm run test:sdk`, `npm run test:agent`, `npm run agent:inspect`, `npm run verify:devnet:read`, `npm run check:secrets`, `git diff --check`. Only `verify:devnet:read` is authorized here: the other Devnet lifecycle scripts write. Real read verification reconciles all 19 existing finalized signatures and records current accounts. It never reads signer files or submits a transaction. Worker inspection stops on revoked ancestry. Spend execution is implemented/tested with RPC stubs; a fresh live worker spend and native Phantom browser lifecycle are unverified.

Fresh canonical SBF/IDL artifacts and logs go to ignored `target/overnight-release/`, using pinned platform-tools v1.52 / Rust 1.89.0 / Anchor 0.32.1, locked Cargo dependencies. Compare complete parsed IDL and stripped ELF hash/size against committed SDK build evidence. The local-validator build alone cannot establish canonical deployed-byte correspondence because it changes identity only in its disposable copy. Record build failure exactly; never substitute an old binary.

Browser QA uses external Playwright **1.61.1**, Chromium installed by that runtime; it is a test dependency, not an application build dependency. Install it separately if absent: `npm install --prefix ../mandateos-qa-runtime playwright@1.61.1`, then run its CLI `install chromium`; set `PLAYWRIGHT_MODULE` to its absolute `node_modules/playwright/index.mjs`. Older visual harnesses default to the existing Codex runtime and localhost:3101. Portable release rehearsal accepts the base URL explicitly. Run:

```powershell
node scripts/verify-startup-story.mjs http://127.0.0.1:3102
$env:MANDATEOS_QA_BASE = 'http://127.0.0.1:3102'
node scripts/final-finish-qa.mjs artifacts/overnight-release/final-ui
node scripts/release-rehearsal.mjs http://127.0.0.1:3102 artifacts/overnight-release/rehearsal
```

The guards block signing RPCs. Responsive/reduced-motion checks, lineage, retained winner, interrupted transitions, stale reads and absent Phantom do not establish native extension performance, touch hardware or native browser zoom.

## Non-production preview, with no Git push

Use the authenticated existing Vercel CLI. Before mutation, copy only the public `.vercel/project.json` link from the existing `web/.vercel/` into the fresh checkout's corresponding folder, and inspect the actual linked project:

```powershell
vercel project inspect --cwd web --scope luzzwaixs-projects --non-interactive
node scripts/prepare-preview.mjs
vercel deploy --cwd web --prebuilt --target preview --scope luzzwaixs-projects --non-interactive --yes --meta releaseSourceSha=EXACT_SHA
```

Expected project `prj_v4gBCH12utH88xbMagyDNMKYieG6`, team `team_QJiQiSLRu2OfhaxToUGNamf7`, root `.` / framework Other. Stop on a mismatch. `prepare-preview` requires a clean committed checkout and a fresh output directory. It packages the local static build via [Vercel Build Output API](https://vercel.com/docs/build-output-api/configuration), including clean HTML route overrides and Windows-exported RSC page segments. No server functions/native executable are uploaded. Do not use `--prod`, promote, push, link a new project or change protection settings.

The generated `/release.json` identifies the commit/tree and hashes of the locally built files. Verify deployment API metadata and independently fetch/compare served route HTML and all JavaScript/CSS asset hashes against that exact checkout. Self-declared metadata alone is insufficient. Inspect `/`, `/app`, `/arena`, client navigation and refresh in a clean browser. Test signed-out access first; an SSO page is an access requirement, not a public preview. Use existing authenticated access or `vercel curl` for protected read verification. Save deployment ID, immutable URL, source SHA, access result and correspondence evidence in the final receipt. If source changes, build and deploy another preview; never relabel an older deployment.

## Founder approvals and GitHub publication

No push, merge, production deployment/promotion, program upgrade or Devnet transaction is authorized by this release. Review local commits with `git log --oneline 7449977..HEAD` and `git diff --stat 7449977..HEAD`. To publish, the founder must explicitly authorize the existing remote/branch push after checking `git remote -v`; no force push. Then create/review a scoped PR, preserving the frozen frontend and unchanged protocol. Promotion requires separate explicit approval of the exact verified candidate/deployment. A protected preview needs the founder's Vercel login, not a protection-setting change.

Before any future Phantom action provide: exact instruction; legitimate controller and fee payer; Devnet genesis/program; organization/full ancestry; amount in human/base units and mint; source/destination PDAs/token accounts; current fee/rent quote (including ATA creation); expected state/accounting/token change; signatures/receipt/logs/balances to retain. Obtain explicit action-specific approval, then native wallet approval once. The founder's connected wallet may not control this historical fixture. Use an owner-controlled organization for the future E2E. On unknown outcome, reconcile the saved signed signature, finality/expiry and accounts before considering a retry. Never export a seed/key or fabricate a receipt.
