import assert from "node:assert/strict";
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
const browser = await chromium.launch();
for (const interrupt of ["resize", "preference", "keyboard"]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.route("https://api.devnet.solana.com/**", (r) => {
    const method =
      r.request().method() === "POST" ? r.request().postDataJSON()?.method : "";
    assert(
      !["sendTransaction", "requestAirdrop", "simulateTransaction"].includes(
        method,
      ),
    );
    return r.continue();
  });
  await page.goto("http://127.0.0.1:3101/");
  for (const name of [
    "Delegate Research",
    "Delegate further",
    "Trace Scraper",
    "Preview Research revoke",
    "Confirm demo revoke",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    );
  }
  await page
    .getByRole("button", { name: "Inspect authority in Command", exact: true })
    .click();
  await page.locator(".authority-handoff").waitFor({ state: "attached" });
  if (interrupt === "resize")
    await page.setViewportSize({ width: 1280, height: 900 });
  else if (interrupt === "preference")
    await page.emulateMedia({ reducedMotion: "reduce" });
  else await page.keyboard.press("Escape");
  await page.locator(".authority-handoff").waitFor({ state: "detached" });
  await page.locator(".command-world").waitFor();
  assert.equal(
    await page.locator("body").getAttribute("data-authority-handoff"),
    null,
  );
  assert.match(
    await page.locator(".capital-identity").innerText(),
    /Scraper[\s\S]*BLOCKED/,
  );
  assert.equal(
    await page
      .locator(".root-body")
      .evaluate((n) => getComputedStyle(n).visibility),
    "visible",
  );
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  assert.equal(await page.locator(".authority-motion-pulse").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    `Active handoff ${interrupt}: cleanup, selected mandate and one visible destination passed`,
  );
  await context.close();
}
await browser.close();
