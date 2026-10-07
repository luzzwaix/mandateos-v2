import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Uses an existing Playwright installation; adds no production dependency.
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
const base = process.argv[2] ?? "http://127.0.0.1:3101";
const out = resolve(process.argv[3] ?? "artifacts/final-finish/qa");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [],
  errors = [];
let userAgent;
async function check(page, width, name, predicate) {
  const result = await page.evaluate(predicate);
  checks.push({ width, name, result });
  console.log(`${result ? "PASS" : "FAIL"} ${width} ${name}`);
}
async function click(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
}
async function capture(page, name) {
  await page.screenshot({
    path: resolve(out, name + ".png"),
    fullPage: true,
    timeout: 15000,
  });
}
for (const width of [1440, 390, 768, 1024, 1280]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push({ width, message: e.message }));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push({ width, message: e.text() });
  });
  await page.goto(base + "/app");
  await page.getByLabel("Product mode").selectOption("demo");
  await page.locator(".command-world").waitFor();
  await page.waitForTimeout(300);
  userAgent = await page.evaluate(() => navigator.userAgent);
  const node = (id) =>
    page.locator(
      width <= 1200
        ? `[data-mobile-node="${id}"]`
        : `[data-testid="node-${id}"]`,
    );
  await check(
    page,
    width,
    "Command direct route / no overflow",
    () =>
      location.pathname === "/app" &&
      document.documentElement.scrollWidth <= innerWidth,
  );
  if (width > 1200)
    await check(page, width, "All authority amounts fit the register", () =>
      [...document.querySelectorAll(".flat-node")].every((n) => {
        const r = n.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      }),
    );
  await node("scraper").focus();
  await node("scraper").press("Space");
  await check(
    page,
    width,
    "Keyboard selection traces all four real ancestors",
    () =>
      document.querySelectorAll('[aria-label="Complete authority path"] li')
        .length === 4 &&
      document.querySelector(".capital-identity").innerText.includes("Scraper"),
  );
  await check(
    page,
    width,
    "Keyboard focus is visibly styled",
    () =>
      getComputedStyle(document.activeElement).outlineStyle !== "none" &&
      parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2,
  );
  await node("research").click();
  await click(page, "Preview revoke");
  await page.waitForTimeout(60);
  await page.keyboard.press("Escape");
  await check(
    page,
    width,
    "Escape cancels preview and restores focus",
    () =>
      document.activeElement.textContent.includes("Preview revoke") &&
      !document.querySelector(".impact-instrument"),
  );
  await check(
    page,
    width,
    "Interrupted preview removes temporary paths",
    () => !document.querySelector(".authority-motion-pulse"),
  );
  await click(page, "Preview revoke");
  await page.waitForTimeout(750);
  await check(
    page,
    width,
    "Revoke control text contrast is at least 4.5:1",
    () => {
      const button = document.querySelector(".impact-actions .button.copper");
      const style = getComputedStyle(button);
      const luminance = (color) => {
        const values = color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            const c = v / 255;
            return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
        return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
      };
      const text = luminance(style.color),
        background = luminance(style.backgroundColor);
      return (
        (Math.max(text, background) + 0.05) /
          (Math.min(text, background) + 0.05) >=
        4.5
      );
    },
  );
  await check(
    page,
    width,
    "All six mandates remain active in preview",
    () =>
      document.querySelectorAll(".flat-node.active").length === 6 &&
      document.querySelectorAll(".flat-node.preview-affected").length === 4 &&
      !document
        .querySelector('[data-testid="node-operations"]')
        .classList.contains("preview-affected"),
  );
  if (width > 1200)
    await check(page, width, "Copper boundary excludes Operations", () => {
      const svg = document.querySelector(".flat-rails").getBoundingClientRect(),
        ops = document
          .querySelector('[data-testid="node-operations"]')
          .getBoundingClientRect();
      const ctx = document.createElement("canvas").getContext("2d");
      return !ctx.isPointInPath(
        new Path2D(document.querySelector(".flat-impact").getAttribute("d")),
        ops.left + ops.width / 2 - svg.left,
        ops.top + ops.height / 2 - svg.top,
      );
    });
  await page.evaluate(() => {
    const mobile =
      getComputedStyle(document.querySelector(".flat-map")).display === "none";
    const ops = document.querySelector(
      mobile
        ? '[data-mobile-node="operations"]'
        : '[data-testid="node-operations"]',
    );
    const field = ops.closest(".capital-structure").getBoundingClientRect();
    const rect = ops.getBoundingClientRect();
    window.__qaOps = {
      left: rect.left - field.left,
      top: rect.top - field.top,
      width: rect.width,
    };
    window.__qaVault = document.querySelector(
      ".treasury-ledger > div:nth-child(3) strong",
    ).textContent;
  });
  await click(page, "Review revoke");
  await click(page, "Confirm demo revoke");
  await page.waitForTimeout(1500);
  await check(
    page,
    width,
    "One revoked / three blocked / Operations active",
    () =>
      document.querySelectorAll(".flat-node.revoked").length === 1 &&
      document.querySelectorAll(".flat-node.blocked").length === 3 &&
      document
        .querySelector('[data-testid="node-operations"]')
        .classList.contains("active"),
  );
  await check(page, width, "Sibling geometry remains stationary", () => {
    const before = window.__qaOps;
    const mobile =
      getComputedStyle(document.querySelector(".flat-map")).display === "none";
    const ops = document.querySelector(
      mobile
        ? '[data-mobile-node="operations"]'
        : '[data-testid="node-operations"]',
    );
    const field = ops.closest(".capital-structure").getBoundingClientRect();
    const after = ops.getBoundingClientRect();
    return (
      Math.abs(before.left - (after.left - field.left)) < 1 &&
      Math.abs(before.top - (after.top - field.top)) < 1 &&
      before.width === after.width
    );
  });
  await check(
    page,
    width,
    "Revoke leaves the actual shared vault unchanged",
    () =>
      window.__qaVault ===
      document.querySelector(".treasury-ledger > div:nth-child(3) strong")
        .textContent,
  );
  await click(page, "Attempt demo spend");
  await check(
    page,
    width,
    "Blocked spend is explicitly simulated, local record active",
    () =>
      document
        .querySelector(".capital-controls")
        .innerText.includes("SIMULATED PROGRAM OUTCOME") &&
      document.querySelector(".local-state").innerText.includes("ACTIVE") &&
      document.querySelector(".local-state").innerText.includes("BLOCKED"),
  );
  await check(
    page,
    width,
    "Selected blocked mandate never uses an active fill",
    () => {
      const node = document.querySelector('[data-testid="node-scraper"]');
      const frame = document.querySelector('[data-frame="scraper"]');
      return (
        node.classList.contains("selected") &&
        node.classList.contains("blocked") &&
        !node.classList.contains("active") &&
        getComputedStyle(node).backgroundColor === "rgba(0, 0, 0, 0)" &&
        getComputedStyle(frame).fill === "rgb(238, 233, 218)"
      );
    },
  );
  await page.waitForTimeout(1000);
  await check(
    page,
    width,
    "Completed choreography leaves no running scoped animations",
    () =>
      !document.querySelector("main [data-motion]") &&
      !document.querySelector(".authority-motion-pulse") &&
      document.getAnimations().every((a) => a.playState !== "running"),
  );
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page.locator(".arena-world").waitFor();
  await click(page, "Reset demo");
  await click(page, "Fund demo mission");
  await page.waitForTimeout(900);
  await check(
    page,
    width,
    "Funding is reserved without an early receipt",
    () =>
      document.querySelector(".mission-stage").classList.contains("funded") &&
      !document.querySelector(".mission-outcome"),
  );
  await click(page, "Submit 3 demo results");
  await page.locator('[data-arena-label="lane-0"]').click();
  await page.waitForTimeout(150);
  await page.locator('[data-arena-label="lane-2"]').click();
  await check(
    page,
    width,
    "Interrupted selection reconciles to C / unpaid",
    () =>
      document
        .querySelector('.contender[aria-pressed="true"]')
        .innerText.includes("Submission C") &&
      document
        .querySelector('.contender[aria-pressed="true"]')
        .innerText.includes("UNPAID") &&
      !document.querySelector(".mission-outcome"),
  );
  await click(page, "Select C & settle in demo");
  await page.waitForTimeout(1600);
  await check(
    page,
    width,
    "Only selected C passes / receipt remains simulated",
    () =>
      document.querySelectorAll(".submission-channel.selected").length === 1 &&
      document
        .querySelector(".contender.winner")
        .innerText.includes("Submission C") &&
      document
        .querySelector(".mission-outcome")
        .innerText.includes("Submission C") &&
      document
        .querySelector(".mission-outcome")
        .innerText.includes("SIMULATED") &&
      document
        .querySelector(".arena-instrument")
        .innerText.includes("no onchain transaction"),
  );
  await check(
    page,
    width,
    "Settlement leaves idle without decorative animation",
    () =>
      !document.querySelector("main [data-motion]") &&
      !document.querySelector(".authority-motion-pulse") &&
      document.getAnimations().every((a) => a.playState !== "running"),
  );
  await check(
    page,
    width,
    "Arena route / no overflow",
    () =>
      location.pathname === "/arena" &&
      document.documentElement.scrollWidth <= innerWidth,
  );
  await capture(page, `${width}-arena-verified-c`);
  await page.goto(base + "/arena");
  await page.getByLabel("Product mode").selectOption("demo");
  await page.locator(".arena-world").waitFor();
  await check(
    page,
    width,
    "Arena loads directly without a fabricated settled mission",
    () =>
      document.querySelector(".mission-stage").classList.contains("ready") &&
      !document.querySelector(".mission-outcome"),
  );
  await context.close();
}

