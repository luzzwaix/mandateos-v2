import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const bin = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-high-end";
const pass = process.argv[2] ?? "pass1",
  base = process.argv[3] ?? "http://127.0.0.1:3000";
const out = resolve("artifacts/high-end", pass);
mkdirSync(out, { recursive: true });
const results = [];
function run(...args) {
  const r = spawnSync(bin, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
    windowsHide: true,
  });
  if (r.status !== 0 || r.error)
    throw Error(
      args.join(" ") + ": " + (r.error?.message ?? r.stdout + r.stderr),
    );
  return r.stdout;
}
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
const wait = (ms) => run("wait", String(ms));
const open = (path) => {
  run("open", base + path);
  run("snapshot", "-i");
  wait(1600);
};
const click = (name) => {
  run("find", "role", "button", "click", "--name", name, "--exact");
  run("snapshot", "-i");
};
const shot = (name) => {
  if (evaluate("location.pathname==='/arena'"))
    evaluate("window.scrollTo(0,0);true");
  run(
    "screenshot",
    ...(evaluate(
      "innerWidth<1100 || matchMedia('(prefers-reduced-motion: reduce)').matches",
    )
      ? ["--full"]
      : []),
    resolve(out, name + ".png"),
  );
  console.log("Captured " + name);
};
function check(name, code) {
  const result = evaluate(code);
  results.push({ name, result });
  console.log((result ? "PASS " : "FAIL ") + name);
  if (pass.endsWith("pass2")) assert.equal(result, true, name);
}
function recording(name, action) {
  let status = JSON.parse(run("--json", "stream", "status")).data;
  if (!status.enabled) {
    run("stream", "enable");
    status = JSON.parse(run("--json", "stream", "status")).data;
  }
  const capture = resolve(out, name + "-frames-" + Date.now());
  const child = spawn(
    process.execPath,
    [
      resolve("scripts/record-browser-stream.mjs"),
      String(status.port),
      capture,
    ],
    { stdio: "ignore", windowsHide: true },
  );
  wait(250);
  try {
    action();
  } finally {
    mkdirSync(capture, { recursive: true });
    writeFileSync(resolve(capture, "stop"), "");
    for (
      let i = 0;
      i < 30 && !existsSync(resolve(capture, "recording.json"));
      i++
    )
      wait(200);
    if (!existsSync(resolve(capture, "recording.json"))) {
      child.kill();
      throw Error("Recording did not finish");
    }
    results.push({
      name,
      recording: JSON.parse(
        readFileSync(resolve(capture, "recording.json"), "utf8"),
      ),
    });
  }
}
run("set", "viewport", "1440", "900");
run("set", "media", "no-preference");
open("/");
recording("story", () => {
  shot("01-arrival");
  check(
    "Root alone uses readable DOM and a spatial canvas",
    "document.querySelectorAll('.loom-label').length===1 && !!document.querySelector('.authority-loom[data-webgl=ready] canvas')",
  );
  evaluate(
    "window.__root=document.querySelector('[data-loom-label=treasury]');window.__world=document.querySelector('[data-testid=persistent-authority-world]');true",
  );
  click("Try demo");
  wait(1300);
  click("Build demo hierarchy");
  wait(2200);
  click("Recursion");
  wait(800);
  shot("02-organization");
  check(
    "World and Root DOM persist throughout construction",
    "window.__root===document.querySelector('[data-loom-label=treasury]') && window.__world===document.querySelector('[data-testid=persistent-authority-world]') && document.querySelectorAll('.loom-label').length===6",
  );
  check(
    "Six projected labels stay inside viewport",
    "[...document.querySelectorAll('.loom-label')].every(n=>{let r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=84&&r.bottom<innerHeight})",
  );
  click("Trace");
  click("Trace Scraper");
  wait(1000);
  shot("trace");
  check(
    "Trace resolves complete ancestry",
    "document.querySelector('.story-instrument').innerText.includes('Treasury → Research → Data → Scraper')",
  );
  click("Blast Radius");
  click("Preview Research revoke");
  wait(1100);
  shot("03-blast-preview");
  check(
    "Preview does not change any authority status",
    "document.querySelectorAll('.loom-label.active').length===6 && document.querySelector('.story-instrument').innerText.includes('would be blocked')",
  );
  evaluate(
    "window.__ops=JSON.stringify(document.querySelector('[data-loom-label=operations]').getBoundingClientRect().toJSON())",
  );
  click("Confirm demo revoke");
  wait(1600);
  shot("04-cascade");
  check(
    "One local revoke, three blocked, Operations remains active",
    "document.querySelectorAll('.loom-label.revoked').length===1 && document.querySelectorAll('.loom-label.blocked').length===3 && document.querySelector('[data-loom-label=operations]').classList.contains('active')",
  );
  check(
    "Operations stays geometrically stationary",
    "window.__ops===JSON.stringify(document.querySelector('[data-loom-label=operations]').getBoundingClientRect().toJSON())",
  );
  check(
    "Authority cut distinguishes token recovery",
    "document.querySelector('.story-instrument').innerText.includes('No token transfer shown')",
  );
  click("Attempt Scraper spend");
  check(
    "Blocked demo spend cannot fabricate a transaction",
    "document.querySelector('.story-instrument').innerText.includes('EXECUTION REJECTED / SIMULATED')",
  );
  click("Plane Change");
  wait(900);
  shot("05-plane-change");
  click("Open Command");
  wait(1600);
  shot("command-blocked");
  check(
    "Command receives Scraper selection and blocked state",
    "location.pathname==='/app' && document.querySelector('[data-testid=node-scraper]').getAttribute('aria-pressed')==='true' && document.querySelector('[aria-label=\"Mandate inspector\"]').innerText.includes('BLOCKED')",
  );
});
click("Reset demo");
wait(500);
shot("06-command-active");
check(
  "Command is flat with six nodes above evidence",
  "!document.querySelector('canvas') && document.querySelectorAll('.flat-node').length===6 && document.querySelector('[data-testid=node-scraper]').getBoundingClientRect().bottom < document.querySelector('.evidence-dock').getBoundingClientRect().top",
);
click("Select Scraper");
click("Authority Trace");
check(
  "Operational trace contains all four ancestors",
  "document.querySelector('[aria-label=\"Mandate inspector\"]').innerText.includes('Treasury') && document.querySelectorAll('[aria-label=\"Complete authority path\"] li').length===4",
);
click("Select Research");
click("Preview revoke");
click("Review revoke");
click("Cancel preview");
check(
  "Cancel restores focus",
  "document.activeElement.textContent.includes('Preview revoke')",
);
open("/arena");
recording("arena", () => {
  click("Fund demo mission");
  wait(1000);
  shot("arena-funded");
  click("Submit 3 demo results");
  wait(850);
  run("eval", "document.querySelector('[data-arena-label=lane-0]').click()");
  run("snapshot", "-i");
  wait(700);
  shot("arena-preview");
  check(
    "Verifier preview is explicitly unpaid",
    "document.querySelector('.mission-stage').classList.contains('verifier-preview') && document.querySelector('.contender[aria-pressed=true]').innerText.includes('UNPAID')",
  );
  click("Select A & settle in demo");
  wait(1500);
  shot("07-arena-settlement");
  check(
    "Arena records one simulated atomic payout for selected A",
    "document.querySelector('.mission-stage').classList.contains('settled') && document.querySelector('.mission-outcome').innerText.includes('Submission A') && document.querySelector('.arena-instrument').innerText.includes('no onchain transaction')",
  );
});
for (const [route, selector] of [
  ["/", ".authority-loom"],
  ["/arena", ".arena-loom"],
]) {
  open(route);
  wait(1600);
  evaluate(
    `window.__frames=document.querySelector('${selector}').dataset.renderFrames`,
  );
  wait(1100);
  check(
    route + " stops rendering at idle",
    `document.querySelector('${selector}').dataset.renderFrames===window.__frames && document.querySelector('${selector}').dataset.director==='idle'`,
  );
}
for (const width of [1280, 768, 390]) {
  run(
    "set",
    "viewport",
    String(width),
    width === 1280 ? "800" : width === 390 ? "844" : "900",
  );
  for (const [route, name] of [
    ["/", "story"],
    ["/app", "command"],
    ["/arena", "arena"],
  ]) {
    open(route);
    shot(width + "-" + name);
    check(
      width + " " + name + " has no horizontal overflow",
      "document.documentElement.scrollWidth<=innerWidth",
    );
  }
}
run("set", "viewport", "1440", "900");
run("set", "media", "reduced-motion");
open("/");
click("Try demo");
click("Build demo hierarchy");
click("Blast Radius");
click("Preview Research revoke");
shot("reduced-motion-preview");
check(
  "Reduced motion preserves final authority state without WebGL",
  "!document.querySelector('canvas') && document.querySelectorAll('.flat-node').length===6 && document.querySelector('.story-instrument').innerText.includes('All mandates still active')",
);
click("Confirm demo revoke");
shot("reduced-motion-cascade");
check(
  "Reduced motion shows exact blocked descendants immediately",
  "document.querySelectorAll('.flat-node.blocked').length===3",
);
open("/arena");
click("Fund demo mission");
click("Submit 3 demo results");
run("find", "role", "button", "click", "--name", "Submission A");
run("snapshot", "-i");
click("Select A & settle in demo");
shot("reduced-motion-arena");
check(
  "Reduced motion has readable Arena settlement",
  "!document.querySelector('canvas') && document.querySelector('.mission-mobile').innerText.includes('verified + settled atomically')",
);
open("/app");
run("select", "select[aria-label='Product mode']", "devnet");
wait(2000);
shot("devnet-unverified");
check(
  "Devnet never replaces missing accounts with demo balances",
  "!document.querySelector('.flat-node') && document.querySelector('.unconnected-world').innerText.includes('No balances or authority assumed')",
);
click("Wallet");
shot("wallet");
run("press", "Escape");
check(
  "Wallet menu restores keyboard focus",
  "document.activeElement.getAttribute('aria-label')==='Wallet'",
);
run("select", "select[aria-label='Product mode']", "demo");
run("set", "media", "no-preference");
writeFileSync(
  resolve(out, "results.json"),
  JSON.stringify(
    {
      pass,
      browser: evaluate("navigator.userAgent"),
      viewport: "1440x900 + 1280x800 + 768x900 + 390x900",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results.filter((r) => r.result === false)));
