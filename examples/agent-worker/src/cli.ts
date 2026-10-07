import { parseArgs } from "node:util";
import { PublicKey } from "@solana/web3.js";
import { MandateClient, PROGRAM_ADDRESS } from "@mandateos/sdk";
import { inspectWork } from "./worker";

async function main() {
  const { values } = parseArgs({
    options: {
      rpc: { type: "string", default: "https://api.devnet.solana.com" },
      organization: {
        type: "string",
        default: "EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A",
      },
      mandate: {
        type: "string",
        default: "H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB",
      },
    },
  });
  const client = new MandateClient({
    cluster: "devnet",
    programId: PROGRAM_ADDRESS,
    rpcUrl: values.rpc!,
  });
  const { snapshot, authority } = await inspectWork(
    client,
    new PublicKey(values.organization!),
    new PublicKey(values.mandate!),
  );
  console.log(
    JSON.stringify(
      {
        cluster: "devnet",
        mode: "read-only",
        program: PROGRAM_ADDRESS,
        organization: snapshot.address.toBase58(),
        mandate: values.mandate,
        local: authority.local,
        effective: authority.effective,
        path: authority.path.map((node) => node.publicKey.toBase58()),
        blockingAncestor: authority.blockingAncestor?.toBase58(),
        reason: authority.reason,
        next:
          authority.effective === "active"
            ? "Provide a caller-controlled SigningWallet and explicit SpendJob to runAuthorizedSpend"
            : "Stop: no authorized spend is attempted",
      },
      null,
      2,
    ),
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
