import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  pathToFileURL(
    resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    ),
  ).href
);
const base = process.env.MANDATEOS_QA_BASE || "http://127.0.0.1:3101";
const out = resolve(
  process.argv[2] || "D:/MandateOS-final-finish-2026-10-08/pass-1",
);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(),
  results = [];
for (const [width, height, motion] of process.argv.includes("--states-only")
  ? []
  : [
      [1440, 900, "no-preference"],
      [390, 844, "no-preference"],
      [1440, 900, "reduce"],
      [390, 844, "reduce"],
    ]) {
  const recording = width === 1440 && motion === "no-preference";
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
    permissions: ["clipboard-read", "clipboard-write"],
    ...(recording
      ? { recordVideo: { dir: out, size: { width, height } } }
      : {}),
  });
  const page = await context.newPage(),
    errors = [],
    writes = [],
    intervals = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://api.devnet.solana.com/**", (route) => {
    if (route.request().method() === "OPTIONS") return route.continue();
    const method = route.request().postDataJSON()?.method;
    if (
      ["sendTransaction", "requestAirdrop", "simulateTransaction"].includes(
        method,
      )
    ) {
      writes.push(method);
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__finishTasks = [];
    new PerformanceObserver((list) =>
      window.__finishTasks.push(
        ...list
          .getEntries()
          .map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: "longtask", buffered: true });
  });
  async function timed(name, fn, settle = 300) {
    const start = await page.evaluate(() => performance.now());
    await fn();
    await page.waitForTimeout(settle);
    const end = await page.evaluate(() => performance.now());
    intervals.push({ name, start, end });
  }
  async function capture(name) {
    await page.screenshot({
      path: resolve(out, `${width}-${motion}-${name}.png`),
      fullPage: false,
    });
  }
  async function idle() {
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    );
  }
  async function story() {
    await page.goto(base + "/");
    for (const name of [
      "Try demo",
      "Delegate further",
      "Trace Scraper",
      "Preview Research revoke",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      await idle();
    }
  }
  await story();
  const before = await page
    .locator(".seal-root,.seal-mandate.operations")
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
  await timed(
    "cascade",
    async () => {
      await page
        .getByRole("button", { name: "Confirm demo revoke", exact: true })
        .click();
      await page.waitForTimeout(140);
      await capture("cut-intermediate");
    },
    1500,
  );
  await capture("cut-complete");
  assert.match(
    await page.locator(".cut-proof").innerText(),
    /ACTIVE[\s\S]*BLOCKED[\s\S]*RESEARCH/,
  );
  const after = await page
    .locator(".seal-root,.seal-mandate.operations")
    .evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
  before.forEach((box, i) =>
    Object.keys(box).forEach((k) =>
      assert(
        Math.abs(box[k] - after[i][k]) < 1,
        "Root and Operations retain geometry",
      ),
    ),
  );
  let samples = [];
  await timed(
    "handoff",
    async () => {
      await page
        .getByRole("button", {
          name: "Inspect authority in Command",
          exact: true,
        })
        .click();
      for (let i = 0; i < 9; i++) {
        samples.push(
          await page.evaluate(() => {
            const visible = (n) => {
              const s = getComputedStyle(n);
              return (
                s.visibility !== "hidden" &&
                Number(s.opacity) > 0 &&
                n.getBoundingClientRect().width > 0
              );
            };
            const nodes = [
              ...document.querySelectorAll(
                ".seal-root,.command-world .root-body",
              ),
            ].filter(visible);
            return {
              roots: nodes.length,
              rects: nodes.map((n) => {
                const r = n.getBoundingClientRect();
                return { x: r.x, y: r.y, w: r.width, h: r.height };
              }),
              overlay: !!document.querySelector(".authority-handoff"),
            };
          }),
        );
        if (i === 2) await capture("handoff-intermediate");
        await page.waitForTimeout(60);
      }
    },
    550,
  );
  assert(
    samples.every((s) => s.roots === 1),
    "Exactly one visible Root in every sampled frame",
  );
  assert.equal(await page.locator(".authority-handoff").count(), 0);
  assert.equal(
    await page.locator("body").getAttribute("data-authority-handoff"),
    null,
  );
  assert.match(
    await page.locator(".capital-identity").innerText(),
    /Scraper[\s\S]*ACTIVE[\s\S]*BLOCKED/,
  );
  await capture("command-blocked");
  const blockedRect = await page.locator("aside.bone-instrument").boundingBox();
  await timed("blocked receipt", () =>
    page
      .getByRole("button", { name: "Attempt demo spend", exact: true })
      .click(),
  );
  await timed("disclosure", () =>
    page.getByText("Accounting consequences", { exact: true }).click(),
  );
  assert.equal(
    await page.locator(".accounting-consequences").getAttribute("open"),
    "",
  );
  assert.equal(
    await page
      .locator(".accounting-consequences summary")
      .evaluate((n) => n === document.activeElement),
    true,
  );
  await capture("evidence-disclosure");
  const select = (name) =>
    width === 390
      ? page.locator(".hierarchy-rail button").filter({ hasText: name })
      : page.getByRole("button", { name: `Select ${name}`, exact: true });
  await timed("node selection", () => select("Operations").click());
  const inspectionRect = await page
    .locator("aside.bone-instrument")
    .boundingBox();
  if (width === 1440) {
    assert(
      Math.abs(blockedRect.height - inspectionRect.height) < 1,
      "Inspector height remains stable across blocked/active selection",
    );
    assert.equal(blockedRect.width, inspectionRect.width);
  }
  await capture("operations-inspector");
  await timed("form open", () =>
    page.locator(".action-choices button").filter({ hasText: "spend" }).click(),
  );
  assert.equal(
    await page
      .getByRole("textbox", { name: "Action amount", exact: true })
      .evaluate((n) => n === document.activeElement),
    true,
  );
  await page
    .getByRole("textbox", { name: "Action amount", exact: true })
    .fill("0");
  await timed("validation", () =>
    page.getByRole("button", { name: "Simulate spend", exact: true }).click(),
  );
  assert.match(
    await page.locator(".action-instrument .error-text").innerText(),
    /positive u64 range/,
  );
  await capture("form-validation");
  await page
    .getByRole("textbox", { name: "Action amount", exact: true })
    .press("Escape");
  assert.equal(await page.locator(".action-form").count(), 0);
  assert.match(
    await page.evaluate(() => document.activeElement?.textContent),
    /spend/,
  );
  for (const name of [
    "Data",
    "Scraper",
    "Operations",
    "Research",
    "Operations",
  ]) {
    await select(name).click();
  }
  await idle();
  const reselectionRect = await page
    .locator("aside.bone-instrument")
    .boundingBox();
  await timed("keyboard selection", () => select("Operations").press("Enter"));
  await timed("evidence history", () =>
    page.getByRole("button", { name: /History \(/ }).click(),
  );
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  for (const name of ["Fund demo mission", "Submit 3 demo results"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await idle();
  }
  const lane = (name) =>
    page
      .locator(".contender")
      .filter({ has: page.getByText(`Submission ${name}`, { exact: true }) });
  await timed("Arena inspection", () => lane("A").click());
  await capture("arena-unpaid");
  await timed(
    "explicit Demo settlement",
    () =>
      page
        .getByRole("button", { name: "Select A & settle in demo", exact: true })
        .click(),
    1100,
  );
  const receipt = await page.locator(".mission-outcome").innerText(),
    verifier = await page.locator(".verifier-gate").innerText();
  await timed("inspect losing submission", () => lane("C").click());
  assert.equal(await page.locator(".mission-outcome").innerText(), receipt);
  assert.equal(await page.locator(".verifier-gate").innerText(), verifier);
  assert.equal(
    await page.locator(".contender.winner").getAttribute("aria-pressed"),
    "false",
  );
  await capture("arena-inspecting-loser");
  await page.getByRole("link", { name: "Command", exact: true }).click();
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  assert.equal(await page.locator(".mission-outcome").innerText(), receipt);
  assert.equal(
    await page.locator(".mission-stage").getAttribute("data-motion"),
    null,
    "Historical settlement does not replay",
  );
  await idle();
  let idleFrames = await page.evaluate(async () => {
    let count = 0;
    const original = requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      count++;
      return original(cb);
    };
    await new Promise((r) => setTimeout(r, 650));
    window.requestAnimationFrame = original;
    return count;
  });
  assert.equal(idleFrames, 0);
  const tasks = await page.evaluate(() => window.__finishTasks);
  const phaseTasks = intervals.map((i) => ({
    ...i,
    tasks: tasks.filter(
      (t) => t.start < i.end && t.start + t.duration > i.start,
    ),
  }));
  await story();
  await page
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  await idle();
  await page
    .getByRole("button", { name: "Inspect authority in Command", exact: true })
    .click();
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await idle();
  assert.equal(await page.locator(".authority-handoff").count(), 0);
  await page.setViewportSize({ width: width === 390 ? 440 : 1280, height });
  await idle();
  assert.equal(await page.locator(".authority-motion-pulse").count(), 0);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(writes, []);
  const video = page.video();
  await context.close();
  if (video) {
    await video.saveAs(resolve(out, "finish-qa.webm"));
    assert(statSync(resolve(out, "finish-qa.webm")).size > 100000);
  }
  results.push({
    width,
    height,
    motion,
    samples,
    blockedRect,
    inspectionRect,
    reselectionRect,
    idleFrames,
    errors,
    writes,
    phaseTasks,
    startupTasks: tasks.filter((t) => t.start < intervals[0].start),
  });
}
// Actual account reads and clipboard outcomes; no wallet injection or transactions.
const liveContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const live = await liveContext.newPage();
await live.goto(base + "/app");
await live.locator(".copy-address").waitFor({ timeout: 30000 });
await live.waitForFunction(() =>
  document.getAnimations().every((a) => a.playState !== "running"),
);
await liveContext.route("https://api.devnet.solana.com/**", async (route) => {
  const method =
    route.request().method() === "POST"
      ? route.request().postDataJSON()?.method
      : "";
  assert(
    !["sendTransaction", "requestAirdrop", "simulateTransaction"].includes(
      method,
    ),
  );
  await new Promise((r) => setTimeout(r, 750));
  await route.continue();
});
await live.getByRole("button", { name: "Refresh", exact: true }).click();
await live
  .getByText("Refreshing accounts · current data stays visible.", {
    exact: true,
  })
  .first()
  .waitFor();
assert.equal(await live.locator(".command-world").count(), 1);
assert.equal(await live.locator(".capital-identity").count(), 1);
await live.screenshot({ path: resolve(out, "devnet-refreshing-existing.png") });
await live
  .getByRole("button", { name: "Refresh", exact: true })
  .waitFor({ state: "visible" });
await live.waitForFunction(
  () => !document.querySelector(".ledger-freshness button")?.disabled,
  { timeout: 30000 },
);
assert.equal(
  await live
    .locator(".capital-identity")
    .evaluate((n) => n.getAnimations().length),
  0,
  "Refetch does not replay inspector",
);
await live.locator(".copy-address").click();
await live.getByRole("status").filter({ hasText: "Copied" }).waitFor();
await live.screenshot({ path: resolve(out, "devnet-copy-success.png") });
await live.evaluate(() =>
  Object.defineProperty(navigator.clipboard, "writeText", {
    configurable: true,
    value: () => Promise.reject(new Error("Clipboard permission denied")),
  }),
);
await live.locator(".copy-address").click();
await live
  .getByText("Copy failed · select the address", { exact: true })
  .waitFor();
await live.screenshot({ path: resolve(out, "devnet-copy-denied.png") });
const currentIdentity = await live.locator(".capital-identity").innerText();
await liveContext.unrouteAll();
await liveContext.route("https://api.devnet.solana.com/**", (r) => r.abort());
await live.getByRole("button", { name: "Refresh", exact: true }).click();
await live.locator(".workspace-alert").waitFor();
assert.equal(
  await live.locator(".command-world").count(),
  1,
  "Failed refresh retains readable existing accounts",
);
assert.equal(
  await live.locator(".capital-identity").innerText(),
  currentIdentity,
);
assert.match(
  await live.locator(".workspace-alert").innerText(),
  /stale|Failed to fetch/,
);
await live.screenshot({ path: resolve(out, "devnet-stale-existing.png") });
await liveContext.close();
const offlineContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
await offlineContext.route("https://api.devnet.solana.com/**", (r) =>
  r.abort(),
);
const offline = await offlineContext.newPage();
await offline.goto(base + "/app");
await offline.locator('[role="alert"]').first().waitFor();
assert.equal(await offline.locator(".command-world").count(), 0);
await offline.screenshot({
  path: resolve(out, "rpc-failure.png"),
  fullPage: true,
});
await offlineContext.close();
await browser.close();
writeFileSync(resolve(out, "results.json"), JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map((r) => ({
      width: r.width,
      motion: r.motion,
      idleFrames: r.idleFrames,
      interactionLongTasks: r.phaseTasks
        .filter((p) => p.tasks.length)
        .map((p) => ({
          name: p.name,
          durations: p.tasks.map((t) => t.duration),
        })),
      startupTasks: r.startupTasks.map((t) => t.duration),
      errors: r.errors,
      writes: r.writes,
    })),
  ),
);
