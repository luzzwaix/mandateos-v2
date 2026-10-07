// Real local browser pixels only. Story is the built-in simulation; other
// routes read Devnet. No wallet injection, signing, transaction assembly or sends.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const { chromium } = await import(
  pathToFileURL(
    process.env.PLAYWRIGHT_MODULE ||
      resolve(
        homedir(),
        ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
      ),
  ).href
);
const base = process.argv[2] || "http://127.0.0.1:3101";
const out = resolve(process.argv[3] || "target/showcase/capture");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [],
  reads = [],
  blocked = [];
const readMethods = new Set([
  "getGenesisHash",
  "getSlot",
  "getAccountInfo",
  "getProgramAccounts",
  "getSignaturesForAddress",
  "getTransaction",
  "getBalance",
  "getSignatureStatuses",
  "getBlockHeight",
]);
async function context(video = false) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1,
    ...(video
      ? {
          recordVideo: {
            dir: resolve(out, "video"),
            size: { width: 1440, height: 960 },
          },
        }
      : {}),
  });
  await context.route("https://api.devnet.solana.com/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.continue();
    const body = request.postDataJSON();
    if (!readMethods.has(body?.method)) {
      blocked.push(body?.method);
      return route.abort();
    }
    reads.push({ method: body.method, at: new Date().toISOString() });
    return route.continue();
  });
  context.on("page", (page) =>
    page.on("pageerror", (e) => errors.push(e.message)),
  );
  return context;
}
const story = await context(true),
  page = await story.newPage();
await page.goto(base + "/");
await page
  .getByRole("button", { name: "Delegate Research", exact: true })
  .waitFor();
await page.waitForTimeout(1400);
await page.screenshot({ path: resolve(out, "story.png"), fullPage: true });
for (const name of [
  "Delegate Research",
  "Delegate further",
  "Trace Scraper",
  "Preview Research revoke",
]) {
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(1400);
}
assert.equal(
  (await page.locator(".seal-control-status").allTextContents()).filter(
    (s) => s === "active",
  ).length,
  6,
);
await page
  .getByRole("button", { name: "Confirm demo revoke", exact: true })
  .click();
await page.waitForTimeout(1900);
assert.equal(
  (await page.locator(".seal-control-status").allTextContents()).filter(
    (s) => s === "blocked",
  ).length,
  3,
);
assert.equal(
  await page
    .locator(".seal-controls button")
    .filter({ hasText: "Operations" })
    .locator(".seal-control-status")
    .textContent(),
  "active",
);
await story.close();
const video = await page.video().path();
const scraper = "H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB";
for (const route of ["app", "arena"]) {
  const c = await context(),
    p = await c.newPage();
  await p.goto(base + "/" + route);
  await p
    .getByText("CONFIRMED ACCOUNT READS", { exact: false })
    .waitFor({ timeout: 120000 });
  assert.equal(
    await p.evaluate(
      () => !!window.phantom?.solana || !!window.solana?.isPhantom,
    ),
    false,
  );
  if (route === "app") {
    await p.locator(`[data-testid="node-${scraper}"]`).click();
    assert.match(await p.locator(".capital-controls").innerText(), /BLOCKED/);
  } else {
    await p.locator(".arena-world.account-backed").waitFor();
    assert.match(
      await p.locator(".mission-outcome").innerText(),
      /OBSERVED SETTLEMENT/,
    );
  }
  await p.waitForTimeout(800);
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.screenshot({ path: resolve(out, `${route}.png`), fullPage: true });
  await c.close();
}
await browser.close();
assert.deepEqual(errors, []);
assert.deepEqual(blocked, []);
const result = {
  at: new Date().toISOString(),
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  browser: browser.version(),
  base,
  viewport: { width: 1440, height: 960 },
  video,
  reads,
  errors,
  blocked,
  provenance: {
    story:
      "Built-in simulation driven through actual UI controls; no on-chain transaction",
    app: "Real disconnected Devnet account reads; selected Scraper",
    arena: "Real disconnected Devnet account reads; existing settled bounty",
  },
};
writeFileSync(
  resolve(out, "provenance.json"),
  JSON.stringify(result, null, 2) + "\n",
);
console.log(result);
