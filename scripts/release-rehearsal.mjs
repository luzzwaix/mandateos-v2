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
const base = (process.argv[2] || "http://127.0.0.1:3102").replace(/\/$/, "");
const out = resolve(process.argv[3] || "artifacts/overnight-release/rehearsal");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage(),
  errors = [],
  methods = [],
  checks = [];
// Development OIDC is ephemeral; never send it to Solana or Explorer.
if (process.env.VERCEL_OIDC_TOKEN) {
  const origin = new URL(base).origin;
  await context.route(`${origin}/**`, (route) =>
    route.continue({
      headers: {
        ...route.request().headers(),
        "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN,
      },
    }),
  );
}
page.on("pageerror", (e) => errors.push(e.message));
await context.route("https://api.devnet.solana.com/**", async (route) => {
  const method = route.request().postDataJSON()?.method;
  methods.push(method);
  assert(
    !/sendTransaction|requestAirdrop|simulateTransaction/.test(method || ""),
    "Rehearsal must only read Devnet",
  );
  await route.continue();
});
const click = (name) => page.getByRole("button", { name, exact: true }).click();
async function storyCut() {
  for (const name of [
    "Delegate Research",
    "Delegate further",
    "Trace Scraper",
    "Preview Research revoke",
    "Confirm demo revoke",
  ])
    await click(name);
  await page.waitForTimeout(1700);
  assert.match(
    await page.locator(".cut-proof").innerText(),
    /Scraper[\s\S]*ACTIVE[\s\S]*BLOCKED[\s\S]*RESEARCH/i,
  );
  assert.match(
    await page.locator(".sibling-proof").innerText(),
    /200\.00 TOKENS.*Active/,
  );
}
try {
  assert.equal((await page.goto(base + "/"))?.status(), 200);
  await storyCut();
  await page.screenshot({
    path: resolve(out, "story-cut.png"),
    fullPage: true,
  });
  await page.reload();
  assert.equal(
    await page.locator(".mandate-story").getAttribute("data-stage"),
    "0",
  );
  await storyCut();
  await click("Inspect authority in Command");
  await page.locator(".command-world").waitFor();
  assert.equal(await page.getByLabel("Product mode").inputValue(), "demo");
  assert.match(
    await page.locator(".bone-instrument").innerText(),
    /Scraper[\s\S]*ACTIVE[\s\S]*BLOCKED/i,
  );
  await page.screenshot({
    path: resolve(out, "command-demo-blocked.png"),
    fullPage: true,
  });
  checks.push(
    "Fresh reload resets Demo; exact Story replay restores blocked Scraper and transfers mode/selection to Command",
  );
  await page.goto(base + "/arena");
  await page.getByLabel("Product mode").selectOption("demo");
  await click("Fund demo mission");
  await click("Submit 3 demo results");
  await page
    .locator(".contender")
    .filter({ has: page.getByText("Submission A", { exact: true }) })
    .click();
  await click("Select A & settle in demo");
  await page
    .locator(".mission-outcome")
    .filter({ hasText: "Submission A" })
    .waitFor();
  await page
    .locator(".contender")
    .filter({ has: page.getByText("Submission C", { exact: true }) })
    .click();
  assert.match(
    await page.locator(".submission-inspection").innerText(),
    /Not the recorded winner/,
  );
  assert.match(
    await page.locator(".mission-outcome").innerText(),
    /Submission A/,
  );
  await page.screenshot({
    path: resolve(out, "arena-demo-settled.png"),
    fullPage: true,
  });
  checks.push(
    "Demo settlement requires explicit action; inspecting a loser preserves actual selected winner",
  );
  for (const route of ["/app", "/arena"]) {
    assert.equal((await page.goto(base + route))?.status(), 200);
    assert.equal(await page.getByLabel("Product mode").inputValue(), "devnet");
    await page
      .getByText("CONFIRMED ACCOUNT READS", { exact: false })
      .waitFor({ timeout: 120000 });
    await page.reload();
    await page
      .getByText("CONFIRMED ACCOUNT READS", { exact: false })
      .waitFor({ timeout: 120000 });
    assert.equal(
      await page
        .getByLabel("Organization address", { exact: true })
        .inputValue(),
      "EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A",
    );
    if (route === "/app") {
      await page
        .locator(
          '[data-testid="node-H8esVNCEEjoXTzryxfha8bB6USacX9SJihq22Knv3ytB"]',
        )
        .click();
      assert.match(
        await page.locator(".bone-instrument").innerText(),
        /Scraper[\s\S]*ACTIVE[\s\S]*BLOCKED/i,
      );
      assert.match(
        await page.locator(".selected-authority-path").innerText(),
        /Earliest invalid ancestor\s+Research/,
      );
      await page.screenshot({
        path: resolve(out, "command-devnet.png"),
        fullPage: true,
      });
      await page
        .locator(
          '[data-testid="node-HzDvZ6Bg4VS8PcizrmTFXG9kbmPqZdH5yK79wshmnn21"]',
        )
        .click();
      assert.match(
        await page.locator(".bone-instrument").innerText(),
        /Operations[\s\S]*ACTIVE/i,
      );
    } else {
      assert.equal(await page.locator(".contender.winner").count(), 1);
      assert.match(await page.locator(".contender.winner").innerText(), /92XK/);
      const outcome = await page.locator(".mission-outcome").innerText();
      await page.locator(".contender:not(.winner)").first().click();
      assert.equal(await page.locator(".mission-outcome").innerText(), outcome);
      assert.match(
        await page.locator(".submission-inspection").innerText(),
        /Not the recorded winner/,
      );
      await page.screenshot({
        path: resolve(out, "arena-devnet.png"),
        fullPage: true,
      });
    }
    checks.push(
      `${route}: fresh direct navigation + refresh restores configured real organization; recorded selection restored using runbook click`,
    );
  }
  await click("Wallet");
  await click("Connect Phantom");
  const phantom = await page.locator("body").innerText();
  assert.match(phantom, /Install Phantom, then refresh this page/);
  checks.push(
    "Genuine Phantom provider absent; no wallet injection or signature requested",
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    resolve(out, "checks.json"),
    JSON.stringify(
      {
        base,
        time: new Date().toISOString(),
        checks,
        methods,
        errors,
        noSigning: true,
        noDevnetWrites: true,
        demoReload: "intentionally resets; replay documented actions",
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ base, checks, errors }));
} finally {
  await browser.close();
}
