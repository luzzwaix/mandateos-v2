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
for (const reducedMotion of ["no-preference", "reduce"]) {
  const c = await b.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  });
  const p = await c.newPage();
  await p.goto(process.argv[2] || "http://127.0.0.1:3101");
  await p.keyboard.press("Tab");
  assert.equal(
    await p.locator(".skip-link").evaluate((e) => getComputedStyle(e).opacity),
    "1",
  );
  await p
    .getByRole("button", { name: "Delegate Research", exact: true })
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
    /200 USDC.*Active/,
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
  await p.getByRole("button", { name: "Replay story", exact: true }).click();
  assert.equal(await p.locator(".seal-mandate").count(), 0);
  checks.push({
    reducedMotion,
    immediateHierarchy: true,
    rootContinuity: true,
    exactLineage: true,
    activePreview: true,
    cascadeAndSibling: true,
    keyboardSkip: true,
    idleAndReplay: true,
  });
  await c.close();
}
await b.close();
mkdirSync("target/startup-v1", { recursive: true });
writeFileSync(
  "target/startup-v1/story-qa.json",
  JSON.stringify(checks, null, 2),
);
console.log(
  "Story: immediate state, continuity, lineage, preview/cascade, sibling, keyboard, idle and replay passed with both motion preferences",
);
