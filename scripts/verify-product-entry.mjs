// Scoped first-visitor checks: real destinations, downloads, failure/recovery.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const base = new URL(process.argv[2] || "http://127.0.0.1:3211").origin;
const out = resolve(process.argv[3] || "artifacts/productization");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
let activePage;
let activeRpc;
const headers = process.env.VERCEL_OIDC_TOKEN
  ? { "x-vercel-trusted-oidc-idp-token": process.env.VERCEL_OIDC_TOKEN }
  : {};
try {
  const manifestResponse = await fetch(base + "/downloads/manifest.json", {
    headers,
    redirect: "manual",
  });
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  for (const file of manifest.files) {
    const response = await fetch(base + "/downloads/" + file.name, {
      headers,
      redirect: "manual",
    });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
    if (file.name === "inspect-devnet.mjs")
      assert.equal(
        bytes.toString(),
        readFileSync("examples/inspect-devnet.mjs", "utf8"),
      );
  }
  results.push({ check: "SDK downloads", pass: true, files: manifest.files });
  for (const width of process.env.MANDATEOS_QA_ONE ? [1440] : [1440, 390])
    for (const reducedMotion of process.env.MANDATEOS_QA_ONE
      ? ["no-preference"]
      : ["no-preference", "reduce"]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion,
      });
      const page = await context.newPage(),
        errors = [],
        rpc = [];
      activePage = page;
      activeRpc = rpc;
      page.on("pageerror", (error) => errors.push(error.message));
      if (process.env.VERCEL_OIDC_TOKEN)
        await context.route(base + "/**", (route) =>
          route.continue({
            headers: { ...route.request().headers(), ...headers },
          }),
        );
      let failRpc = false;
      await context.route("https://api.devnet.solana.com/**", async (route) => {
        const method = route.request().postDataJSON()?.method;
        rpc.push(method);
        assert(
          !/sendTransaction|simulateTransaction|requestAirdrop/.test(
            method || "",
          ),
        );
        if (failRpc) await route.abort();
        else await route.continue();
      });
      const start = Date.now();
      const response = await page.goto(base + "/");
      assert.equal(response.status(), 200);
      await page.getByRole("button", { name: "Try demo", exact: true }).click();
      await page
        .getByRole("button", { name: "Delegate further", exact: true })
        .waitFor();
      const demoInteractiveMs = Date.now() - start;
      const nav = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return {
          responseStartMs: n.responseStart,
          htmlCompleteMs: n.responseEnd,
          domContentLoadedMs: n.domContentLoadedEventEnd,
        };
      });
      assert.equal(rpc.length, 0, "Story must make no Devnet reads");
      await page
        .getByRole("link", { name: "Integrate with SDK", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Integrate with MandateOS", exact: true })
        .waitFor();
      assert.equal(
        rpc.length,
        0,
        "SDK instructions must not start account loading",
      );
      assert.equal(
        await page
          .getByRole("link", { name: "Download SDK 0.1.0", exact: true })
          .getAttribute("href"),
        "/downloads/mandateos-sdk-0.1.0.tgz",
      );
      await page
        .getByText("See the minimal exported API example", { exact: true })
        .click();
      assert.match(
        await page.locator("details pre").innerText(),
        /MandateClient[\s\S]*inspectAuthority/,
      );
      await page.screenshot({
        path: resolve(out, `sdk-${width}-${reducedMotion}.png`),
        fullPage: true,
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(overflow, false);
      // Force a retained Demo session before the explicit real-Devnet entry.
      await page.getByRole("link", { name: "Story", exact: true }).click();
      await page.screenshot({
        path: resolve(out, `story-entry-${width}-${reducedMotion}.png`),
        fullPage: true,
      });
      for (const name of [
        "Try demo",
        "Delegate further",
        "Trace Scraper",
        "Preview Research revoke",
        "Confirm demo revoke",
        "Inspect authority in Command",
      ])
        await page.getByRole("button", { name, exact: true }).click();
      await page.getByLabel("Product mode").selectOption("demo");
      await page.getByRole("link", { name: "SDK", exact: true }).click();
      const readStart = Date.now();
      await page
        .getByRole("link", { name: "Inspect real Devnet", exact: true })
        .click();
      assert.equal(
        await page.getByLabel("Product mode").inputValue(),
        "devnet",
      );
      await page
        .getByRole("button", { name: "Select Scraper", exact: true })
        .waitFor({ timeout: 90000 });
      const accountReadyMs = Date.now() - readStart;
      await page
        .getByRole("button", { name: "Select Scraper", exact: true })
        .click();
      const inspector = await page
        .getByRole("complementary", { name: "Mandate inspector", exact: true })
        .innerText();
      assert.match(inspector, /ACTIVE[\s\S]*BLOCKED[\s\S]*Research/i);
      await page.screenshot({
        path: resolve(out, `command-${width}-${reducedMotion}.png`),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Select Operations", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("complementary", {
            name: "Mandate inspector",
            exact: true,
          })
          .getByRole("button", { name: "spend", exact: true })
          .isDisabled(),
        true,
      );
      await page
        .getByRole("button", { name: "Select Scraper", exact: true })
        .click();
      // RPC failure must be visible; account/history reads have distinct outcomes.
      failRpc = true;
      await page.getByRole("button", { name: "Refresh", exact: true }).click();
      await page.locator(".workspace-alert").waitFor({ timeout: 30000 });
      const readFailure = await page.locator(".workspace-alert").innerText();
      assert.match(
        readFailure,
        /stale|transaction history is partial|Failed to fetch/i,
      );
      assert.equal(
        await page.getByLabel("Product mode").inputValue(),
        "devnet",
      );
      await page.screenshot({
        path: resolve(out, `stale-${width}-${reducedMotion}.png`),
        fullPage: true,
      });
      await page.goto(base + "/arena");
      await page
        .getByRole("button", { name: "Retry account reads", exact: true })
        .waitFor({ timeout: 30000 });
      await page
        .getByRole("link", {
          name: "Try the demo while RPC recovers",
          exact: true,
        })
        .waitFor();
      await page.screenshot({
        path: resolve(out, `read-failed-${width}-${reducedMotion}.png`),
        fullPage: true,
      });
      failRpc = false;
      await page
        .getByRole("button", { name: "Retry account reads", exact: true })
        .click();
      await page
        .locator(".arena-world.account-backed")
        .waitFor({ timeout: 90000 });
      assert.deepEqual(errors, []);
      results.push({
        check: `${width}/${reducedMotion}`,
        pass: true,
        ...nav,
        demoInteractiveMs,
        accountReadyMs,
        wallet: "provider connection/signing not measured",
        errors,
        forbiddenWrites: 0,
      });
      await context.close();
    }
  writeFileSync(
    resolve(out, "checks.json"),
    JSON.stringify({ base, results }, null, 2),
  );
  console.log(JSON.stringify({ base, results }));
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    await activePage.screenshot({
      path: resolve(out, "failure.png"),
      fullPage: true,
    });
    writeFileSync(
      resolve(out, "failure.json"),
      JSON.stringify(
        {
          error: String(error),
          rpc: activeRpc,
          url: activePage.url(),
          visibleState: await activePage.locator("body").innerText(),
        },
        null,
        2,
      ),
    );
  }
  throw error;
} finally {
  await browser.close();
}
