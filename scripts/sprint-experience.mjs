// Local browser acceptance. Demo events and read-only RPC, never wallet injection.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
const output = resolve(
  process.argv[3] || "target/completion-sprint/acceptance",
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch(),
  checks = [],
  errors = [];
const scraper = "H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB";
const operations = "HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21";
const sampleSizes = [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
  [720, 450],
];
for (const [width, height] of sampleSizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: width === 768 ? "reduce" : "no-preference",
  });
  await context.route("https://api.devnet.solana.com/**", (route) => {
    if (route.request().method() === "OPTIONS") return route.continue();
    const method = route.request().postDataJSON().method;
    assert(
      !["sendTransaction", "requestAirdrop", "simulateTransaction"].includes(
        method,
      ),
    );
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  async function capture(name) {
    // Observe finite motion until still; do not treat a 1.5s sample as an idle test.
    await page.waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running"),
      undefined,
      { timeout: 10000 },
    );
    const result = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      animations: document
        .getAnimations()
        .filter((a) => a.playState === "running").length,
    }));
    assert.equal(result.overflow, false, `${width} ${name} overflow`);
    checks.push({ width, height, name, ...result });
    await page.screenshot({
      path: resolve(output, `${width}-${name}.png`),
      fullPage: true,
    });
  }
  await page.goto(base);
  await capture("story-genesis");
  const run = page.getByRole("button", {
    name: "Run the 20-second authority walkthrough",
    exact: true,
  });
  const box = await run.boundingBox();
  assert(
    box && box.y + box.height <= height,
    "Primary action must be in first viewport",
  );
  await run.press("Enter");
  if (width === 1440) {
    await page.waitForTimeout(1000);
    await run.press("Enter");
    await page.waitForTimeout(1200);
    assert.equal(
      await page.locator(".mandate-story").getAttribute("data-stage"),
      "0",
      "Restart resets the first-step timer",
    );
  }
  await page
    .getByRole("button", { name: "Pause walkthrough", exact: true })
    .press("Enter");
  await page.waitForTimeout(2300);
  assert.equal(
    await page.locator(".mandate-story").getAttribute("data-stage"),
    "0",
    "Pause cancels timer",
  );
  for (const name of [
    "grant",
    "recursion",
    "trace",
    "blast",
    "cascade",
    "operations",
    "proof",
  ]) {
    await page
      .getByRole("button", { name: "Next step", exact: true })
      .press("Enter");
    await capture("walkthrough-" + name);
    if (name === "blast")
      assert.equal(
        (await page.locator(".seal-control-status").allTextContents()).filter(
          (s) => s === "active",
        ).length,
        6,
      );
    if (["cascade", "operations", "proof"].includes(name)) {
      assert.equal(
        (await page.locator(".seal-control-status").allTextContents()).filter(
          (s) => s === "blocked",
        ).length,
        3,
      );
      assert.match(
        await page
          .locator(".seal-controls button")
          .filter({ hasText: "Operations" })
          .locator(".seal-control-status")
          .textContent(),
        /active/,
      );
    }
  }
  assert.match(
    await page.locator(".story-evidence").innerText(),
    /NOT SENT · NO SIGNATURE/,
  );
  await page
    .getByRole("button", { name: "Replay story", exact: true })
    .press("Enter");
  assert.equal(
    await page.locator(".mandate-story").getAttribute("data-stage"),
    "0",
  );
  await page.getByRole("link", { name: "Command", exact: true }).click();
  await capture("command-loading");
  await page
    .locator(".world-footer")
    .getByText("CONFIRMED ACCOUNT READS")
    .waitFor({ timeout: 120000 });
  const select = (id) =>
    page
      .locator(
        width <= 1100
          ? `[data-mobile-node="${id}"]`
          : `[data-testid="node-${id}"]`,
      )
      .click();
  await select(scraper);
  if (width <= 768) {
    await page
      .getByRole("button", { name: "Inspect Scraper", exact: true })
      .press("Enter");
    assert.equal(
      await page
        .locator('[aria-label="Mandate inspector"]')
        .evaluate((el) => document.activeElement === el),
      true,
    );
  }
  await capture("command-devnet-blocked");
  assert.match(
    await page.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*BLOCKED/,
  );
  await select(operations);
  await capture("command-devnet-operations");
  assert.match(
    await page.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*ACTIVE/,
  );
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await page
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await page
    .getByText("Install Phantom, then refresh this page", { exact: true })
    .first()
    .waitFor();
  await capture("phantom-unavailable");
  await page
    .getByRole("button", { name: "Close wallet menu", exact: true })
    .click();
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page.locator(".arena-world.account-backed").waitFor();
  await capture("arena-devnet-observed-settlement");
  assert.match(
    await page.locator(".arena-world").innerText(),
    /SETTLED|settled/,
  );
  await context.close();
}
// Automatic timeline and cleanup measured on a separate, real browser document.
const recordingContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: resolve(output, "recording"),
    size: { width: 1440, height: 900 },
  },
});
const recorded = await recordingContext.newPage();
recorded.on("pageerror", (error) => errors.push(error.message));
await recorded.goto(base);
const start = performance.now();
await recorded
  .getByRole("button", {
    name: "Run the 20-second authority walkthrough",
    exact: true,
  })
  .click();
await recorded
  .getByText("8 / 8 · Complete", { exact: true })
  .waitFor({ timeout: 25000 });
const walkthroughMs = performance.now() - start;
assert(walkthroughMs >= 19500 && walkthroughMs < 25000);
await recorded.waitForTimeout(1800);
await recorded.screenshot({
  path: resolve(output, "walkthrough-complete.png"),
  fullPage: true,
});
const video = recorded.video();
await recordingContext.close();
await video.saveAs(resolve(output, "authority-walkthrough.webm"));
// Actual RPC failure leaves the shell and a useful error, with no demo substitution.
const offlineContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await offlineContext.route("https://api.devnet.solana.com/**", (route) =>
  route.abort(),
);
const offline = await offlineContext.newPage();
await offline.goto(base + "/app");
await offline.locator('[role="alert"]').first().waitFor();
assert.equal(
  await offline
    .getByRole("button", { name: "Wallet", exact: true })
    .isEnabled(),
  true,
);
assert.equal(await offline.locator(".command-world").count(), 0);
await offline.screenshot({
  path: resolve(output, "rpc-failure.png"),
  fullPage: true,
});
await offlineContext.close();
await browser.close();
assert.deepEqual(errors, []);
writeFileSync(
  resolve(output, "results.json"),
  JSON.stringify(
    {
      base,
      checks,
      errors,
      walkthroughMs,
      video: "authority-walkthrough.webm",
      provenance:
        "Story simulated; accounts observed on Devnet; Phantom absent; no submissions",
      zoom: "720×450 tests 200% reflow of 1440×900; native browser zoom is not measured",
    },
    null,
    2,
  ),
);
console.log(
  `${checks.length} captures: walkthrough, pause/next/replay, keyboard, reduced motion, Devnet reads, responsive and RPC failure passed; auto tour ${Math.round(walkthroughMs)}ms`,
);
