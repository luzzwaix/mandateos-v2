import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = new URL(process.argv[2]).origin;
const out = resolve(
  process.argv[3] || resolve(root, "artifacts/overnight-release/preview"),
);
mkdirSync(out, { recursive: true });
const { chromium } = await import(
  pathToFileURL(
    process.env.PLAYWRIGHT_MODULE ||
      resolve(
        homedir(),
        ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
      ),
  ).href
);
const browser = await chromium.launch();
const signedOut = await browser.newContext();
const page = await signedOut.newPage();
let access;
try {
  const response = await page.goto(base);
  const body = await page.locator("body").innerText();
  access = {
    status: response?.status(),
    finalUrl: page.url(),
    protected:
      /vercel.com\/.*sso|Authentication Required|Log in to Vercel|Continue with/i.test(
        page.url() + " " + body,
      ),
    productVisible: (await page.locator(".mandate-story").count()) === 1,
  };
  await page.screenshot({ path: resolve(out, "signed-out.png") });
} finally {
  await browser.close();
}
writeFileSync(resolve(out, "signed-out.json"), JSON.stringify(access, null, 2));
const headers = process.env.VERCEL_OIDC_TOKEN
  ? { "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN }
  : {};
async function read(path) {
  const response = await fetch(new URL(path, base), {
    headers,
    redirect: "manual",
  });
  assert.equal(
    response.status,
    200,
    `Protected read failed at ${path}: use development OIDC; do not change protection`,
  );
  return Buffer.from(await response.arrayBuffer());
}
const expected = JSON.parse(
  readFileSync(resolve(root, "web/.vercel/output/static/release.json"), "utf8"),
);
const sha = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
assert.equal(expected.sourceCommit, sha);
const actual = JSON.parse((await read("/release.json")).toString("utf8"));
assert.deepEqual(actual, expected);
const files = expected.files.filter(
  (f) =>
    /\.(?:js|css)$/.test(f.path) ||
    ["index.html", "app.html", "arena.html"].includes(f.path),
);
const matches = [];
for (let i = 0; i < files.length; i += 4)
  await Promise.all(
    files.slice(i, i + 4).map(async (f) => {
      const path =
        f.path === "index.html"
          ? "/"
          : /^(app|arena)\.html$/.test(f.path)
            ? "/" + f.path.slice(0, -5)
            : "/" + f.path;
      const bytes = await read(path),
        hash = createHash("sha256").update(bytes).digest("hex");
      assert.equal(
        hash,
        f.sha256,
        `Served bytes differ from the isolated build: ${path}`,
      );
      matches.push(path);
    }),
  );
const report = {
  sourceCommit: sha,
  sourceTree: actual.sourceTree,
  url: base,
  signedOut: access,
  independentlyVerifiedCorrespondence: true,
  method:
    "remote release manifest plus SHA256 of all served JS/CSS and three route HTML files vs exact isolated checkout",
  matchedFiles: matches.sort(),
  authorization: process.env.VERCEL_OIDC_TOKEN
    ? "ephemeral development OIDC; origin scoped; protection unchanged"
    : "anonymous",
};
writeFileSync(
  resolve(out, "correspondence.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
