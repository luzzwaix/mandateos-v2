// Comparable read-only production-build samples; never inject a wallet.
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
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
const output = resolve(process.argv[3] || "target/completion-sprint/before");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
const allowed = new Set([
  "getGenesisHash",
  "getSlot",
  "getAccountInfo",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getTokenAccountBalance",
  "getSignaturesForAddress",
  "getTransaction",
  "getSignatureStatuses",
  "getBlockHeight",
]);
for (let run = 1; run <= 3; run++) {
  for (const routeName of ["app", "arena"]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const rpc = [],
      errors = [];
    await context.route("https://api.devnet.solana.com/**", async (route) => {
      if (route.request().method() === "OPTIONS") return route.continue();
      const data = route.request().postDataJSON();
      if (!allowed.has(data.method))
        throw Error("Forbidden RPC: " + data.method);
      return route.continue();
    });
    await context.addInitScript(() => {
      window.__sprint = { longTasks: [], raf: 0, commits: 0 };
      new PerformanceObserver((list) =>
        window.__sprint.longTasks.push(
          ...list
            .getEntries()
            .map((e) => ({ start: e.startTime, duration: e.duration })),
        ),
      ).observe({ type: "longtask", buffered: true });
      const native = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) =>
        native((time) => {
          window.__sprint.raf++;
          callback(time);
        });
      let id = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true,
        inject: () => ++id,
        onCommitFiberRoot: () => window.__sprint.commits++,
        onCommitFiberUnmount() {},
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    const start = performance.now();
    page.on("request", (request) => {
      if (
        request.url() === "https://api.devnet.solana.com" ||
        request.url() === "https://api.devnet.solana.com/"
      )
        rpc.push({
          method: request.postDataJSON()?.method,
          startMs: performance.now() - start,
          request,
        });
    });
    page.on("response", async (response) => {
      const entry = rpc.find((row) => row.request === response.request());
      if (entry) {
        await response.finished();
        entry.endMs = performance.now() - start;
        entry.status = response.status();
      }
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await page.goto(`${base}/${routeName}`);
    await page.getByRole("button", { name: "Wallet", exact: true }).waitFor();
    const shellMs = performance.now() - start;
    await page
      .locator(".world-footer")
      .getByText("CONFIRMED ACCOUNT READS", { exact: false })
      .waitFor({ timeout: 120000 });
    const readyMs = performance.now() - start;
    const readinessRpc = rpc.length;
    const firstOrganization = rpc.find(
      (row) =>
        row.request.postDataJSON()?.params?.[0] ===
        "EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A",
    );
    const beforeIdle = await page.evaluate(() => ({ ...window.__sprint }));
    const idleStart = performance.now(),
      idleRpcStart = rpc.length;
    await page.waitForTimeout(20000);
    const idle = await page.evaluate(() => ({
      ...window.__sprint,
      animations: document
        .getAnimations()
        .filter((a) => a.playState === "running").length,
      phantom: !!window.phantom?.solana,
      svg: document.querySelectorAll("svg").length,
    }));
    const metrics = (await cdp.send("Performance.getMetrics")).metrics;
    const destination = routeName === "app" ? "Arena" : "Command";
    const switchStart = performance.now();
    await page.getByRole("link", { name: destination, exact: true }).click();
    await page
      .locator(destination === "Arena" ? ".arena-world" : ".command-world")
      .waitFor();
    const switchMs = performance.now() - switchStart;
    const row = {
      run,
      route: routeName,
      timestamp: new Date().toISOString(),
      shellMs,
      readyMs,
      readinessRpc,
      firstOrganizationResponseMs: firstOrganization?.endMs,
      switchMs,
      idle20s: {
        rpc: rpc.length - idleRpcStart,
        commits: idle.commits - beforeIdle.commits,
        raf: idle.raf - beforeIdle.raf,
        animations: idle.animations,
        longTasks: idle.longTasks.filter((t) => t.start > idleStart - start),
      },
      longTasks: idle.longTasks,
      commits: idle.commits,
      svg: idle.svg,
      phantom: idle.phantom,
      metrics,
      rpc: rpc.map(({ request, ...data }) => data),
      errors,
    };
    results.push(row);
    if (run === 1)
      await page.screenshot({
        path: resolve(output, `${routeName}-switched.png`),
        fullPage: true,
      });
    writeFileSync(
      resolve(output, "samples.json"),
      JSON.stringify(
        {
          base,
          browser: browser.version(),
          viewport: "1440x900",
          cluster: "devnet",
          cache: "fresh context per route",
          build: "production static export",
          wallet: "disconnected; no injected provider",
          idleNote:
            "20s after accounts ready; includes progressive history and paced polling",
          results,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        run,
        route: routeName,
        shellMs,
        readyMs,
        readinessRpc,
        switchMs,
        idle: row.idle20s,
        errors,
      }),
    );
    await context.close();
  }
}
await browser.close();
