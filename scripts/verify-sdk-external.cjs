// Run against a tarball installed outside this repository, with its declared deps.
const assert = require("node:assert/strict");
const { realpathSync } = require("node:fs");
const { resolve } = require("node:path");
const external = resolve(
  process.argv[2] || "../mandateos-sdk-external-20261009",
);
const entry = require.resolve("@mandateos/sdk", { paths: [external] });
assert(
  realpathSync(entry).startsWith(external + require("node:path").sep),
  "SDK import must resolve inside the independent installation",
);
const {
  MandateClient,
  inspectAuthority,
  PROGRAM_ADDRESS,
  interpretProtocolError,
} = require(entry);
const { PublicKey } = require(
  require.resolve("@solana/web3.js", { paths: [external] }),
);
(async () => {
  const client = new MandateClient({
    cluster: "devnet",
    programId: PROGRAM_ADDRESS,
    rpcUrl: "https://api.devnet.solana.com",
  });
  await client.verifyDeployment();
  const snapshot = await client.load(
    new PublicKey("EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A"),
  );
  const inspected = inspectAuthority(
    snapshot,
    new PublicKey("H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB"),
  );
  assert.equal(inspected.local, "active");
  assert.equal(inspected.effective, "blocked");
  assert.equal(
    inspected.blockingAncestor.toBase58(),
    "DaGAwUmPFdTyeM3Nsk6i1wokYa3ZSxiM9rKLgz52VBJ7",
  );
  assert.equal(inspected.path.length, 4);
  assert.equal(typeof interpretProtocolError, "function");
  console.log(
    JSON.stringify({
      entry,
      program: PROGRAM_ADDRESS,
      source: "independently-installed-tarball",
      local: inspected.local,
      effective: inspected.effective,
      blockingAncestor: inspected.blockingAncestor.toBase58(),
      pathLength: inspected.path.length,
      noSigning: true,
      noSubmission: true,
    }),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
