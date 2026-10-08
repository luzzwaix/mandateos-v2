// Creates and verifies only the finish delta against the preserved dirty baseline.
// Does not stage, commit, restore the working tree, or run transactions.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import ts from "typescript";
const root = process.cwd(),
  baseline = resolve(process.argv[2]),
  verification = resolve(process.argv[3]);
const output = resolve(root, "checkpoints/final-finish-2026-10-08");
const files = [
  "web/src/app/layout.tsx",
  ...[
    "arena-world.tsx",
    "capital-authority-instrument.tsx",
    "command-continuity.tsx",
    "command-world.tsx",
    "story-world.tsx",
    "world-shell.tsx",
    "mission-channels.tsx",
  ].map((p) => `web/src/components/${p}`),
];
const beforePath = (p) =>
  resolve(baseline, "web-src", p.slice("web/src/".length));
const hash = (text) => createHash("sha256").update(text).digest("hex");
const normalize = (text) => text.replaceAll("\r\n", "\n");
let patch = "";
const manifest = [];
mkdirSync(output, { recursive: true });
for (const path of files) {
  const before = readFileSync(beforePath(path), "utf8"),
    after = readFileSync(resolve(root, path), "utf8");
  const diff = spawnSync(
    "git",
    ["diff", "--no-index", "--", beforePath(path), resolve(root, path)],
    { encoding: "utf8" },
  );
  assert.equal(diff.status, 1, `${path} must have a finish change`);
  // Git accepts empty context lines without a space; keep the artifact lint-clean.
  const hunks = diff.stdout.slice(diff.stdout.indexOf("@@")).replace(/^ $/gm, "");
  patch += `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n${hunks}`;
  manifest.push({
    path,
    beforeSHA256: hash(normalize(before)),
    afterSHA256: hash(normalize(after)),
  });
  const target = resolve(verification, path);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(beforePath(path), target);
}
const patchFile = resolve(output, "finish.delta.patch");
writeFileSync(patchFile, patch);
for (const args of [
  ["apply", "--check", patchFile],
  ["apply", patchFile],
]) {
  const result = spawnSync("git", args, {
    cwd: verification,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}
for (const entry of manifest)
  assert.equal(
    hash(normalize(readFileSync(resolve(verification, entry.path), "utf8"))),
    entry.afterSHA256,
    entry.path,
  );
function handler(path, name, before = false) {
  const content = readFileSync(
    before ? beforePath(path) : resolve(root, path),
    "utf8",
  );
  const file = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let found;
  function walk(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name)
      found = node.getText(file);
    ts.forEachChild(node, walk);
  }
  walk(file);
  assert(found, `${name} exists`);
  return hash(found);
}
const handlers = [
  ["web/src/components/command-world.tsx", "execute"],
  ["web/src/components/arena-world.tsx", "advance"],
  ["web/src/components/arena-world.tsx", "create"],
].map(([path, name]) => {
  const before = handler(path, name, true),
    after = handler(path, name);
  assert.equal(before, after, `${name} handler unchanged`);
  return { path, name, SHA256: after };
});
const untouched = ["web/src/lib/authority.ts", "web/src/lib/use-console.ts"];
for (const path of untouched)
  assert.equal(
    readFileSync(beforePath(path), "utf8"),
    readFileSync(resolve(root, path), "utf8"),
    `${path} unchanged`,
  );
const startingHead = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).stdout.trim();
writeFileSync(
  resolve(output, "manifest.json"),
  JSON.stringify(
    {
      startingHead,
      baseline,
      files: manifest,
      handlers,
      untouched,
      verification:
        "Applied finish.delta.patch to preserved baseline copies; every resulting source hash matches the tested tree. SHA256 uses LF-normalized source. No reproducible release candidate: prerequisite source edits remain dirty.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    files: manifest.length,
    handlerChecks: handlers.length,
    untouched,
    patchVerified: true,
  }),
);