// Reduced motion is exercised against the real state events, not injected state.
for (const width of [1440, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base + "/app");
  await page.getByLabel("Product mode").selectOption("demo");
  await page.locator(".command-world").waitFor();
  await click(page, "Preview revoke");
  await check(
    page,
    width,
    "Reduced motion preserves active preview without scoped animation",
    () =>
      document.querySelectorAll(".flat-node.active").length === 6 &&
      !document.querySelector("[data-motion]") &&
      !document.querySelector(".authority-motion-pulse"),
  );
  await click(page, "Review revoke");
  await click(page, "Confirm demo revoke");
  await check(
    page,
    width,
    "Reduced motion exposes the same final cascade immediately",
    () =>
      document.querySelectorAll(".flat-node.blocked").length === 3 &&
      !document.querySelector("[data-motion]"),
  );
  await capture(page, `${width}-reduced-command`);
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page.locator(".arena-world").waitFor();
  await click(page, "Reset demo");
  await click(page, "Fund demo mission");
  await click(page, "Submit 3 demo results");
  await page.locator('[data-arena-label="lane-1"]').click();
  await click(page, "Select B & settle in demo");
  await check(
    page,
    width,
    "Reduced settlement receipt / no scoped animation",
    () =>
      document
        .querySelector(".mission-outcome")
        .innerText.includes("Submission B") &&
      !document.querySelector("[data-motion]"),
  );
  await capture(page, `${width}-reduced-arena`);
  await page.goto(base + "/app");
  await page.getByLabel("Product mode").selectOption("demo");
  await page.locator(".command-world").waitFor();
  await click(page, "Wallet");
  await check(page, width, "Demo wallet explicitly needs no signature", () =>
    document
      .querySelector(".wallet-popover")
      .innerText.includes("No wallet or signature"),
  );
  await page.keyboard.press("Escape");
  await check(
    page,
    width,
    "Wallet Escape restores focus",
    () => document.activeElement.getAttribute("aria-label") === "Wallet",
  );
  await page.getByLabel("Product mode").selectOption("devnet");
  await page.locator(".unconnected-world").waitFor();
  await page.waitForTimeout(1000);
  await check(
    page,
    width,
    "Devnet never substitutes demo authority or balances",
    () =>
      !document.querySelector(".flat-node") &&
      document
        .querySelector(".unconnected-world")
        .innerText.includes("No balances or authority assumed"),
  );
  await capture(page, `${width}-devnet-unverified`);
  await click(page, "Wallet");
  await capture(page, `${width}-devnet-wallet`);
  await page.keyboard.press("Escape");
  await context.close();
}
await browser.close();
const report = {
  browser: userAgent,
  method:
    "Existing local Chromium / production static export / actual UI controls",
  base,
  checks,
  errors,
};
writeFileSync(resolve(out, "results.json"), JSON.stringify(report, null, 2));
assert.equal(
  checks.filter((c) => !c.result).length,
  0,
  "Browser QA failures: see results.json",
);
assert.equal(errors.length, 0, "Browser console errors: see results.json");
console.log(`${checks.length} browser assertions passed`);
