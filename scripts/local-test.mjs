import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Keypair } from "@solana/web3.js";
import { runValidatorTests } from "./run-validator-tests.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const toolEnv = { ...process.env };
if (process.platform === "win32") {
  const localTools = join(process.env.LOCALAPPDATA, "MandateOS", "toolchains");
  toolEnv.PATH = [
    localTools,
    join(localTools, "solana-release", "bin"),
    join(process.env.USERPROFILE, ".cargo", "bin"),
    "C:\\Program Files\\Git\\bin",
    process.env.PATH,
  ].join(delimiter);
  toolEnv.RUSTUP_TOOLCHAIN ??= "1.89.0-x86_64-pc-windows-gnu";
  const vswhere = join(
    process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe",
  );
  if (existsSync(vswhere)) {
    const vs = spawnSync(
      vswhere,
      [
        "-latest",
        "-products",
        "*",
        "-requires",
        "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
        "-property",
        "installationPath",
      ],
      { encoding: "utf8" },
    ).stdout.trim();
    if (vs) {
      const vcBase = join(vs, "VC", "Tools", "MSVC");
      const vcVersion = readdirSync(vcBase).sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      )[0];
      const vc = join(vcBase, vcVersion);
      toolEnv.PATH = [join(vc, "bin", "Hostx64", "x64"), toolEnv.PATH].join(
        delimiter,
      );
      toolEnv.LIB = [
        join(vc, "lib", "x64"),
        join(localTools, "windows-sdk-x64", "c", "um", "x64"),
        join(localTools, "windows-sdk-x64", "c", "ucrt", "x64"),
        process.env.LIB ?? "",
      ].join(delimiter);
    }
  }
}
const required = [
  "anchor",
  "solana",
  "solana-test-validator",
  "cargo-build-sbf",
];
for (const tool of required) {
  const check = spawnSync(tool, ["--version"], {
    encoding: "utf8",
    env: toolEnv,
  });
  if (check.error || check.status !== 0) {
    console.error(
      `ENVIRONMENT BLOCKER: ${tool} --version failed: ${check.error?.message ?? check.stderr}`,
    );
    console.error(
      "Run scripts/setup-windows.ps1 or use Ubuntu under WSL2. See docs/HANDOFF.md.",
    );
    process.exit(1);
  }
}

if (process.argv[2] === "--reuse") {
  if (!process.argv[3])
    throw new Error("--reuse requires the printed .localnet workspace path");
  const workspace = resolve(root, process.argv[3]);
  if (
    !workspace.startsWith(
      resolve(root, ".localnet") + (process.platform === "win32" ? "\\" : "/"),
    )
  ) {
    throw new Error(
      "Retests must use a generated workspace inside this project's .localnet directory",
    );
  }
  const wallet = join(workspace, ".localnet", "test-authority.json");
  const authority = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(wallet, "utf8"))),
  );
  const idl = JSON.parse(
    readFileSync(join(workspace, "target", "idl", "mandateos.json"), "utf8"),
  );
  process.exitCode = await runValidatorTests(
    workspace,
    {
      ...toolEnv,
      ANCHOR_WALLET: wallet,
      ANCHOR_PROVIDER_URL: "http://127.0.0.1:8899",
    },
    idl.address,
    authority.publicKey.toBase58(),
  );
} else {
  // Each run uses fresh keys and a new ignored copy; tracked source never changes.
  const workspace = join(root, ".localnet", `run-${Date.now()}`, "workspace");
  mkdirSync(workspace, { recursive: true });
  for (const path of [
    "Anchor.toml",
    "Cargo.toml",
    "Cargo.lock",
    "rust-toolchain.toml",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "programs",
    "tests",
  ]) {
    if (existsSync(join(root, path)))
      cpSync(join(root, path), join(workspace, path), { recursive: true });
  }
  mkdirSync(join(workspace, ".localnet"), { recursive: true });
  mkdirSync(join(workspace, "target", "deploy"), { recursive: true });
  const authority = Keypair.generate();
  const program = Keypair.generate();
  const wallet = join(workspace, ".localnet", "test-authority.json");
  writeFileSync(wallet, JSON.stringify(Array.from(authority.secretKey)), {
    mode: 0o600,
  });
  writeFileSync(
    join(workspace, "target", "deploy", "mandateos-keypair.json"),
    JSON.stringify(Array.from(program.secretKey)),
    { mode: 0o600 },
  );
  const baselineId = readFileSync(
    join(root, "programs/mandateos/src/lib.rs"),
    "utf8",
  ).match(/declare_id!\("([^"]+)"\)/)?.[1];
  if (!baselineId) throw new Error("Source program ID missing");
  for (const path of ["Anchor.toml", "programs/mandateos/src/lib.rs"]) {
    const file = join(workspace, path);
    writeFileSync(
      file,
      readFileSync(file, "utf8").replaceAll(
        baselineId,
        program.publicKey.toBase58(),
      ),
    );
  }
  const env = {
    ...toolEnv,
    ANCHOR_WALLET: wallet,
    ANCHOR_PROVIDER_URL: "http://127.0.0.1:8899",
  };
  console.log(`Isolated localnet workspace: ${workspace}`);
  console.log(`Test program: ${program.publicKey.toBase58()}`);
  // Node's module resolution walks up to the root project's node_modules.
  const build = spawnSync("anchor", ["build"], {
    cwd: workspace,
    env,
    stdio: "inherit",
  });
  if (build.error || build.status !== 0) {
    if (build.error) console.error(build.error.message);
    process.exit(build.status ?? 1);
  }
  process.exitCode = await runValidatorTests(
    workspace,
    env,
    program.publicKey.toBase58(),
    authority.publicKey.toBase58(),
  );
}
