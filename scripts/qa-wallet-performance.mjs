// Read-only Chromium Performance traces. No provider mocks, keys or signing.
// Usage: node scripts/qa-wallet-performance.mjs [base-url] [output-directory]
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let playwrightModule = process.env.PLAYWRIGHT_MODULE;
if (!playwrightModule) {
  try {
    playwrightModule = require.resolve("playwright");
  } catch {
    playwrightModule = resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    );
  }
}
const { chromium } = await import(pathToFileURL(playwrightModule).href);

const base = process.argv[2] ?? "http://127.0.0.1:3101";
const output = resolve(process.argv[3] ?? "target/gate0-performance");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const rpc = [],
  blocked = [],
  errors = [],
  phases = [],
  traceEvents = [];
const readMethods = new Set([
  "getGenesisHash",
  "getSlot",
  "getAccountInfo",
  "getMultipleAccounts",
  "getProgramAccounts",
  "getTokenAccountBalance",
  "getTokenSupply",
  "getBalance",
  "getSignaturesForAddress",
  "getTransaction",
  "getSignatureStatuses",
  "getBlockHeight",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getFeeForMessage",
  "getVersion",
]);
await context.route("**/*", async (route) => {
  const request = route.request();
  if (!request.url().includes("api.") || !request.url().includes("solana.com"))
    return route.continue();
  let body;
  try {
    body = request.postDataJSON();
  } catch {
    /* OPTIONS has no body. */
  }
  if (request.method() === "OPTIONS") return route.continue();
  const calls = Array.isArray(body) ? body : [body];
  if (
    new URL(request.url()).hostname !== "api.devnet.solana.com" ||
    calls.some((call) => !readMethods.has(call?.method))
  ) {
    blocked.push({
      url: request.url(),
      methods: calls.map((call) => call?.method),
    });
    return route.abort();
  }
  return route.continue();
});
await context.addInitScript(() => {
  window.__gate0 = { commits: [], longTasks: [], raf: 0 };
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = (fn) =>
    raf.call(window, (time) => {
      window.__gate0.raf++;
      fn(time);
    });
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: () => 1,
    onCommitFiberRoot: () => window.__gate0.commits.push(performance.now()),
    onCommitFiberUnmount: () => {},
  };
  new PerformanceObserver((list) =>
    window.__gate0.longTasks.push(
      ...list
        .getEntries()
        .map((e) => ({ start: e.startTime, duration: e.duration })),
    ),
  ).observe({ type: "longtask", buffered: true });
});
const page = await context.newPage();
const records = new Map();
page.on("request", (request) => {
  if (
    new URL(request.url()).hostname !== "api.devnet.solana.com" ||
    request.method() !== "POST"
  )
    return;
  const body = request.postDataJSON();
  const record = { at: Date.now(), method: body?.method, route: page.url() };
  records.set(request, record);
  rpc.push(record);
});
page.on("requestfinished", (request) => {
  const record = records.get(request);
  if (record) {
    record.finishedAt = Date.now();
    record.elapsedMs = record.finishedAt - record.at;
    record.timing = request.timing();
  }
});
page.on("response", async (response) => {
  const record = records.get(response.request());
  if (!record) return;
  record.status = response.status();
  try {
    const body = await response.json();
    if (body.error) record.rpcError = body.error;
  } catch {
    /* Network errors recorded below. */
  }
});
page.on("requestfailed", (request) => {
  const record = records.get(request);
  if (record) record.failure = request.failure()?.errorText;
});
page.on("pageerror", (error) => errors.push(error.message));
const cdp = await context.newCDPSession(page);
await cdp.send("Performance.enable");
cdp.on("Tracing.dataCollected", (event) => traceEvents.push(...event.value));
const traceDone = new Promise((resolveDone) =>
  cdp.once("Tracing.tracingComplete", resolveDone),
);
await cdp.send("Tracing.start", {
  categories:
    "devtools.timeline,v8.execute,blink.user_timing,loading,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,disabled-by-default-v8.cpu_profiler",
  transferMode: "ReportEvents",
});
const metrics = async () =>
  Object.fromEntries(
    (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
      m.name,
      m.value,
    ]),
  );
const state = () =>
  page.evaluate(() => ({
    ...window.__gate0,
    now: performance.now(),
    timeOrigin: performance.timeOrigin,
    phantom: !!window.phantom?.solana || !!window.solana?.isPhantom,
    animations: document
      .getAnimations()
      .filter((a) => a.playState === "running").length,
    canvas: document.querySelectorAll("canvas").length,
  }));
