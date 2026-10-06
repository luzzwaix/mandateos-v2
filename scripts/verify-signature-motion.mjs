import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
let modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath) {
  try {
    modulePath = require.resolve("playwright");
  } catch {
    modulePath = resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    );
  }
}
assert.ok(
  existsSync(modulePath),
  "Set PLAYWRIGHT_MODULE to an existing Playwright installation",
);
const { chromium } = await import(pathToFileURL(modulePath).href);
const b = await chromium.launch(),
  checks = [],
  motion = [];
const base = process.argv[2] ?? "http://127.0.0.1:3101";
for (const width of [1440, 390]) {
  const c = await b.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
    }),
    p = await c.newPage();
  const node = (id) =>
    p.locator(
      width === 390
        ? `[data-mobile-node="${id}"]`
        : `[data-testid="node-${id}"]`,
    );
  const click = (name) => p.getByRole("button", { name, exact: true }).click();
  const check = async (name, fn) => {
    const ok = await p.evaluate(fn);
    checks.push({ width, name, result: ok });
    console.log(`${ok ? "PASS" : "FAIL"} ${width} ${name}`);
  };
  const sample = async (event) => {
    await p.waitForTimeout(30);
    motion.push({
      width,
      event,
      observed: await p.evaluate(() =>
        [...document.getAnimations()].map((a) => ({
          target: a.effect?.target?.getAttribute("class"),
          duration: a.effect?.getTiming().duration,
          delay: a.effect?.getTiming().delay,
        })),
      ),
      timeline: await p
        .locator("main [data-motion]")
        .getAttribute("data-motion")
        .catch(() => null),
    });
  };
  await p.goto(base + "/app");
  await p.getByLabel("Product mode").selectOption("demo");
  await p.locator(".command-world").waitFor();
  await p.waitForTimeout(500);
  await node("scraper").click();
  await sample("authority trace");
  await p.waitForTimeout(700);
  await node("research").click();
  await p.waitForTimeout(700);
  await click("Preview revoke");
  await sample("blast preview");
  await p.waitForTimeout(600);
  await click("Review revoke");
  await click("Confirm demo revoke");
  await sample("cascade");
  await p.waitForTimeout(1000);
  await p.getByRole("link", { name: "Arena", exact: true }).click();
  await click("Reset demo");
  await click("Fund demo mission");
  await sample("funding");
  await p.waitForTimeout(900);
  await click("Submit 3 demo results");
  await p.waitForTimeout(800);
  await p.locator('[data-arena-label="lane-1"]').focus();
  await p.keyboard.press("Space");
  await sample("verifier selection");
  await p.waitForTimeout(700);
  await click("Select B & settle in demo");
  await sample("settlement");
  await p.waitForTimeout(1100);
  await check(
    "Finite events finish without live animations",
    () =>
      !document.querySelector("main [data-motion]") &&
      !document.querySelector(".authority-motion-pulse") &&
      document.getAnimations().every((a) => a.playState !== "running"),
  );
  await p.goto(base + "/app");
  await p.getByLabel("Product mode").selectOption("demo");
  await p.locator(".command-world").waitFor();
  await p.waitForTimeout(500);
  await node("scraper").click();
  await p.waitForTimeout(60);
  await p.getByRole("link", { name: "Arena", exact: true }).click();
  await p.waitForTimeout(100);
  await check(
    "Route change cancels authority trace",
    () =>
      !document.querySelector(".capital-structure") &&
      !document.querySelector(".authority-motion-pulse"),
  );
  await click("Fund demo mission");
  await p.waitForTimeout(800);
  await click("Submit 3 demo results");
  await p.waitForTimeout(800);
  await p.locator('[data-arena-label="lane-1"]').focus();
  await p.keyboard.press("Space");
  await c.setDefaultTimeout(5000);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(100);
  await check(
    "Changing motion preference interrupts selection truthfully",
    () =>
      document
        .querySelector('.contender[aria-pressed="true"]')
        .innerText.includes("Submission B") &&
      !document.querySelector(".mission-outcome") &&
      !document.querySelector("main [data-motion]") &&
      !document.querySelector(".authority-motion-pulse"),
  );
  await p.goto(base + "/app");
  await p.getByLabel("Product mode").selectOption("demo");
  await p.locator(".command-world").waitFor();
  await node("scraper").click();
  await click("delegate");
  await p.getByLabel("Action amount", { exact: true }).fill("5");
  await p.getByLabel("Action address", { exact: true }).fill("QA child");
  await click("Simulate delegate");
  await p.waitForTimeout(600);
  await check(
    "Existing delegation exposes the added mandate in the complete ledger",
    () =>
      document
        .querySelector(".capital-structure")
        .classList.contains("extended") &&
      [...document.querySelectorAll("[data-mobile-node]")].some(
        (n) => n.innerText.includes("QA child") && n.innerText.includes("5.00"),
      ) &&
      document.documentElement.scrollWidth <= innerWidth,
  );
  const child = p.locator("[data-mobile-node]").filter({ hasText: "QA child" });
  await child.click();
  await check(
    "Added mandate retains its real complete authority path",
    () =>
      document.querySelectorAll('[aria-label="Complete authority path"] li')
        .length === 5 &&
      document
        .querySelector(".capital-identity")
        .innerText.includes("QA child"),
  );
  await c.close();
}
await b.close();
mkdirSync("artifacts/final-finish/qa", { recursive: true });
writeFileSync(
  "artifacts/final-finish/qa/signature-motion.json",
  JSON.stringify({ checks, motion }, null, 2),
);
assert.ok(checks.every((c) => c.result));
