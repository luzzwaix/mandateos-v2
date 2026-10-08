// Package a freshly built static export; never deploy or change project settings.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
if (git("status", "--porcelain", "--untracked-files=normal"))
  throw new Error("Prepare preview only from a clean, committed checkout.");
const sourceCommit = git("rev-parse", "HEAD");
const sourceTree = git("rev-parse", "HEAD^{tree}");
const web = join(root, "web"),
  source = join(web, "out");
for (const name of ["index.html", "app.html", "arena.html"])
  if (!existsSync(join(source, name)))
    throw new Error(`Build missing: ${name}`);
const output = join(web, ".vercel", "output");
if (existsSync(output))
  throw new Error(
    "Use a new checkout/output directory; do not reuse a previous preview package.",
  );
mkdirSync(output, { recursive: true });
cpSync(source, join(output, "static"), { recursive: true });
const overrides = {};
const files = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) walk(file);
    else {
      const name = relative(source, file).replaceAll("\\", "/");
      files.push({
        path: name,
        sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
      });
      if (name.endsWith(".html") && name !== "index.html")
        overrides[name] = {
          path: name.slice(0, -5),
          contentType: "text/html; charset=utf-8",
        };
      // Next's Windows export stores page segments inside route directories.
      if (name.endsWith("/__PAGE__.txt"))
        overrides[name] = {
          path: name.replace("/__PAGE__.txt", ".__PAGE__.txt"),
          contentType: "text/x-component",
        };
      else if (name.endsWith(".txt"))
        overrides[name] = { contentType: "text/x-component" };
    }
  }
}
walk(source);
files.sort((a, b) => a.path.localeCompare(b.path));
const receipt = {
  sourceCommit,
  sourceTree,
  kind: "locally-built-static-preview",
  files,
};
writeFileSync(
  join(output, "static", "release.json"),
  JSON.stringify(receipt, null, 2) + "\n",
);
writeFileSync(
  join(output, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [{ src: "^/$", dest: "/index.html" }, { handle: "filesystem" }],
      overrides,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({ sourceCommit, sourceTree, output, files: files.length }),
);
