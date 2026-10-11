![MandateOS — Don't give agents wallets. Give them mandates.](docs/media/hero.png)

# MandateOS

**Recursive financial authority for agent organizations, enforced on Solana.**

One treasury. Delegate bounded permissions through an organization. Revoke a parent and its descendants lose authority; independent branches keep working.

**[Try Demo](https://mandateos-protocol.vercel.app/) · [Inspect Devnet](https://mandateos-protocol.vercel.app/app) · [Integrate SDK](https://mandateos-protocol.vercel.app/developers)**

Demo and public account reads require no wallet.

## One cut. Control stays.

![Real MandateOS Demo states: delegation, Research revoke preview, blocked Scraper and surviving Operations.](docs/media/demo-cascade.gif)

**SIMULATED DEMO — no transactions.** Six captured product states, joined into a short GIF. [Still image](docs/media/demo-cascade-still.png) · [Interactive version](https://mandateos-protocol.vercel.app/)

Research delegates to Data; Data delegates to Scraper. Operations is a separate Treasury child. Revoke Research: Scraper remains **locally Active, effectively Blocked**. Operations remains active.

## One vault. A complete authority path.

Mandates reserve accounting authority in a shared SPL token vault; they are not separately funded agent wallets. Delegation uses the parent's available capacity. A spend validates the complete ancestry and updates accounting atomically. Revocation releases the branch reservation without itself transferring tokens.

Solana checks the signer, limits, account relationships and active ancestors when execution lands. An agent's decision—or an earlier SDK read—cannot override that enforcement.

## Inspect the chain proof

**Historical finalized CLI transactions on Devnet, not fresh browser or autonomous worker payments.**

| Proof               | Outcome                                        | Explorer                                                                                                                                                   |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revoked ancestry    | Scraper spend failed: `AncestorRevoked / 6003` | [Rejected spend](https://explorer.solana.com/tx/2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv?cluster=devnet)   |
| Independent sibling | Operations spent **5 test tokens**             | [Successful spend](https://explorer.solana.com/tx/4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ?cluster=devnet) |
| Arena               | Recorded winner received **25 test tokens**    | [Settlement](https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet)       |

[Deployed program](https://explorer.solana.com/address/125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd?cluster=devnet) · [Historical organization](https://explorer.solana.com/address/EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A?cluster=devnet) · [Account identifiers and receipts](docs/DEVNET-MVP-VERIFICATION.md)

These are classic SPL **test tokens, not USDC**. Demo has an illustrative Analysis node; the historical Devnet fixture has five mandates.

[Arena](https://mandateos-protocol.vercel.app/arena) demonstrates an application of the same treasury: funded work, submission commitments, a trusted verifier and atomic settlement. A commitment hash does not prove work quality; the verifier is trusted.

## Integrate with your existing agents

![External AI Agent → Execution Service → MandateOS SDK → Solana Program → Authority Outcome.](docs/media/developer-integration.png)

**Agent → execution service → SDK → Solana → authority outcome.**

Your agent proposes a job. Your service invokes the SDK; a legitimate controller signs an approved transaction. The [reference worker](examples/agent-worker/README.md) contains no LLM. Its CLI reads real Devnet and stops before spending when authority is blocked; payment lifecycle tests use RPC stubs.

### Run outside the repository

**Node ≥20.18.** Save these two files in a new directory:

- [SDK tarball 0.1.0](https://mandateos-protocol.vercel.app/downloads/mandateos-sdk-0.1.0.tgz)
- [Runnable read-only example](https://mandateos-protocol.vercel.app/downloads/inspect-devnet.mjs)

```sh
npm init -y
npm install ./mandateos-sdk-0.1.0.tgz
node inspect-devnet.mjs
```

Tarball distribution; **not published on npm**. [Download hashes](https://mandateos-protocol.vercel.app/downloads/manifest.json).

The example uses the actual exported API to read the organization, trace Treasury → Research → Data → Scraper, derive `active / blocked`, identify Research, and interpret the historical finalized 6003 receipt. No wallet, key or transaction submission is needed. [Source example](examples/inspect-devnet.mjs) · [SDK API and errors](packages/sdk/README.md).

<details>
<summary>Minimal exported API example — Node ESM</summary>

```js
import { PublicKey } from "@solana/web3.js";
import sdk from "@mandateos/sdk";
const { MandateClient, PROGRAM_ADDRESS, inspectAuthority } = sdk;
const client = new MandateClient({
  cluster: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  programId: PROGRAM_ADDRESS,
});
const snapshot = await client.load(
  new PublicKey("EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A"),
);
const authority = inspectAuthority(
  snapshot,
  new PublicKey("H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB"),
);
console.log(authority.local, authority.effective);
```

An invalid or incomplete path yields unknown authority. RPC failures are reported; Demo data is never substituted. Set `MANDATEOS_RPC_URL` in your execution environment if needed; keep private credentials out of frontend configuration.

</details>

## Source and documentation

| Component                  | Location                                                 |
| -------------------------- | -------------------------------------------------------- |
| Solana program             | [programs/mandateos](programs/mandateos/src/lib.rs)      |
| TypeScript SDK             | [packages/sdk](packages/sdk/README.md)                   |
| Reference worker           | [examples/agent-worker](examples/agent-worker/README.md) |
| Operator console and Story | [web/src](web/src/app/layout.tsx)                        |
| Protocol and evidence      | [Documentation index](docs/README.md)                    |

[Local setup](docs/DEVELOPMENT.md) · [Contributing](CONTRIBUTING.md) · [Verified scope and limitations](docs/MVP-STATUS.md) · [Final technical-demo script](COLOSSEUM-TECHNICAL-DEMO-FINAL.md)

## Devnet MVP

Real deployed program, public account reads, historical Core/Arena receipts, and **64 preserved local-validator integration tests**. Native Phantom Connect is reported working by the founder; the complete browser-signed owner lifecycle remains unverified. No production audit, mainnet readiness, autonomous LLM payment, traction or revenue is claimed.

This is the public source repository. **No project license has been chosen or added.** License approval remains an owner decision.
