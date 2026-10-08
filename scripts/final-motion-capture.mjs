import { homedir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
const { chromium } = await import(
  pathToFileURL(
    resolve(
      homedir(),
      ".codex/skills/develop-web-game/node_modules/playwright/index.mjs",
    ),
  ).href
);
const out = resolve("artifacts/final-visual-pass/after/motion");
mkdirSync(out, { recursive: true });
const b = await chromium.launch(),
  c = await b.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: out, size: { width: 1440, height: 900 } },
  }),
  p = await c.newPage(),
  events = [];
const started = Date.now();
async function action(name, fn, wait = 1000) {
  events.push({ name, seconds: (Date.now() - started) / 1000 });
  await fn();
  await p.waitForTimeout(wait);
}
await p.goto("http://127.0.0.1:3101/");
for (const name of [
  "Delegate Research",
  "Delegate further",
  "Trace Scraper",
  "Preview Research revoke",
  "Confirm demo revoke",
])
  await action(
    name,
    () => p.getByRole("button", { name, exact: true }).click(),
    1300,
  );
await action(
  "Inspect authority in Command",
  () =>
    p
      .getByRole("button", {
        name: "Inspect authority in Command",
        exact: true,
      })
      .click(),
  400,
);
await p
  .getByRole("combobox", { name: "Product mode" })
  .selectOption("demo", { timeout: 120000 });
await action("Reset command demo", () =>
  p.getByRole("button", { name: "Reset demo", exact: true }).click(),
);
for (const name of [
  "Select Scraper",
  "Select Operations",
  "Select Analysis",
  "Select Scraper",
])
  await action(
    name,
    () => p.getByRole("button", { name, exact: true }).click(),
    700,
  );
await action(
  "Open Arena",
  () => p.getByRole("link", { name: "Arena", exact: true }).click(),
  400,
);
for (const name of ["Fund demo mission", "Submit 3 demo results"])
  await action(name, () =>
    p.getByRole("button", { name, exact: true }).click(),
  );
await action(
  "Select submission A",
  () => p.locator(".contender").nth(0).click(),
  900,
);
await action(
  "Simulated settlement",
  () =>
    p
      .getByRole("button", { name: "Select A & settle in demo", exact: true })
      .click(),
  1600,
);
await p.waitForTimeout(1000);
const video = p.video();
await c.close();
await video.saveAs(resolve(out, "interactions.webm"));
await b.close();
writeFileSync(resolve(out, "events.json"), JSON.stringify(events, null, 2));
console.log(JSON.stringify(events));
