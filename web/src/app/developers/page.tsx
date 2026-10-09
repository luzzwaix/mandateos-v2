import Link from "next/link";
import { ArrowRight, Download, ArrowUpRight } from "lucide-react";
import { DevnetLink } from "@/components/world-shell";

const install = `mkdir mandateos-integration
cd mandateos-integration
npm init -y
# Save both downloads below in this directory.
npm install ./mandateos-sdk-0.1.0.tgz
node inspect-devnet.mjs`;
const example = `import { PublicKey } from "@solana/web3.js";
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
console.log(authority.path.map(row => row.publicKey.toBase58()));
console.log(authority.blockingAncestor?.toBase58());`;

export default function Developers() {
  return (
    <main className="developer-guide">
      <h1>Integrate with MandateOS</h1>
      <p className="developer-intro">
        Add bounded, recursive spending authority to your existing agent system.
        Your execution service invokes the SDK; the legitimate controller signs;
        Solana checks the limits and complete ancestry when the transaction
        executes.
      </p>
      <p>
        Revoke Research and its descendants become blocked. The independent
        Operations branch keeps its authority. Agents control mandates in one
        shared treasury.
      </p>
      <div className="developer-links">
        <DevnetLink>
          Inspect real Devnet <ArrowRight size={15} />
        </DevnetLink>
        <Link href="/">
          Try the interactive demo <ArrowRight size={15} />
        </Link>
      </div>
      <section aria-labelledby="sdk-start">
        <h2 id="sdk-start">Run a real Devnet read</h2>
        <p>
          Node ≥20.18. This SDK is distributed as a downloadable tarball,{" "}
          <strong>not a published npm package</strong>. Its declared
          dependencies install with the command below. No wallet or signing keys
          are needed.
        </p>
        <div className="developer-links downloads">
          <a href="/downloads/mandateos-sdk-0.1.0.tgz" download>
            Download SDK 0.1.0 <Download size={15} />
          </a>
          <a href="/downloads/inspect-devnet.mjs" download>
            Download runnable example <Download size={15} />
          </a>
          <a href="/downloads/manifest.json" target="_blank" rel="noreferrer">
            Download hashes <ArrowUpRight size={15} />
          </a>
        </div>
        <pre aria-label="External SDK installation commands">
          <code>{install}</code>
        </pre>
        <p>
          The full example prints the organization, Root → Research → Data →
          Scraper path, and the earliest revoked ancestor. It also reads the
          finalized historical receipt and reports the source-defined{" "}
          <code>AncestorRevoked / 6003</code> error. It submits no transaction.
        </p>
        <details>
          <summary>See the minimal exported API example</summary>
          <pre>
            <code>{example}</code>
          </pre>
        </details>
        <p className="developer-result">
          Expected fixture read: Scraper locally <strong>ACTIVE</strong>,
          effectively <strong>BLOCKED</strong>; ancestor{" "}
          <strong>Research</strong>. A missing or invalid path returns unknown
          authority. If RPC fails, the example reports the failure and exits; it
          does not substitute Demo data.
        </p>
      </section>
      <section aria-labelledby="sdk-execute">
        <h2 id="sdk-execute">Connect your execution service</h2>
        <p>
          Let your existing LLM or workflow propose a job. Inspect its mandate
          before execution. Supply a caller-controlled signing wallet and
          complete canonical ancestor path only for an approved job. The program
          checks ancestry again onchain; a successful read cannot guarantee a
          later payment.
        </p>
        <p>
          The repository&apos;s reference worker supports real read-only
          inspection and stops before spending when authority is blocked. Its
          payment lifecycle is covered by RPC-stub tests; a live agent payment
          and native Phantom browser signing remain unverified. The worker
          contains no LLM.
        </p>
        <p>
          Next step for real spending: a legitimate controller, an approved
          amount and destination token account, fees, and a separately approved
          transaction. Record its signature and reconcile any unknown outcome
          before retrying.
        </p>
      </section>
      <section aria-labelledby="sdk-proof">
        <h2 id="sdk-proof">Inspect the proof</h2>
        <p>
          Devnet uses a classic SPL test mint, not USDC. These receipts are
          historical CLI outcomes; the app and example perform fresh public
          reads.
        </p>
        <div className="developer-links">
          <a
            href="https://explorer.solana.com/tx/2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv?cluster=devnet"
            target="_blank"
            rel="noreferrer"
          >
            Blocked descendant · 6003 <ArrowUpRight size={15} />
          </a>
          <a
            href="https://explorer.solana.com/tx/4BwMQJXxy3WagC8nm2p5mPQhtg1HJF3H6xYRESU9gFP9sTr96NLXKoSiK95WToCjqUamC4BPSYSu6m6G65QF18FZ?cluster=devnet"
            target="_blank"
            rel="noreferrer"
          >
            Operations sibling spend <ArrowUpRight size={15} />
          </a>
          <a
            href="https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet"
            target="_blank"
            rel="noreferrer"
          >
            25-token Arena settlement <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </main>
  );
}
