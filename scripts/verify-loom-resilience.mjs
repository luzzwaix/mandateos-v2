import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const bin = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-high-end";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const out = resolve("artifacts/high-end/rebuild-resilience");
mkdirSync(out, { recursive: true });
const run = (...args) => {
  const r = spawnSync(bin, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
    windowsHide: true,
  });
  if (r.status !== 0 || r.error)
    throw Error(r.error?.message ?? r.stdout + r.stderr);
  return r.stdout;
};
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
const wait = (ms) => run("wait", String(ms));
const click = (name, exact = true) => {
  run(
    "find",
    "role",
    "button",
    "click",
    "--name",
    name,
    ...(exact ? ["--exact"] : []),
  );
  run("snapshot", "-i");
};
const open = (route) => {
  run("open", base + route);
  run("snapshot", "-i");
  wait(1800);
};
const results = [];
const check = (name, code) => {
  const result = evaluate(code);
  results.push({ name, result });
  console.log(`${result ? "PASS" : "FAIL"} ${name}`);
  assert.equal(result, true, name);
};
run("set", "viewport", "1440", "900");
run("set", "media", "no-preference");
open("/");
click("Try demo");
click("Trace");
wait(1000);
check(
  "Interrupted delegation retains committed model and resolves labels",
  "document.querySelectorAll('.loom-label').length===2 && !document.querySelector('[data-resolved=false]') && document.querySelector('.authority-loom').dataset.director==='idle'",
);
click("Reset");
click("Try demo");
wait(1300);
click("Build demo hierarchy");
click("Genesis");
wait(1100);
check(
  "Interrupting recursive construction cancels outstanding additions",
  "document.querySelectorAll('.loom-label').length<6 && !document.querySelector('[data-resolved=false]')",
);
click("Reset");
run("set", "viewport", "390", "844");
click("Try demo");
click("Build demo hierarchy");
click("Trace");
click("Trace Scraper");
check(
  "Mobile construction and complete trace work without perspective",
  "!document.querySelector('canvas') && document.querySelectorAll('[data-mobile-node]').length===6 && document.querySelector('.story-instrument').innerText.includes('Treasury → Research → Data → Scraper')",
);
click("Blast Radius");
click("Preview Research revoke");
check(
  "Mobile preview distinguishes affected branch while all remain active",
  "document.querySelectorAll('.flat-ledger-node.preview-affected').length===4 && !document.querySelector('.flat-ledger-node.blocked')",
);
click("Confirm demo revoke");
run("screenshot", "--full", resolve(out, "mobile-cascade.png"));
check(
  "Mobile cascade preserves active Operations",
  "document.querySelectorAll('.flat-ledger-node.blocked').length===3 && document.querySelector('[data-mobile-node=operations]').classList.contains('active')",
);
run("set", "viewport", "1440", "900");
wait(1800);
check(
  "Live desktop resize resumes spatial rendering from the same model",
  "!!document.querySelector('canvas') && document.querySelectorAll('.loom-label.blocked').length===3",
);
run("set", "media", "reduced-motion");
wait(400);
check(
  "Live reduced-motion switch immediately restores native state",
  "!document.querySelector('canvas') && document.querySelectorAll('.flat-node.blocked').length===3 && document.querySelector('.authority-loom').dataset.webgl!=='ready'",
);
run("set", "media", "no-preference");
wait(1800);
function loseContext() {
  const available = evaluate(
    "(() => {const c=document.querySelector('canvas'),g=c?.getContext('webgl2'),e=g?.getExtension('WEBGL_lose_context');if(!e)return false;e.loseContext();return true})()",
  );
  assert.equal(
    available,
    true,
    "Chrome exposes a real WebGL context-loss test extension",
  );
  wait(500);
}
loseContext();
check(
  "Real Story WebGL loss leaves usable native authority and no render loop",
  "!document.querySelector('canvas') && document.querySelector('.authority-loom').dataset.webgl==='lost' && document.querySelectorAll('.flat-node').length===6",
);
run("screenshot", resolve(out, "story-context-loss.png"));
open("/arena");
loseContext();
check(
  "Real Arena WebGL loss exposes native execution field",
  "!document.querySelector('canvas') && getComputedStyle(document.querySelector('.mission-mobile')).display!=='none'",
);
click("Fund demo mission");
click("Submit 3 demo results");
click("Submission A", false);
click("Select A & settle in demo");
check(
  "Arena remains functional through GPU loss",
  "document.querySelector('.mission-mobile').innerText.includes('verified + settled atomically')",
);
run("screenshot", "--full", resolve(out, "arena-context-loss.png"));
open("/app");
run("focus", ".flat-node[data-node-id=scraper]");
run("press", "Space");
check(
  "Keyboard Space selects Scraper and updates full inspector path",
  "document.querySelector('[aria-label=\"Mandate inspector\"]').innerText.includes('Scraper') && document.querySelector('.path-breadcrumb').innerText.includes('Treasury → Research → Data → Scraper')",
);
writeFileSync(resolve(out, "results.json"), JSON.stringify(results, null, 2));
