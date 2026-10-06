import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { syncIdl } from "./sync-idl.mjs";
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
      ".\\scripts\\build-source-windows.ps1; exit $LASTEXITCODE",
    ],
    { cwd: root, stdio: "inherit" },
  );
} else {
  // Do not let Anchor/Agave silently create a replacement deployment identity.
  if (!existsSync(join(root, "target/deploy/mandateos-keypair.json"))) {
    console.error(
      "Build blocked: configure the intended program deploy key; no replacement key will be generated. Windows supports the key-free compiler path.",
    );
    process.exit(2);
  }
  result = spawnSync("anchor", ["build"], { cwd: root, stdio: "inherit" });
}
if (result.error || result.status !== 0) {
  console.error(result.error?.message ?? "Anchor build failed");
  process.exit(result.status ?? 1);
}
const target = join(root, "web", "src", "lib", "solana", "mandateos.json");
const built = JSON.parse(
  readFileSync(join(root, "target/idl/mandateos.json"), "utf8"),
);
const declared = readFileSync(
  join(root, "programs/mandateos/src/lib.rs"),
  "utf8",
).match(/declare_id!\("([^"]+)"\)/)?.[1];
if (built.address !== declared)
  throw new Error("Generated IDL does not match declare_id");
if (existsSync(dirname(target)))
  syncIdl(join(root, "target", "idl", "mandateos.json"), target);
const binary = readFileSync(join(root, "target/deploy/mandateos.so"));
writeFileSync(
  join(dirname(target), "build-evidence.json"),
  JSON.stringify(
    {
      address: built.address,
      sha256: createHash("sha256").update(binary).digest("hex"),
      byteLength: binary.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Real built IDL synchronized into web/src/lib/solana/mandateos.json",
);
