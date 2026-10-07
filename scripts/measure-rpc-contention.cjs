// Controlled transport benchmark; synthetic latency, never wallet/chain evidence.
require("ts-node/register/transpile-only");
const { createRpcFetch } = require("../web/src/lib/solana/rpc");
const { mkdirSync, writeFileSync } = require("node:fs");
const { performance } = require("node:perf_hooks");
async function main() {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    let started;
    const ready = new Promise((r) => (started = r));
    const rpc = createRpcFetch(async (_url, init) => {
      if (JSON.parse(init.body).method === "getTransaction") {
        started();
        await new Promise((r) => setTimeout(r, 600));
      }
      return new Response("{}");
    }, 25);
    const receipt = rpc("http://unit.test", {
      body: '{"method":"getTransaction"}',
    });
    await ready;
    const start = performance.now();
    await rpc("http://unit.test", { body: '{"method":"getAccountInfo"}' });
    samples.push(Number((performance.now() - start).toFixed(2)));
    await receipt;
  }
  const result = {
    conditions:
      "5 samples; receipt latency 600ms; account latency 0ms; shared launch spacing 25ms; no wallet/network",
    samples,
    meanMs: samples.reduce((a, b) => a + b) / samples.length,
  };
  mkdirSync("target/startup-v1", { recursive: true });
  writeFileSync(
    `target/startup-v1/contention-${process.argv[2] || "run"}.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(result);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
