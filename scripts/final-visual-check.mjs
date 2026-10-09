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
const output = resolve(
  process.argv[2] || "artifacts/final-visual-pass/first-pass",
);
mkdirSync(output, { recursive: true });
const b = await chromium.launch(),
  checks = [];
for (const [width, height, motion] of [
  [1440, 900, "no-preference"],
  [390, 844, "no-preference"],
  [1440, 900, "reduce"],
  [390, 844, "reduce"],
].filter((row) => !process.argv[3] || String(row[0]) === process.argv[3])) {
  const c = await b.newContext({
      viewport: { width, height },
      reducedMotion: motion,
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const forbidden = [];
  await c.route("https://api.devnet.solana.com/**", (r) => {
    if (r.request().method() === "OPTIONS") return r.continue();
    const data = r.request().postDataJSON(),
      requests = Array.isArray(data) ? data : [data];
    for (const x of requests)
      if (
        ["sendTransaction", "simulateTransaction", "requestAirdrop"].includes(
          x.method,
        )
      ) {
        forbidden.push(x.method);
        return r.abort();
      }
    return r.continue();
  });
  await p.addInitScript(() => {
    window.__frameCallbacks = 0;
    const schedule = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) =>
      schedule((t) => {
        window.__frameCallbacks++;
        cb(t);
      });
  });
  const still = () =>
    p.waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running"),
      null,
      { timeout: 10000 },
    );
  async function shot(name, focus) {
    await still();
    if (focus) await p.locator(focus).scrollIntoViewIfNeeded();
    else await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false, `${width} ${name} overflow`);
    if (motion !== "reduce") {
      await p.screenshot({
        path: resolve(output, `${name}-${width}x${height}.png`),
      });
      await p.screenshot({
        path: resolve(output, `${name}-full-${width}x${height}.png`),
        fullPage: true,
      });
    }
    checks.push({ width, height, motion, name, overflow });
  }
  await p.goto("http://127.0.0.1:3101/");
  for (const [action, state] of [
    ["Try demo", "story-grant"],
    ["Delegate further", "story-recursion"],
    ["Trace Scraper", "story-trace"],
    ["Preview Research revoke", "story-blast"],
    ["Confirm demo revoke", "story-cascade"],
  ]) {
    await p.getByRole("button", { name: action, exact: true }).press("Enter");
    if (state === "story-blast")
      assert.equal(
        (await p.locator(".seal-control-status").allTextContents()).filter(
          (x) => x === "active",
        ).length,
        6,
      );
    await shot(state);
  }
  for (const name of ["Operations", "Analysis", "Scraper"]) {
    await p
      .locator(".seal-controls button")
      .filter({ hasText: name })
      .press("Enter");
    await still();
    const path = await p.locator(".story-lineage strong").allTextContents();
    assert.deepEqual(
      path,
      name === "Operations"
        ? ["Root", "Operations"]
        : name === "Analysis"
          ? ["Root", "Research", "Analysis"]
          : ["Root", "Research", "Data", "Scraper"],
    );
  }
  await p.getByRole("link", { name: "Command", exact: true }).click();
  await p.getByRole("combobox", { name: "Product mode" }).selectOption("demo");
  await p.locator(".command-world").waitFor();
  await p.getByRole("button", { name: "Reset demo", exact: true }).click();
  await p
    .getByRole("button", { name: "Select Scraper", exact: true })
    .press("Enter");
  assert.match(
    await p.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*ACTIVE/,
  );
  assert.match(
    await p.locator(".selected-authority-path").innerText(),
    /Treasury → Research → Data → Scraper/,
  );
  await shot("command-active");
  if (width === 390) {
    await p
      .getByRole("button", { name: "Inspect Scraper", exact: true })
      .press("Enter");
    assert(
      await p
        .locator('[aria-label="Mandate inspector"]')
        .evaluate((el) => document.activeElement === el),
    );
    await shot("command-active-inspector", '[aria-label="Mandate inspector"]');
  }
  await p.getByRole("button", { name: "Select Research", exact: true }).click();
  await p.getByRole("button", { name: "Preview revoke", exact: true }).click();
  await shot("command-blast");
  await p.getByRole("button", { name: "Review revoke", exact: true }).click();
  await p
    .getByRole("button", { name: "Confirm demo revoke", exact: true })
    .click();
  assert.match(
    await p.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*BLOCKED/,
  );
  assert.match(
    await p.locator(".selected-authority-path").innerText(),
    /invalid ancestor\s+Research/,
  );
  assert.match(
    await p
      .getByRole("button", { name: "Select Operations", exact: true })
      .innerText(),
    /active/i,
  );
  await shot("command-blocked");
  if (width === 390)
    await shot("command-blocked-inspector", '[aria-label="Mandate inspector"]');
  await p
    .getByRole("combobox", { name: "Product mode" })
    .selectOption("devnet");
  await p
    .locator(".world-footer")
    .getByText("CONFIRMED ACCOUNT READS")
    .waitFor({ timeout: 120000 });
  await p.getByRole("button", { name: "Select Scraper", exact: true }).click();
  assert.match(
    await p.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*BLOCKED/,
  );
  await shot("command-observed-blocked");
  if (width === 390)
    await shot(
      "command-observed-inspector",
      '[aria-label="Mandate inspector"]',
    );
  await p
    .getByRole("button", { name: "Select Operations", exact: true })
    .click();
  assert.match(
    await p.locator(".local-state").innerText(),
    /ACTIVE[\s\S]*ACTIVE/,
  );
  await p.getByRole("link", { name: "Arena", exact: true }).click();
  await p.locator(".arena-world.account-backed").waitFor();
  await p.locator(".mission-stage.resolved").waitFor();
  assert.equal(
    await p.locator('.mission-stage[data-motion="settlement"]').count(),
    0,
    "Historic state must not animate a new settlement",
  );
  const winner = await p.locator(".mission-outcome > strong").innerText();
  await shot("arena-settled");
  const losing = p.locator(".contender:not(.winner)");
  await losing.press("Enter");
  assert.equal(
    await p.locator(".mission-outcome > strong").innerText(),
    winner,
  );
  assert.match(
    await p.locator(".submission-inspection").innerText(),
    /Not the recorded winner/,
  );
  await shot("arena-viewing");
  if (width === 390)
    await shot("arena-viewing-detail", ".submission-inspection");
  await p.locator(".contender.winner").press("Enter");
  assert.match(
    await p.locator(".submission-inspection").innerText(),
    /Recorded winner/,
  );
  await p.getByRole("combobox", { name: "Product mode" }).selectOption("demo");
  await p.getByRole("button", { name: "Reset demo", exact: true }).click();
  await p
    .getByRole("button", { name: "Fund demo mission", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Submit 3 demo results", exact: true })
    .click();
  await p.locator(".contender").nth(0).press("Enter");
  await shot("arena-selected");
  await p
    .getByRole("button", { name: "Select A & settle in demo", exact: true })
    .click();
  await shot("arena-demo-settled");
  assert.match(await p.locator(".mission-outcome").innerText(), /Submission A/);
  await still();
  const frames = await p.evaluate(() => window.__frameCallbacks);
  await p.waitForTimeout(500);
  assert.equal(
    (await p.evaluate(() => window.__frameCallbacks)) - frames,
    0,
    "No idle RAF",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(forbidden, []);
  checks.push({ width, height, motion, errors, forbidden, idleFrames: 0 });
  await c.close();
}
await b.close();
writeFileSync(resolve(output, "results.json"), JSON.stringify(checks, null, 2));
console.log(
  `${checks.length} verified states; no page errors, idle RAF or transactions`,
);
