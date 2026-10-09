// Generate public integration downloads from committed SDK/example source.
// Invoked by the web build; never publish to npm or include signing material.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run through npm run build --prefix web.");
const run = (...args) =>
  execFileSync(process.execPath, [npm, ...args], {
    cwd: root,
    encoding: "utf8",
  });
run("run", "build:sdk");
const output = resolve(root, "web/public/downloads");
mkdirSync(output, { recursive: true });
const packed = JSON.parse(
  run("pack", "./packages/sdk", "--pack-destination", output, "--json"),
);
if (packed.length !== 1 || packed[0].filename !== "mandateos-sdk-0.1.0.tgz")
  throw new Error(
    "SDK download name changed; update the integration instructions.",
  );
copyFileSync(
  resolve(root, "examples/inspect-devnet.mjs"),
  resolve(output, "inspect-devnet.mjs"),
);
const files = ["mandateos-sdk-0.1.0.tgz", "inspect-devnet.mjs"].map((name) => ({
  name,
  sha256: createHash("sha256")
    .update(readFileSync(resolve(output, name)))
    .digest("hex"),
}));
writeFileSync(
  resolve(output, "manifest.json"),
  JSON.stringify(
    {
      package: "@mandateos/sdk",
      version: "0.1.0",
      distribution: "downloadable tarball; not published on npm",
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Prepared SDK tarball and exact read-only example for /developers.",
);
