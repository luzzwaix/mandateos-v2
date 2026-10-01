import { spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { join, sep } from "node:path";
import { createServer } from "node:net";

function exited(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
}

export async function runValidatorTests(workspace, env, program, authority) {
  if (process.platform !== "win32") {
    const child = spawn("anchor", ["test", "--skip-build"], {
      cwd: workspace,
      env,
      stdio: "inherit",
    });
    return await exited(child);
  }
  // Agave 2.3 Windows snapshots need symlink privileges at slot 100.
  // Independent test cases run in fresh banks; each complete flow stays intact.
  const batchCount = 6;
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    console.log(`Windows validator batch ${batchIndex + 1}/${batchCount}`);
    const code = await runWindowsBatch(
      workspace,
      {
        ...env,
        MANDATEOS_TEST_BATCH_COUNT: String(batchCount),
        MANDATEOS_TEST_BATCH_INDEX: String(batchIndex),
      },
      program,
      authority,
    );
    if (code !== 0) return code;
  }
  return 0;
}

async function runWindowsBatch(workspace, env, program, authority) {
  // Agave's default Windows logger creates a privileged file symlink.
  // --log streams directly and avoids that path; the Solana VM is unchanged.
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(8899, "127.0.0.1", () => probe.close(resolve));
  });
  const workspaceRoot = realpathSync(workspace);
  const directory = join(workspaceRoot, ".localnet");
  mkdirSync(directory, { recursive: true });
  const ledger = join(realpathSync(directory), "validator-ledger");
  if (
    !ledger.toLowerCase().startsWith((workspaceRoot + sep).toLowerCase()) ||
    (existsSync(ledger) &&
      realpathSync(ledger).toLowerCase() !== ledger.toLowerCase())
  ) {
    throw new Error(
      "Refusing to reset a ledger outside the generated workspace or through a ledger link",
    );
  }
  const logfile = join(
    directory,
    `validator-batch-${Number(env.MANDATEOS_TEST_BATCH_INDEX) + 1}.log`,
  );
  const fd = openSync(logfile, "w");
  const validator = spawn(
    "solana-test-validator",
    [
      "--log",
      "--reset",
      "--ledger",
      ledger,
      "--mint",
      authority,
      "--bind-address",
      "127.0.0.1",
      "--rpc-port",
      "8899",
      "--bpf-program",
      program,
      join(workspace, "target", "deploy", "mandateos.so"),
    ],
    { cwd: workspace, env, stdio: ["ignore", fd, fd] },
  );
  closeSync(fd);
  const stopped = new Promise((resolve) => validator.once("close", resolve));
  let spawnError;
  validator.once("error", (error) => {
    spawnError = error;
  });
  let tests;
  const interrupt = () => {
    tests?.kill();
    validator.kill();
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    console.log(`Starting real Windows validator in log mode. Log: ${logfile}`);
    const deadline = Date.now() + 60_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (validator.exitCode !== null)
        throw new Error(`Validator exited with ${validator.exitCode}`);
      try {
        const response = await fetch("http://127.0.0.1:8899", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getLatestBlockhash",
            params: [{ commitment: "confirmed" }],
          }),
          signal: AbortSignal.timeout(1000),
        });
        if ((await response.json()).result?.value?.blockhash) {
          ready = true;
          break;
        }
      } catch {
        /* RPC is not ready yet. */
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready)
      throw new Error("Validator did not become ready within 60 seconds");
    tests = spawn(
      "anchor",
      ["test", "--skip-build", "--skip-local-validator", "--skip-deploy"],
      {
        cwd: workspace,
        env,
        stdio: "inherit",
      },
    );
    return await exited(tests);
  } catch (error) {
    console.error(readFileSync(logfile, "utf8").slice(-12_000));
    throw error;
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    validator.kill();
    await stopped;
  }
}
