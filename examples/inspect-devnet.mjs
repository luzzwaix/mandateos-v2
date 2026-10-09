// Node >=20.18. Install the downloadable SDK tarball in this directory first.
// Public reads only: no wallet, signing keys, simulation or transaction submission.
import { PublicKey } from "@solana/web3.js";
import sdk from "@mandateos/sdk";

const {
  MandateClient,
  PROGRAM_ADDRESS,
  inspectAuthority,
  interpretProtocolError,
} = sdk;
const organization = "EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A";
const scraper = "H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB";
const historicalSignature =
  "2ACUqFQ5zb66UdhCnxp6F8e6JMSiDQyNf7WURfa3DuhnSwkcgyiz2DCk42R19ZvSYKrExWnJ41PC9SW5uiSJmmgv";
const client = new MandateClient({
  cluster: "devnet",
  rpcUrl: process.env.MANDATEOS_RPC_URL || "https://api.devnet.solana.com",
  programId: PROGRAM_ADDRESS,
});

try {
  const snapshot = await client.load(
    new PublicKey(organization),
    undefined,
    (phase) => console.error(`Reading Devnet: ${phase}`),
  );
  const authority = inspectAuthority(snapshot, new PublicKey(scraper));
  console.log(
    JSON.stringify(
      {
        mode: "read-only",
        program: PROGRAM_ADDRESS,
        organization: snapshot.address.toBase58(),
        mandate: scraper,
        local: authority.local,
        effective: authority.effective,
        path: authority.path.map((row) => row.publicKey.toBase58()),
        blockingAncestor: authority.blockingAncestor?.toBase58(),
        reason: authority.reason,
        next:
          authority.effective === "active"
            ? "Inspection only. A payment requires an explicitly approved job and legitimate signer."
            : "Stop: no authorized spend is attempted.",
      },
      null,
      2,
    ),
  );

  // Interpret an actual historical receipt, never manufacture a rejected payment.
  const receipt = await client.rpc.getTransaction(historicalSignature, {
    commitment: "finalized",
    maxSupportedTransactionVersion: 0,
  });
  const rejection = receipt?.meta?.err
    ? interpretProtocolError({ logs: receipt.meta.logMessages ?? [] })
    : undefined;
  console.log(
    JSON.stringify(
      {
        evidence: "historical CLI transaction; not execution by this example",
        signature: historicalSignature,
        observedSlot: receipt?.slot,
        protocolError: rejection,
        receiptAvailable: !!receipt,
        explorer: `https://explorer.solana.com/tx/${historicalSignature}?cluster=devnet`,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        readFailed: true,
        message: error instanceof Error ? error.message : String(error),
        protocolError: interpretProtocolError(error),
        next: "Check RPC access and retry these reads. No transaction was sent.",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
