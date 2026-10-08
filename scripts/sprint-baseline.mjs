import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
const { chromium } = await import(
  pathToFileURL(
    resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    ),
  ).href
);
const out = resolve("artifacts/implementation-sprint/before");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3101/");
  await page.screenshot({ path: resolve(out, `story-${width}.png`) });
  await page.getByRole("link", { name: "Command", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Product mode" })
    .selectOption("demo");
  await page
    .getByRole("button", { name: "Select Scraper", exact: true })
    .click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(out, `command-${width}.png`) });
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page
    .getByRole("button", { name: "Fund demo mission", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit 3 demo results", exact: true })
    .click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: resolve(out, `arena-${width}.png`) });
  await context.close();
}
await browser.close();
