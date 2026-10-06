import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
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
assert(
  existsSync(modulePath),
  "Set PLAYWRIGHT_MODULE to an existing Playwright installation",
);
const { chromium } = await import(pathToFileURL(modulePath).href);
const output = resolve(
  process.argv[3] ?? "artifacts/devnet-release/mvp-continuation/browser-live",
);
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [];
const requests = [];
const errors = [];
const rpcErrors = [];
const record = (name, pass) => {
  checks.push({ name, pass });
  assert(pass, name);
  console.log("PASS " + name);
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
let activePage = page;
page.on("response", async (r) => {
  if (r.url() !== "https://api.devnet.solana.com/") return;
  try {
    const raw = await r.text();
    const parsed = JSON.parse(raw);
    if (!r.ok() || parsed.error) rpcErrors.push({ status: r.status(), raw });
  } catch {}
});
page.on("pageerror", (e) => errors.push(String(e)));
page.on("request", (r) => {
  if (r.url().startsWith("https://api.devnet.solana.com")) {
    try {
      requests.push({
        time: Date.now(),
        method: JSON.parse(r.postData()).method,
      });
    } catch {}
  }
});
try {
  const navigation = await page.goto(
    (process.argv[2] ?? "http://127.0.0.1:3101") + "/app",
  );
  record(
    "Direct Command route returns HTTP 200 and renders the application",
    navigation?.status() === 200 &&
      !(await page.locator("body").innerText()).includes(
        "This page could not be found",
      ),
  );
  record(
    "Public product defaults to DEVNET",
    (await page.getByLabel("Product mode").inputValue()) === "devnet",
  );
  await page.getByLabel("Product mode").selectOption("demo");
  record(
    "Initial DEMO explicitly says no onchain transactions",
    (await page.locator("footer").innerText()).includes("SIMULATED STATE"),
  );
  await page.getByLabel("Product mode").selectOption("devnet");
  await page
    .getByText("CONFIRMED ACCOUNT READS", { exact: false })
    .waitFor({ timeout: 90000 });
  await page
    .getByRole("heading", { name: "Transaction evidence", exact: true })
    .waitFor({ timeout: 90000 });
  await page.getByText("Network and account evidence", { exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".event-row").length > 0,
    {},
    { timeout: 90000 },
  );
  let text = await page.locator("body").innerText();
  writeFileSync(resolve(output, "command-live.txt"), text);
  record(
    "Actual deployed Program ID is visible",
    text.includes("125ZLPqLmkg1fuyLzAxfKGXkT2tfxnNqyGrtHyjgDCUd"),
  );
  record(
    "Actual organization and test mint are visible",
    text.includes("EJsA5n6BBusygH8Ze9pktPFbpP2FXGEEBBgcE6A2Dz3A") &&
      text.includes("6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9"),
  );
  record(
    "Live unit is test TOKENS and never USDC",
    text.includes("TOKENS") && !text.includes("USDC"),
  );
  record(
    "Live lineage retains blocked descendants and revoked Research",
    text.toLowerCase().includes("blocked") &&
      text.toLowerCase().includes("revoked"),
  );
  record("Live vault displays observed 100 tokens", text.includes("100.00"));
  await page.screenshot({
    path: resolve(output, "command-live.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Wallet", exact: true }).click();
  await page
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await page
    .locator(".wallet-popover")
    .getByText("Install Phantom, then refresh this page", { exact: true })
    .waitFor({ timeout: 15000 });
  record("Missing real extension is handled without sending", true);
  await page
    .getByRole("button", { name: "Close wallet menu", exact: true })
    .click();
  await page.getByRole("link", { name: "Arena", exact: true }).click();
  await page.locator(".arena-world.account-backed").waitFor({ timeout: 90000 });
  await page
    .getByText("CONFIRMED ACCOUNT READS", { exact: false })
    .waitFor({ timeout: 90000 });
  await page
    .locator(".arena-world.account-backed")
    .getByText("SETTLED", { exact: false })
    .first()
    .waitFor({ timeout: 90000 });
  text = await page.locator("body").innerText();
  writeFileSync(resolve(output, "arena-live.txt"), text);
  record(
    "Arena shows actual settled 25-token reward",
    text.includes("25.00") && text.includes("SETTLED"),
  );
  record(
    "Arena remains explicitly Devnet with test-token units",
    text.includes("TOKENS") &&
      text.includes("CONFIRMED ACCOUNT READS") &&
      !text.includes("USDC"),
  );
  record(
    "Real settlement Explorer link is present",
    (await page
      .locator(
        'a[href="https://explorer.solana.com/tx/2F1Ukc4haw5PhmWZi6wLQtMqLYgH5cW4axH941gXKSiYpnrR72KoNrf3x66V5a9BbQM6GXtRAkiCMv8Dyw1QpET1?cluster=devnet"]',
      )
      .count()) > 0,
  );
  await page.screenshot({
    path: resolve(output, "arena-live.png"),
    fullPage: true,
  });
  record(
    "Read-only browser pass sent no transactions",
    requests.every(
      (r) => !["sendTransaction", "requestAirdrop"].includes(r.method),
    ),
  );
  record("No browser runtime errors", errors.length === 0);

  const mockContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const publicAddress = new (require("@solana/web3.js").PublicKey)(
    "C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo",
  );
  await mockContext.addInitScript(
    ({ address, words, length, bytes }) => {
      const listeners = {};
      let connects = 0;
      const publicKey = {
        // Match PublicKey's public identity/BN representation, never a signer.
        _bn: { words, length, negative: 0, red: null },
        toBase58: () => address,
        toString: () => address,
        toBuffer: () => Uint8Array.from(bytes),
        toBytes: () => Uint8Array.from(bytes),
        equals: (k) => k?.toBase58?.() === address,
      };
      const adapter = {
        isPhantom: true,
        publicKey,
        connect: async () => {
          connects++;
          if (connects === 1)
            throw Error("QA adapter: connection approval rejected");
          return { publicKey };
        },
        disconnect: async () => {
          for (const cb of listeners.disconnect ?? []) cb();
        },
        signTransaction: async () => {
          throw Error("QA adapter never signs");
        },
        signAllTransactions: async () => {
          throw Error("QA adapter never signs");
        },
        on: (event, cb) => (listeners[event] ??= []).push(cb),
        removeListener: (event, cb) => {
          listeners[event] = (listeners[event] ?? []).filter((x) => x !== cb);
        },
      };
      window.phantom = { solana: adapter };
      window.__qaWallet = {
        emit: (event) => {
          for (const cb of [...(listeners[event] ?? [])]) cb();
        },
      };
    },
    {
      address: publicAddress.toBase58(),
      words: publicAddress._bn.words,
      length: publicAddress._bn.length,
      bytes: [...publicAddress.toBytes()],
    },
  );
  const mockPage = await mockContext.newPage();
  activePage = mockPage;
  mockPage.on("pageerror", (e) => errors.push("MOCK: " + String(e)));
  let mockSends = 0;
  mockPage.on("request", (r) => {
    if (r.url().startsWith("https://api.devnet.solana.com")) {
      try {
        if (JSON.parse(r.postData()).method === "sendTransaction") mockSends++;
      } catch {}
    }
  });
  await mockPage.goto((process.argv[2] ?? "http://127.0.0.1:3101") + "/app");
  await mockPage.getByLabel("Product mode").selectOption("devnet");
  await mockPage.getByRole("button", { name: "Wallet", exact: true }).click();
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await mockPage
    .locator(".wallet-popover")
    .getByText("QA adapter: connection approval rejected", { exact: true })
    .waitFor({ timeout: 20000 });
  record(
    "MOCK wallet connection refusal is displayed; not on-chain evidence",
    true,
  );
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await mockPage
    .locator(".wallet-popover")
    .getByText("C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo", { exact: true })
    .waitFor({ timeout: 60000 });
  record("MOCK public-only C7 adapter reconnects after refusal", true);
  await mockPage
    .getByRole("button", { name: "Disconnect", exact: true })
    .click();
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .waitFor({ timeout: 60000 });
  record("MOCK disconnect clears signer state", true);
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await mockPage
    .locator(".wallet-popover")
    .getByText("C7jMtkonHhz14rBojP7FWSE8xbGjKybA5FLmzTmTGLpo", { exact: true })
    .waitFor({ timeout: 60000 });
  record("MOCK reconnect restores public address without signer secrets", true);
  await mockPage.evaluate(() => window.__qaWallet.emit("accountChanged"));
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .waitFor({ timeout: 60000 });
  record("MOCK accountChanged clears obsolete authority signer", true);
  record(
    "MOCK wallet checks generated no signature or transaction",
    mockSends === 0,
  );
  record(
    "MOCK public adapter passes loaded-account comparisons without runtime errors",
    errors.length === 0,
  );
  await mockPage
    .getByRole("button", { name: "Connect Phantom", exact: true })
    .click();
  await mockPage
    .getByRole("button", { name: "Close wallet menu", exact: true })
    .click();
  await mockPage
    .getByRole("heading", { name: "Transaction evidence", exact: true })
    .waitFor({ timeout: 90000 });
  await mockPage
    .getByText("Network and account evidence", { exact: true })
    .click();
  const invalidOrganization = "11111111111111111111111111111111";
  await mockPage
    .getByLabel("Organization address", { exact: true })
    .fill(invalidOrganization);
  record(
    "MOCK typing an address retains the previously read organization until Open",
    (await mockPage.locator(".flat-node").count()) > 0,
  );
  await mockPage
    .getByRole("button", { name: "Read accounts", exact: true })
    .click();
  await mockPage.locator(".unconnected-world").waitFor({ timeout: 60000 });
  await mockPage.locator(".error-text").first().waitFor({ timeout: 60000 });
  record(
    "MOCK missing organization clears the old capital view",
    (await mockPage.locator(".flat-node").count()) === 0,
  );
  await mockPage.locator(".connection-instrument details summary").click();
  await mockPage
    .getByLabel("Organization mint", { exact: true })
    .fill("6V3c3UWqXerQFyfVhFiWVMaXEjNPUmHwWsPa2c4TS1A9");
  await mockPage.waitForFunction(
    () => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => x.textContent.trim() === "Create organization",
      );
      return b && !b.disabled;
    },
    {},
    { timeout: 60000 },
  );
  record(
    "MOCK new organization remains available after a missing-account read; signing was not requested",
    true,
  );
  await mockPage.reload();
  await mockPage.waitForFunction(
    (address) =>
      document.querySelector('[aria-label="Organization address"]')?.value ===
      address,
    invalidOrganization,
    { timeout: 60000 },
  );
  record(
    "Public organization selection survives a same-tab reload without signer storage",
    true,
  );
  const proof = JSON.parse(readFileSync("docs/devnet-mvp-proof.json", "utf8"));
  const prior = proof.transactions.find((x) => x.step === "operations-spend");
  await mockPage.evaluate(
    ({ program, organization, signature }) => {
      sessionStorage.setItem(
        `mandateos:pending:${program}`,
        JSON.stringify({
          signature,
          lastValidBlockHeight: 1,
          title: "READ-ONLY REPLAY of existing CLI receipt",
          organization,
        }),
      );
    },
    {
      program: proof.program,
      organization: proof.organization,
      signature: prior.signature,
    },
  );
  await mockPage.reload();
  await mockPage.waitForFunction(
    (program) =>
      sessionStorage.getItem(`mandateos:pending:${program}`) === null,
    proof.program,
    { timeout: 120000 },
  );
  record(
    "READ-ONLY recovery replay reconciles an existing real CLI receipt; no new browser transaction",
    true,
  );
  record(
    "Recovery restores the affected organization instead of the obsolete selected address",
    (await mockPage
      .getByLabel("Organization address", { exact: true })
      .inputValue()) === proof.organization,
  );
  record(
    "Edge-state and recovery checks submitted zero transactions",
    mockSends === 0,
  );
  record("Edge-state checks produced zero runtime errors", errors.length === 0);
  await mockContext.close();

  await browser.close();
  writeFileSync(
    resolve(output, "checks.json"),
    JSON.stringify(
      {
        time: new Date().toISOString(),
        checks,
        requests,
        errors,
        rpcErrors,
        noSignerSecrets: true,
        noSigning: true,
        noSubmission: true,
        realExtensionSigningVerified: false,
      },
      null,
      2,
    ),
  );
  console.log(checks.length + " browser live checks passed");
} catch (failure) {
  writeFileSync(
    resolve(output, "failed-read.txt"),
    await activePage
      .locator("body")
      .innerText()
      .catch(() => "Unavailable"),
  );
  await activePage
    .screenshot({ path: resolve(output, "failed-read.png"), fullPage: true })
    .catch(() => {});
  writeFileSync(
    resolve(output, "failed-check.json"),
    JSON.stringify(
      {
        time: new Date().toISOString(),
        failure: String(failure),
        checks,
        errors,
        rpcErrors,
        requests,
        noSubmission: true,
      },
      null,
      2,
    ),
  );
  await browser.close();
  throw failure;
}
