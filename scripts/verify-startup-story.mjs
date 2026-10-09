import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
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
const b = await chromium.launch(),
  checks = [];
for (const [width, height, reducedMotion] of [
  [1440, 900, "no-preference"],
  [1440, 900, "reduce"],
  [390, 844, "no-preference"],
  [390, 844, "reduce"],
]) {
  const c = await b.newContext({
    viewport: { width, height },
    reducedMotion,
  });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (error) => errors.push(error.message));
  await p.addInitScript(() => {
    window.__frameCallbacks = 0;
    const schedule = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      schedule((time) => {
        window.__frameCallbacks++;
        callback(time);
      });
  });
  await p.goto(process.argv[2] || "http://127.0.0.1:3101");
  await p.keyboard.press("Tab");
  assert.equal(
    await p.locator(".skip-link").evaluate((e) => getComputedStyle(e).opacity),
    "1",
  );
  await p
    .getByRole("button", { name: "Try demo", exact: true })
    .click();
  await p.evaluate(
    () => (window.__root = document.querySelector(".seal-root")),
  );
  await p
    .getByRole("button", { name: "Delegate further", exact: true })
    .click();
  // No timeline wait: all account-derived demo state and the next action exist now.
  assert.equal(await p.locator(".seal-mandate").count(), 5);
  assert.equal(
    await p
      .getByRole("button", { name: "Trace Scraper", exact: true })
      .isEnabled(),
    true,
  );
  await p.getByRole("button", { name: "Trace Scraper", exact: true }).click();
  assert.deepEqual(await p.locator(".story-lineage strong").allTextContents(), [
    "Root",
    "Research",
    "Data",
    "Scraper",
  ]);
  assert.equal(
    await p.evaluate(
      () => window.__root === document.querySelector(".seal-root"),
    ),
    true,
  );
  await p
    .getByRole("button", { name: "Preview Research revoke", exact: true })
    .click();
  assert.equal(
    await p
      .locator(".seal-control-status")
      .allTextContents()
      .then((a) => a.filter((s) => s === "active").length),
    6,
  );
  await p
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  assert.equal(
    await p.locator('.story-lineage [data-status="blocked"]').count(),
    2,
  );
  assert.match(
    await p.locator(".sibling-proof").innerText(),
    /200\.00 TOKENS.*Active/,
  );
  await p.waitForTimeout(1600);
  assert.equal(
    await p.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
    0,
  );
  const framesBefore = await p.evaluate(() => window.__frameCallbacks);
  await p.waitForTimeout(400);
  const idleFrames =
    (await p.evaluate(() => window.__frameCallbacks)) - framesBefore;
  assert.equal(idleFrames, 0, "No background RAF while idle");
  await p
    .locator(".seal-controls button")
    .filter({ hasText: "Operations" })
    .press("Enter");
  assert.match(
    await p.locator(".cut-proof").innerText(),
    /Operations[\s\S]*Local status[\s\S]*ACTIVE[\s\S]*Effective authority[\s\S]*ACTIVE[\s\S]*None/i,
  );
  await p
    .locator(".seal-controls button")
    .filter({ hasText: "Scraper" })
    .press("Enter");
  assert.equal(
    await p
      .getByRole("button", { name: /walkthrough|Next step|Replay story/i })
      .count(),
    0,
  );
  assert.match(
    await p.locator(".cut-proof").innerText(),
    /Scraper[\s\S]*Local status[\s\S]*active[\s\S]*Effective authority[\s\S]*blocked[\s\S]*Research/i,
  );
  await p.getByRole("button", { name: "Reset structure", exact: true }).click();
  assert.equal(await p.locator(".seal-mandate").count(), 0);
  checks.push({
    width,
    height,
    idleFrames,
    reducedMotion,
    immediateHierarchy: true,
    rootContinuity: true,
    exactLineage: true,
    activePreview: true,
    cascadeAndSibling: true,
    keyboardSkip: true,
    idleAndReset: true,
  });
  assert.deepEqual(errors, []);
  await c.close();
}
await b.close();
mkdirSync("target/startup-v1", { recursive: true });
writeFileSync(
  "target/startup-v1/story-qa.json",
  JSON.stringify(checks, null, 2),
);
console.log(
  "Story: immediate state, continuity, lineage, preview/cascade, sibling, keyboard, idle and reset passed with both motion preferences",
);
