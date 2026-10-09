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
const out = resolve(
  process.argv[2] || "artifacts/implementation-sprint/pass-1",
);
const record = process.argv.includes("--record");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [width, height, reducedMotion] of [
  [1440, 900, "no-preference"],
  [390, 844, "no-preference"],
  [1440, 900, "reduce"],
  [390, 844, "reduce"],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion,
    ...(record && width === 1440 && reducedMotion === "no-preference"
      ? { recordVideo: { dir: out, size: { width, height } } }
      : {}),
  });
  const page = await context.newPage();
  const errors = [],
    writes = [],
    events = [];
  const started = Date.now();
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://api.devnet.solana.com/**", (route) => {
    if (route.request().method() === "OPTIONS") return route.continue();
    const data = route.request().postDataJSON();
    for (const request of Array.isArray(data) ? data : [data])
      if (
        ["sendTransaction", "simulateTransaction", "requestAirdrop"].includes(
          request.method,
        )
      ) {
        writes.push(request.method);
        return route.abort();
      }
    return route.continue();
  });
  await page.addInitScript(() => {
    window.__sprintFrames = 0;
    window.__sprintLongTasks = [];
    const schedule = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) =>
      schedule((t) => {
        window.__sprintFrames++;
        cb(t);
      });
    new PerformanceObserver((list) =>
      window.__sprintLongTasks.push(
        ...list
          .getEntries()
          .map((e) => ({ start: e.startTime, duration: e.duration })),
      ),
    ).observe({ type: "longtask", buffered: true });
  });
  async function still() {
    await page.waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running"),
      null,
      { timeout: 10000 },
    );
  }
  async function capture(name, focus) {
    await still();
    if (focus) await page.locator(focus).scrollIntoViewIfNeeded();
    else await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false, `${width} ${name}: overflow`);
    if (reducedMotion === "no-preference") {
      await page.screenshot({ path: resolve(out, `${name}-${width}.png`) });
      await page.screenshot({
        path: resolve(out, `${name}-${width}-full.png`),
        fullPage: true,
      });
    }
    events.push({ name, seconds: (Date.now() - started) / 1000 });
  }
  await page.goto("http://127.0.0.1:3101/");
  const rootElement = await page.locator(".seal-root").elementHandle();
  for (const [action, name] of [
    ["Try demo", "story-grant"],
    ["Delegate further", "story-recursion"],
    ["Trace Scraper", "story-trace"],
    ["Preview Research revoke", "story-preview"],
  ]) {
    events.push({ action, seconds: (Date.now() - started) / 1000 });
    await page
      .getByRole("button", { name: action, exact: true })
      .press("Enter");
    await capture(name);
  }
  assert.deepEqual(
    await page.locator(".seal-control-status").allTextContents(),
    Array(6).fill("active"),
  );
  const rootBefore = await page.locator(".seal-root").boundingBox();
  const operationsBefore = await page
    .locator(".seal-mandate.operations")
    .boundingBox();
  events.push({ action: "Cascade", seconds: (Date.now() - started) / 1000 });
  await page
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .press("Enter");
  await capture("story-cascade");
  for (const [locator, before] of [
    [page.locator(".seal-root"), rootBefore],
    [page.locator(".seal-mandate.operations"), operationsBefore],
  ]) {
    const after = await locator.boundingBox();
    for (const key of ["x", "y", "width", "height"])
      assert(
        Math.abs(after[key] - before[key]) < 1,
        `Stable ${key}: ${before[key]} → ${after[key]}`,
      );
  }
  assert(
    await rootElement.evaluate(
      (node) => node === document.querySelector(".seal-root"),
    ),
  );
  assert.equal(
    await page.locator('.seal-mandate[data-status="blocked"]').count(),
    3,
  );
  assert.equal(
    await page.locator('.seal-mandate[data-status="revoked"]').count(),
    1,
  );
  assert.match(
    await page.locator(".cut-proof").innerText(),
    /Scraper[\s\S]*ACTIVE[\s\S]*BLOCKED[\s\S]*Research/,
  );
  events.push({
    action: "Story → Command",
    seconds: (Date.now() - started) / 1000,
  });
  await page
    .getByRole("button", { name: "Inspect authority in Command", exact: true })
    .press("Enter");
  await page.locator(".command-world").waitFor();
  if (reducedMotion === "no-preference" && width === 1440) {
    await page.waitForTimeout(180);
    await page.screenshot({ path: resolve(out, "handoff-in-progress.png") });
    await page.waitForTimeout(720);
    assert(
      await page.locator(".authority-handoff > svg").evaluateAll((nodes) =>
        nodes.every((node) => Number(getComputedStyle(node).opacity) === 0),
      ),
      "Finished snapshots remain hidden before timeline cleanup",
    );
  }
  await capture("command-blocked");
  assert.equal(
    await page.getByRole("combobox", { name: "Product mode" }).inputValue(),
    "demo",
  );
  assert.match(
    await page.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*BLOCKED/,
  );
  assert.match(
    await page.locator(".selected-authority-path").innerText(),
    /Treasury → Research → Data → Scraper[\s\S]*Research/,
  );
  assert.equal(await page.locator(".authority-handoff").count(), 0);
  if (width === 1440)
    assert(
      (await page.locator(".capital-controls").boundingBox()).y < 800,
      "Actions in first viewport",
    );
  const inspectName = (name) =>
    width === 390
      ? page.locator(".hierarchy-rail button").filter({ hasText: name })
      : page.getByRole("button", { name: `Select ${name}`, exact: true });
  await inspectName("Operations").press("Enter");
  assert.match(
    await page.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*ACTIVE/,
  );
  await capture("command-operations");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await inspectName("Scraper").press("Enter");
  await capture("command-active");
  await inspectName("Research").click();
  await page
    .getByRole("button", { name: "Preview revoke", exact: true })
    .click();
  await capture("command-preview");
  await page
    .getByRole("button", { name: "Review revoke", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Attempt demo spend", exact: true })
    .click();
  await capture(
    "command-demo-proof",
    width === 390 ? '[aria-label="Mandate inspector"]' : undefined,
  );
  assert.match(
    await page.locator(".blocked-proof").innerText(),
    /SIMULATED PROGRAM OUTCOME/,
  );
  const latencies = [];
  for (const name of [
    "Operations",
    "Scraper",
    "Research",
    "Data",
    "Analysis",
    "Scraper",
  ]) {
    const start = Date.now();
    await inspectName(name).press("Enter");
    assert.equal(
      await page.locator(".instrument-heading h2").innerText(),
      name,
    );
    latencies.push(Date.now() - start);
  }
  await still();
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  assert.match(
    await page.locator(".mission-outcome").innerText(),
    /Not funded/,
  );
  for (const name of ["Fund demo mission", "Submit 3 demo results"]) {
    events.push({ action: name, seconds: (Date.now() - started) / 1000 });
    await page.getByRole("button", { name, exact: true }).click();
    await still();
  }
  const first = page.locator(".contender").filter({ hasText: "Submission A" });
  await first.press("Enter");
  await capture("arena-selected");
  assert.match(
    await page.locator(".mission-outcome").innerText(),
    /Awaiting verifier/,
  );
  events.push({
    action: "Demo settlement",
    seconds: (Date.now() - started) / 1000,
  });
  await page
    .getByRole("button", { name: "Select A & settle in demo", exact: true })
    .click();
  await capture("arena-settled");
  const outcome = await page.locator(".mission-outcome").innerText();
  await page
    .locator(".contender")
    .filter({ has: page.getByText("Submission C", { exact: true }) })
    .press("Enter");
  assert.equal(await page.locator(".mission-outcome").innerText(), outcome);
  assert.match(
    await page.locator(".verifier-gate").innerText(),
    /Submission A selected/,
  );
  assert.equal(
    await page
      .locator(".contender.winner")
      .innerText()
      .then((t) => t.includes("Submission A")),
    true,
  );
  await capture("arena-viewing-other");
  if (width === 390)
    await capture("arena-verifier", '[data-arena-label="verifier"]');
  await still();
  const before = await page.evaluate(() => window.__sprintFrames);
  await page.waitForTimeout(500);
  const idleFrames =
    (await page.evaluate(() => window.__sprintFrames)) - before;
  assert.equal(idleFrames, 0);
  await page.getByRole("link", { name: "Story", exact: true }).click();
  await page
    .getByRole("button", { name: "Try demo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delegate further", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Trace Scraper", exact: true })
    .click();
  await page.setViewportSize({ width: width === 390 ? 440 : 1280, height });
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page.waitForTimeout(1700);
  assert.equal(
    await page.locator(".authority-motion-pulse, .authority-handoff").count(),
    0,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
    0,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(writes, []);
  const longTasks = await page.evaluate(() => window.__sprintLongTasks);
  results.push({
    width,
    height,
    reducedMotion,
    idleFrames,
    selectionRoundtripMs: latencies,
    longTasks,
    errors,
    writes,
    states: events,
  });
  const video = page.video();
  await context.close();
  if (video) await video.saveAs(resolve(out, "interaction-qa.webm"));
}
await browser.close();
writeFileSync(
  resolve(out, "acceptance.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  JSON.stringify(
    results.map(
      ({
        width,
        height,
        reducedMotion,
        idleFrames,
        selectionRoundtripMs,
        longTasks,
        errors,
        writes,
      }) => ({
        width,
        height,
        reducedMotion,
        idleFrames,
        selectionRoundtripMs,
        longTaskCount: longTasks.length,
        maxLongTaskMs: Math.max(0, ...longTasks.map((t) => t.duration)),
        errors,
        writes,
      }),
    ),
  ),
);
