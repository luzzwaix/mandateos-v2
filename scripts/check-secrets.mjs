// Fail on tracked private material/build output without printing file contents.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const forbidden =
  /(^|\/)(node_modules|target|\.next|out|\.localnet|\.anchor|test-ledger|keys|wallets)\/|(^|\/)\.env($|\.(?!example$))|(^|\/)(id|keypair)\.json$|(?:keypair|wallet|secret)[^/]*\.json$|\.(pem|key)$/i;
const credential =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b|\bAKIA[A-Z0-9]{16}\b/;
const failures = [];
for (const path of paths) {
  if (forbidden.test(path)) {
    failures.push(path);
    continue;
  }
  if (/\.(png|jpg|jpeg|ico|woff2?)$/i.test(path)) continue;
  const content = readFileSync(path, "utf8");
  if (credential.test(content)) failures.push(path);
  if (path.endsWith(".json")) {
    const parsed = JSON.parse(content);
    if (
      Array.isArray(parsed) &&
      parsed.length === 64 &&
      parsed.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
    )
      failures.push(path);
  }
}
if (failures.length) {
  console.error(
    "Excluded material is tracked in:\n" + [...new Set(failures)].join("\n"),
  );
  process.exit(1);
}
console.log(
  `Checked ${paths.length} tracked files: no keypairs, recognized credentials, local environments or build outputs.`,
);
