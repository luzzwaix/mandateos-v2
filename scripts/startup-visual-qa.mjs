import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
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
const out = resolve(process.argv[3] || "target/startup-v1/visual-before");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const checks = [],
  errors = [];
for (const width of [1440, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const click = (name) =>
    page.getByRole("button", { name, exact: true }).click();
  async function shot(name) {
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: resolve(out, `${width}-${name}.png`),
      fullPage: true,
    });
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      animations: document
        .getAnimations()
        .filter((a) => a.playState === "running").length,
    }));
    checks.push({ width, name, ...state });
    assert.equal(state.overflow, false, name + " overflow");
  }
  await page.goto(base);
  await shot("story-genesis");
  await click("Try demo");
  await page
    .getByRole("button", { name: "Delegate further", exact: true })
    .waitFor({ timeout: 10000 });
  await click("Delegate further");
  await page
    .getByRole("button", { name: "Trace Scraper", exact: true })
    .waitFor({ timeout: 15000 });
  await shot("story-recursion");
  await click("Trace Scraper");
  await shot("story-trace");
  await click("Preview Research revoke");
  await shot("story-blast");
  assert.equal(
    await page
      .locator(".seal-control-status")
      .allTextContents()
      .then((a) => a.filter((s) => s === "active").length),
    6,
  );
  await click("Confirm demo revoke");
  await shot("story-cascade");
  assert.equal(
    await page
      .locator(".seal-control-status")
      .allTextContents()
      .then((a) => a.filter((s) => s === "blocked").length),
    3,
  );
  await page.goto(base + "/app");
  await page.getByLabel("Product mode").selectOption("demo");
  const node = (id) =>
    page.locator(
      width <= 1200
        ? `[data-mobile-node="${id}"]`
        : `[data-testid="node-${id}"]`,
    );
  await node("scraper").click();
  await shot("command-active");
  await node("research").click();
  await click("Preview revoke");
  await shot("command-preview");
  await click("Review revoke");
  await click("Confirm demo revoke");
  await click("Attempt demo spend");
  await shot("command-blocked");
  assert.match(
    await page.locator(".capital-controls").innerText(),
    /SIMULATED PROGRAM OUTCOME/,
  );
  await node("operations").click();
  await shot("command-operations");
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await click("Reset demo");
  await shot("arena-ready");
  await click("Fund demo mission");
  await shot("arena-funded");
  await click("Submit 3 demo results");
  await page.locator('[data-arena-label="lane-2"]').click();
  await shot("arena-selected");
  await click("Select C & settle in demo");
  await shot("arena-settled");
  assert.match(await page.locator(".mission-outcome").innerText(), /SIMULATED/);
  await context.close();
}
await browser.close();
writeFileSync(
  resolve(out, "results.json"),
  JSON.stringify(
    {
      base,
      checks,
      errors,
      provenance:
        "Actual UI controls; Story and lifecycle captures explicitly demo; no signing",
    },
    null,
    2,
  ),
);
assert.equal(errors.length, 0);
assert(
  checks.every((c) => c.animations === 0),
  "Idle animation remains",
);
console.log(
  `${checks.length} captured states verified; zero overflow, errors or idle animations`,
);
