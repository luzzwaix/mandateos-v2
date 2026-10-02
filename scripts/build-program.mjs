import { spawnSync } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let result;
if (process.platform === "win32") {
  result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      ". .\\scripts\\setup-windows.ps1; anchor build; exit $LASTEXITCODE",
    ],
    { cwd: root, stdio: "inherit" },
  );
} else result = spawnSync("anchor", ["build"], { cwd: root, stdio: "inherit" });
if (result.error || result.status !== 0) {
  console.error(result.error?.message ?? "Anchor build failed");
  process.exit(result.status ?? 1);
}
const target = join(root, "web", "src", "lib", "solana", "mandateos.json");
if (existsSync(dirname(target)))
  cpSync(join(root, "target", "idl", "mandateos.json"), target);
console.log(
  "Real built IDL synchronized into web/src/lib/solana/mandateos.json",
);
