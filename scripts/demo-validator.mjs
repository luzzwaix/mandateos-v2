import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
  cpSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";
import { createServer } from "node:net";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspace = process.argv[2] ? resolve(root, process.argv[2]) : root;
const binary = join(workspace, "target", "deploy", "mandateos.so");
const idlFile = join(workspace, "target", "idl", "mandateos.json");
if (!existsSync(binary) || !existsSync(idlFile))
  throw new Error("Run npm run build:program first");
await new Promise((res, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(8899, "127.0.0.1", () => probe.close(res));
});
const idl = JSON.parse(readFileSync(idlFile, "utf8"));
if (!idl.instructions.some((i) => i.name === "settle_bounty"))
  throw new Error("Build the Arena extension before starting the demo");
cpSync(idlFile, join(root, "web", "src", "lib", "solana", "mandateos.json"));
const envFile = join(root, "web", ".env.local");
if (!existsSync(envFile))
  writeFileSync(
    envFile,
    `NEXT_PUBLIC_SOLANA_RPC_URL=http://127.0.0.1:8899\nNEXT_PUBLIC_MANDATEOS_PROGRAM_ID=${idl.address}\nNEXT_PUBLIC_ENABLE_LOCAL_DEMO=true\n`,
  );
else
  console.log(
    "Preserving existing web/.env.local. Ensure it selects localhost RPC, this program ID, and enables the local demo.",
  );
const authority = Keypair.generate();
const directory = join(root, ".localnet", `demo-${Date.now()}`);
mkdirSync(directory, { recursive: true });
writeFileSync(
  join(directory, "test-authority.json"),
  JSON.stringify(Array.from(authority.secretKey)),
  { mode: 0o600 },
);
const ledger = join(directory, "ledger");
const executable =
  process.platform === "win32"
    ? join(
        process.env.LOCALAPPDATA,
        "MandateOS",
        "toolchains",
        "solana-release",
        "bin",
        "solana-test-validator.exe",
      )
    : "solana-test-validator";
if (process.platform === "win32" && !existsSync(executable))
  throw new Error("Run scripts/setup-windows.ps1 first");
const checked = spawnSync(executable, ["--version"], { encoding: "utf8" });
if (checked.status !== 0) throw new Error("Validator tool is unavailable");
console.log(checked.stdout.trim());
console.log(
  `LOCALNET: ${idl.address}\nRPC: http://127.0.0.1:8899\nLedger: ${ledger}\nDisposable wallet: ${join(directory, "test-authority.json")}\nOpen http://127.0.0.1:3000, click Initialize local demo, and select that generated wallet file.\nNever import a personal wallet into the demo. The file is read locally, stays in tab memory, and is not uploaded.\nLeave this terminal running. Ctrl+C stops only this validator.`,
);
let stopped = false,
  child;
const stop = () => {
  stopped = true;
  child?.kill();
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
async function health() {
  try {
    const response = await fetch("http://127.0.0.1:8899", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSlot",
        params: [{ commitment: "confirmed" }],
      }),
      signal: AbortSignal.timeout(1500),
    });
    return (await response.json()).result;
  } catch {
    return undefined;
  }
}
while (!stopped) {
  const log = join(directory, "validator.log");
  const fd = openSync(log, "w");
  // A fresh ignored ledger; never reset an existing user's validator or state.
  child = spawn(
    executable,
    [
      "--log",
      "--ledger",
      ledger,
      "--mint",
      authority.publicKey.toBase58(),
      "--bind-address",
      "127.0.0.1",
      "--rpc-port",
      "8899",
      ...(process.platform === "win32" ? ["--ticks-per-slot", "512"] : []),
      "--bpf-program",
      idl.address,
      binary,
    ],
    { cwd: root, stdio: ["ignore", fd, fd], windowsHide: true },
  );
  closeSync(fd);
  const closed = new Promise((res) => child.once("close", res));
  let spawnError;
  child.once("error", (e) => {
    spawnError = e;
  });
  const deadline = Date.now() + 90_000;
  let ready = false,
    recover = false;
  while (!stopped && child.exitCode === null) {
    if (spawnError) throw spawnError;
    const slot = await health();
    if (slot !== undefined && !ready) {
      ready = true;
      console.log(`Validator ready: confirmed slot ${slot}.`);
    }
    const contents = readFileSync(log, "utf8");
    if (
      process.platform === "win32" &&
      /Fatal error while archiving snapshot package/.test(contents) &&
      /os error 1314/.test(contents)
    ) {
      recover = true;
      break;
    }
    if (!ready && Date.now() > deadline) {
      child.kill();
      await closed;
      throw new Error(`Validator startup timed out. See ${log}`);
    }
    await sleep(1000);
  }
  child.kill();
  await closed;
  if (stopped) break;
  if (!recover) {
    console.error(readFileSync(log, "utf8").slice(-5000));
    throw new Error("Validator stopped unexpectedly; inspect the log");
  }
  console.error(
    "WINDOWS ENVIRONMENT BLOCKER: snapshot symlink error 1314 at slot 100. Start a fresh demo run and reinitialize, or use WSL2 / a shell with symlink privileges for an uninterrupted session. The ledger is preserved; no protocol state was simulated.",
  );
  process.exitCode = 1;
  break;
}
