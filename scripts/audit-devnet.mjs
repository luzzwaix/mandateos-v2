import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { readFileSync } from "node:fs";

// Read-only public evidence. Never loads a signing key, changes CLI config or deploys.
const address = new PublicKey("CvRjAHwEQbawsH5otEPDjD7dp8S89yWrqano6XSatf63");
const rpc = new Connection("https://api.devnet.solana.com", {
  commitment: "confirmed",
  disableRetryOnRateLimit: true,
});
const required = [
  "create_root",
  "reserve_child",
  "spend",
  "revoke_branch",
  "reclaim_budget",
];
const local = JSON.parse(
  readFileSync(
    new URL("../web/src/lib/solana/mandateos.json", import.meta.url),
    "utf8",
  ),
);
const [genesis, account] = await Promise.all([
  rpc.getGenesisHash(),
  rpc.getAccountInfoAndContext(address, "confirmed"),
]);
const readOnlyWallet = {
  publicKey: PublicKey.default,
  signTransaction: async () => {
    throw Error("Read-only audit");
  },
  signAllTransactions: async () => {
    throw Error("Read-only audit");
  },
};
const provider = new AnchorProvider(rpc, readOnlyWallet, {
  commitment: "confirmed",
});
const published = await Program.fetchIdl(address, provider);
const compatible =
  local.address === address.toBase58() &&
  required.every((name) => local.instructions.some((i) => i.name === name));
const report = {
  checkedAt: new Date().toISOString(),
  rpc: rpc.rpcEndpoint,
  genesis,
  networkVerified: genesis === "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  program: address.toBase58(),
  slot: account.context.slot,
  exists: !!account.value,
  executable: account.value?.executable ?? false,
  publishedIdl: published
    ? {
        address: published.address,
        instructions: published.instructions.map((i) => i.name),
      }
    : null,
  localIdl: {
    address: local.address,
    instructions: local.instructions.map((i) => i.name),
  },
  requiredInstructions: required,
  compatible,
  transactionsEnabled: !!account.value?.executable && compatible,
};
console.log(JSON.stringify(report, null, 2));
if (!report.transactionsEnabled || !report.networkVerified)
  process.exitCode = 2;
