import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const { chromium } = await import(
  pathToFileURL(
    resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    ),
  ).href
);
const phase = process.argv[2] || "before";
const output = resolve(process.argv[3] || "artifacts/visual-checkpoint", phase);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const observations = [];
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const size = `${viewport.width}x${viewport.height}`;
  const context = await browser.newContext({
    viewport,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (phase === "before")
    for (const [name, route] of [
      ["command", "/app"],
      ["arena", "/arena"],
      ["story", "/"],
    ]) {
      await page.goto(`http://127.0.0.1:3101${route}`);
      await page.waitForTimeout(route === "/" ? 500 : 11000);
      if (route === "/app")
        await page.locator(".command-world").waitFor({ timeout: 90000 });
      await page.screenshot({ path: resolve(output, `${name}-${size}.png`) });
    }
  else await page.goto("http://127.0.0.1:3101/");
  for (const name of [
    "Try demo",
    "Delegate further",
    "Trace Scraper",
    "Preview Research revoke",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(850);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, `boundary-${size}.png`) });
  const anchors = await page
    .locator(".seal-root, .seal-mandate.operations")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          transform: getComputedStyle(node).transform,
        };
      }),
    );
  await page
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  await page.waitForTimeout(1700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, `cascade-${size}.png`) });
  await page.screenshot({
    path: resolve(output, `cascade-full-${size}.png`),
    fullPage: true,
  });
  const afterAnchors = await page
    .locator(".seal-root, .seal-mandate.operations")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          transform: getComputedStyle(node).transform,
        };
      }),
    );
  if (phase === "after") {
    // Mobile content above the object shortens when Cancel disappears. Geometry,
    // scale and transforms inside the object must remain constant in both cases.
    for (let i = 0; i < anchors.length; i++) {
      assert.equal(afterAnchors[i].transform, anchors[i].transform);
      assert(Math.abs(afterAnchors[i].width - anchors[i].width) < 0.5);
      assert(Math.abs(afterAnchors[i].height - anchors[i].height) < 0.5);
      assert(Math.abs(afterAnchors[i].y - anchors[i].y) < 0.5);
    }
  }
  observations.push({
    phase,
    size,
    errors,
    idleAnimations: await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await context.close();
}
if (phase === "after") {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: output, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3101/");
  for (const name of [
    "Try demo",
    "Delegate further",
    "Trace Scraper",
    "Preview Research revoke",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(1500);
  await page
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  await page.waitForTimeout(2400);
  await page
    .locator(".seal-controls button")
    .filter({ hasText: "Operations" })
    .click();
  await page.waitForTimeout(1500);
  const video = page.video();
  await context.close();
  await video.saveAs(resolve(output, "research-cut.webm"));
}
await browser.close();
writeFileSync(
  resolve(output, "observations.json"),
  JSON.stringify(observations, null, 2),
);
console.log(JSON.stringify(observations));
