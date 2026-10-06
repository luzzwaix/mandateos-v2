import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Public-only explicit Devnet audit: no signing keys or configuration mutations.
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const local = JSON.parse(read("web/src/lib/solana/mandateos.json"));
const declared = read("programs/mandateos/src/lib.rs").match(
  /declare_id!\("([^"]+)"\)/,
)?.[1];
const anchor = read("Anchor.toml");
const address = new PublicKey(declared);
const rpc = new Connection("https://api.devnet.solana.com", {
  commitment: "confirmed",
  disableRetryOnRateLimit: true,
});
const [genesis, account] = await Promise.all([
  rpc.getGenesisHash(),
  rpc.getAccountInfoAndContext(address),
]);
const wallet = {
  publicKey: PublicKey.default,
  signTransaction: async () => {
    throw Error("Read-only audit");
  },
  signAllTransactions: async () => {
    throw Error("Read-only audit");
  },
};
const published = await Program.fetchIdl(
  address,
  new AnchorProvider(rpc, wallet, { commitment: "confirmed" }),
);
const build = JSON.parse(read("web/src/lib/solana/build-evidence.json"));
const binaryPath = new URL("target/deploy/mandateos.so", root);
const binary = existsSync(binaryPath) ? readFileSync(binaryPath) : null;
const localBinaryMatches =
  !!binary &&
  binary.length === build.byteLength &&
  createHash("sha256").update(binary).digest("hex") === build.sha256;
const loader = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
let deployment = null;
if (
  account.value?.executable &&
  account.value.owner.equals(loader) &&
  account.value.data.length === 36 &&
  account.value.data.readUInt32LE(0) === 2
) {
  const programData = new PublicKey(account.value.data.subarray(4, 36));
  const observed = await rpc.getAccountInfoAndContext(programData);
  const data = observed.value;
  if (
    data?.owner.equals(loader) &&
    data.data.length >= 45 &&
    data.data.readUInt32LE(0) === 3
  ) {
    const elf = data.data.subarray(45);
    deployment = {
      programData: programData.toBase58(),
      readSlot: observed.context.slot,
      deploymentSlot: data.data.readBigUInt64LE(4).toString(),
      upgradeAuthority:
        data.data[12] === 1
          ? new PublicKey(data.data.subarray(13, 45)).toBase58()
          : null,
      binaryMatchesSourceBuild:
        localBinaryMatches &&
        elf.length >= binary.length &&
        elf.subarray(0, binary.length).equals(binary) &&
        elf.subarray(binary.length).every((n) => n === 0),
    };
  }
}
const clean = (v) =>
  Array.isArray(v)
    ? v.map(clean)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([k]) => !["docs", "metadata"].includes(k))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, value]) => [k, clean(value)]),
        )
      : v;
const publishedIdlMatches = published
  ? JSON.stringify(clean(published)) === JSON.stringify(clean(local))
  : null;
const sourceInstructions = [
  ...read("programs/mandateos/src/lib.rs").matchAll(/pub fn (\w+)\(/g),
]
  .map((m) => m[1])
  .sort();
const configured = /\[programs.devnet\]\s+mandateos\s*=\s*"([^"]+)"/.exec(
  anchor,
)?.[1];
const compatible =
  local.address === declared &&
  configured === declared &&
  JSON.stringify(sourceInstructions) ===
    JSON.stringify(local.instructions.map((i) => i.name).sort());
const report = {
  checkedAt: new Date().toISOString(),
  rpc: rpc.rpcEndpoint,
  genesis,
  networkVerified: genesis === "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG",
  program: address.toBase58(),
  slot: account.context.slot,
  exists: !!account.value,
  executable: account.value?.executable ?? false,
  deployment,
  publishedIdl: published
    ? {
        address: published.address,
        instructions: published.instructions.map(
          (instruction) => instruction.name,
        ),
      }
    : null,
  publishedIdlMatches,
  localIdl: {
    address: local.address,
    instructions: local.instructions.map((i) => i.name),
  },
  sourceInstructions,
  configuredDevnetProgram: configured,
  compatible,
  sourceBuild: build,
  localBinaryMatches,
  transactionsEnabled:
    !!deployment?.binaryMatchesSourceBuild &&
    compatible &&
    publishedIdlMatches !== false,
  blocker: !account.value
    ? "No deployed program or upgrade authority exists at the intended address. First deployment requires its exact deploy keypair and a funded dedicated Devnet payer/authority wallet."
    : null,
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--save"))
  writeFileSync(
    new URL("docs/devnet-integration-audit.json", root),
    JSON.stringify(report, null, 2) + "\n",
  );
if (!report.transactionsEnabled || !report.networkVerified)
  process.exitCode = 2;