const save = () =>
  writeFileSync(
    resolve(output, "measurements.json"),
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        base,
        browser: browser.version(),
        wallet:
          "Disconnected. No provider/keypair injected. React commits are observed root commits, not per-component render counts.",
        phases,
        rpc,
        blocked,
        errors,
      },
      null,
      2,
    ),
  );
async function phase(name, task) {
  const before = await state(),
    cpuBefore = await metrics(),
    start = Date.now(),
    index = rpc.length;
  await page.evaluate((name) => performance.mark("gate0:start:" + name), name);
  await task();
  const after = await state(),
    cpuAfter = await metrics();
  const sameDocument = before.timeOrigin === after.timeOrigin;
  const requests = rpc.slice(index);
  const result = {
    name,
    cpuBefore,
    cpuAfter,
    ms: Date.now() - start,
    rpcCount: requests.length,
    methods: Object.fromEntries(
      [...new Set(requests.map((r) => r.method))].map((method) => [
        method,
        requests.filter((r) => r.method === method).length,
      ]),
    ),
    reactRootCommits: after.commits.filter(
      (time) => !sameDocument || time >= before.now,
    ).length,
    longTasks: after.longTasks.filter(
      (t) => !sameDocument || t.start >= before.now,
    ),
    rafCallbacks: after.raf - (sameDocument ? before.raf : 0),
    taskMs: (cpuAfter.TaskDuration - cpuBefore.TaskDuration) * 1000,
    scriptMs: (cpuAfter.ScriptDuration - cpuBefore.ScriptDuration) * 1000,
    layoutMs: (cpuAfter.LayoutDuration - cpuBefore.LayoutDuration) * 1000,
    styleMs:
      (cpuAfter.RecalcStyleDuration - cpuBefore.RecalcStyleDuration) * 1000,
    runningAnimations: after.animations,
    canvas: after.canvas,
    phantomAvailable: after.phantom,
  };
  await page.evaluate((name) => performance.mark("gate0:end:" + name), name);
  phases.push(result);
  save();
  const { cpuBefore: _before, cpuAfter: _after, ...summary } = result;
  console.log(JSON.stringify(summary));
}
try {
  await page.goto("about:blank");
  await phase("cold-command-through-account-read", async () => {
    const response = await page.goto(base + "/app");
    if (response?.status() !== 200)
      throw Error("Command did not return HTTP 200");
    await page
      .getByText("CONFIRMED ACCOUNT READS", { exact: false })
      .waitFor({ timeout: 120000 });
  });
  await phase("command-history-65s", () => page.waitForTimeout(65000));
  await phase("command-idle-20s", () => page.waitForTimeout(20000));
  await page.screenshot({
    path: resolve(output, "command.png"),
    fullPage: true,
  });
  await phase("phantom-unavailable-connect-attempt", async () => {
    await page.getByRole("button", { name: "Wallet", exact: true }).click();
    await page
      .getByRole("button", { name: "Connect Phantom", exact: true })
      .click();
    await page
      .getByText("Install Phantom, then refresh this page", { exact: true })
      .first()
      .waitFor();
    await page
      .getByRole("button", { name: "Close wallet menu", exact: true })
      .click();
  });
  await phase("app-to-arena", async () => {
    await page.getByRole("link", { name: "Arena", exact: true }).click();
    await page.locator(".arena-world.account-backed").waitFor();
  });
  await phase("arena-idle-20s", () => page.waitForTimeout(20000));
  await page.screenshot({ path: resolve(output, "arena.png"), fullPage: true });
  for (const [name, selector] of [
    ["Command", ".command-world"],
    ["Arena", ".arena-world"],
    ["Command", ".command-world"],
    ["Arena", ".arena-world"],
  ]) {
    await phase("route-to-" + name.toLowerCase(), async () => {
      await page.getByRole("link", { name, exact: true }).click();
      await page.locator(selector).waitFor();
    });
  }
  await phase("direct-arena-through-account-read", async () => {
    const response = await page.goto(base + "/arena");
    if (response?.status() !== 200)
      throw Error("Arena did not return HTTP 200");
    await page
      .locator(".arena-world.account-backed")
      .waitFor({ timeout: 120000 });
  });
  await phase("direct-arena-idle-20s", () => page.waitForTimeout(20000));
  if (blocked.length) throw Error("Unexpected non-read RPC was blocked");
} catch (error) {
  errors.push(String(error));
  console.error(String(error));
  process.exitCode = 1;
} finally {
  await cdp.send("Tracing.end");
  await traceDone;
  writeFileSync(
    resolve(output, "performance.trace.json"),
    JSON.stringify({
      traceEvents,
      metadata: {
        base,
        wallet: "disconnected",
        browser: browser.version(),
        noWalletMock: true,
      },
    }),
  );
  save();
  await context.close();
  await browser.close();
}
