// Disposable CLI action, not an autonomous runtime. Never imports a treasury key.
require("ts-node/register/transpile-only");
const assert = require("node:assert/strict");
const { readFileSync, realpathSync } = require("node:fs");
const { resolve, sep } = require("node:path");
const { PublicKey, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const { MandateClient } = require("../web/src/lib/solana/client");
const { toBaseUnits } = require("../web/src/lib/solana/pdas");
const { fromSnapshot, statusOf } = require("../web/src/lib/authority");
const { EvidenceTransport } = require("../tests/devnet-evidence");

async function main() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    assert(index >= 0 && args[index + 1], `Required ${flag}`);
    return args[index + 1];
  };
  const intent = value("--intent");
  assert(
    /^[a-z0-9][a-z0-9-]{0,63}$/.test(intent),
    "Use a stable intent name; reuse it for recovery",
  );
  const transport = new EvidenceTransport(
    resolve("artifacts/agent-actions", intent),
  );
  const client = new MandateClient(undefined, undefined, transport.connection);
  const snapshot = await client.load(new PublicKey(value("--organization")));
  const node = snapshot.nodes.find(
    (n) => n.publicKey.toBase58() === value("--mandate"),
  );
  assert(
    node && node.account.depth > 0,
    "Select an existing delegated mandate, not Root",
  );
  assert(
    !node.account.controller.equals(snapshot.organization.authority),
    "Use a dedicated delegated controller; the worker must not receive the treasury authority key",
  );
  const destination = new PublicKey(value("--destination"));
  const amount = toBaseUnits(value("--amount"), snapshot.decimals);
  const plan = {
    organization: snapshot.address.toBase58(),
    mandate: node.publicKey.toBase58(),
    controller: node.account.controller.toBase58(),
    destination: destination.toBase58(),
    amountBaseUnits: amount.toString(),
    decimals: snapshot.decimals,
    network: "devnet",
  };
  const previous = transport.entries["spend"]?.plan;
  if (previous)
    assert.deepEqual(
      plan,
      previous,
      "Intent parameters changed; stop and reconcile the saved signature",
    );
  const tx = await client.program.methods
    .spend(amount)
    .accountsStrict({
      controller: node.account.controller,
      organization: snapshot.address,
      node: node.publicKey,
      mint: snapshot.organization.mint,
      vault: snapshot.organization.vault,
      destination,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(client.ancestors(node, snapshot, true))
    .transaction();
  console.log(
    JSON.stringify({
      ...plan,
      effectiveState: statusOf(fromSnapshot(snapshot, {}), plan.mandate),
      selfAvailable: node.account.selfAvailable.toString(),
      executeRequested: args.includes("--execute"),
    }),
  );
  if (!args.includes("--execute")) {
    console.log(
      "Read-only inspection. No key read, signature or submission. Add --execute only with a dedicated controller key outside the repository.",
    );
    return;
  }
  transport.save("spend", { plan });
  // Keys remain in the operator's protected local directory. Output contains public evidence only.
  let signers = [];
  if (!transport.entries.spend?.signature) {
    const keyPath = realpathSync(value("--keypair"));
    const repoPath = realpathSync(resolve(__dirname, ".."));
    const normalized = (p) =>
      process.platform === "win32" ? p.toLowerCase() : p;
    assert(
      !normalized(keyPath).startsWith(normalized(repoPath) + sep),
      "Keep the dedicated controller key outside the repository",
    );
    let signer;
    try {
      signer = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(readFileSync(keyPath, "utf8"))),
      );
    } catch {
      throw Error(
        "Cannot load the dedicated controller key file; contents suppressed",
      );
    }
    assert(
      signer.publicKey.equals(node.account.controller),
      "Signer must match the mandate controller",
    );
    signers = [signer];
  }
  const receipt = await transport.execute("spend", tx, signers);
  const after = await client.load(snapshot.address);
  transport.save("spend", {
    after: {
      vaultBaseUnits: after.vaultBalance.toString(),
      totalSpent: after.organization.totalSpent.toString(),
    },
  });
  console.log(
    JSON.stringify({
      finalizedSignature: transport.entries["spend"].signature,
      slot: receipt.slot,
      err: receipt.meta.err,
      feeLamports: receipt.meta.fee,
      vaultBaseUnits: after.vaultBalance.toString(),
    }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
