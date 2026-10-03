import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Optional browser QA tool, intentionally outside the app's dependency graph.
// AGENT_BROWSER_BIN points to the installed agent-browser executable.
const executable = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const pass = process.argv[2] ?? "pass1";
const url = process.argv[3] ?? "http://127.0.0.1:3001";
const output = resolve(
  process.env.QA_EVIDENCE_ROOT ?? "artifacts/surgical-polish",
  pass,
);
mkdirSync(output, { recursive: true });
const findings = [];
function run(...args) {
  const result = spawnSync(
    executable,
    ["--session", process.env.QA_BROWSER_SESSION ?? "mandate-polish", ...args],
    { encoding: "utf8", timeout: 45000 },
  );
  if (result.status !== 0 || result.error)
    throw new Error(
      `${args.join(" ")}: ${result.error?.message ?? result.stdout + result.stderr}`,
    );
  return result.stdout;
}
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
const click = (name) => {
  run("find", "role", "button", "click", "--name", name, "--exact");
  run("snapshot", "-i");
};
const link = (name) => {
  run("find", "role", "link", "click", "--name", name, "--exact");
  run("snapshot", "-i");
};
const wait = (ms) => run("wait", String(ms));
const shot = (name) => {
  const path = resolve(output, `${name}.png`);
  if (evaluate("innerWidth<768")) {
    // Full-document capture at scroll zero keeps the sticky header in its real
    // opening position rather than embedding it halfway through the PNG.
    run("scroll", "up", "10000");
    wait(100);
    run("screenshot", "--full", path);
  } else run("screenshot", path);
  console.log(`Captured ${pass}/${name}`);
};
const check = (name, code) => {
  const result = evaluate(code);
  findings.push({ name, result });
  if (pass === "pass1" && result !== true)
    console.log(`PASS 1 defect: ${name}`);
  else assert.equal(result, true, name);
};
function record(name, action) {
  let info = JSON.parse(run("--json", "stream", "status")).data;
  if (!info.enabled) {
    run("stream", "enable");
    info = JSON.parse(run("--json", "stream", "status")).data;
  }
  const capture = resolve(output, `${name}-frames-${Date.now()}`);
  const child = spawn(
    process.execPath,
    [resolve("scripts/record-browser-stream.mjs"), String(info.port), capture],
    { windowsHide: true, stdio: "ignore" },
  );
  wait(200);
  try {
    action();
  } finally {
    mkdirSync(capture, { recursive: true });
    writeFileSync(resolve(capture, "stop"), "");
    for (
      let n = 0;
      n < 30 && !existsSync(resolve(capture, "recording.json"));
      n++
    )
      wait(200);
    if (!existsSync(resolve(capture, "recording.json"))) {
      child.kill();
      throw new Error("Recording did not finish");
    }
    const result = JSON.parse(
      readFileSync(resolve(capture, "recording.json"), "utf8"),
    );
    if (result.exitCode !== 0)
      throw new Error(`Recording failed: ${result.error}`);
    findings.push({ name: `${name} recording`, result: true, ...result });
    console.log(`Recorded ${name}: ${result.frames} real browser frames`);
  }
}
function overflow(name) {
  check(
    `${name} no horizontal page overflow`,
    "document.documentElement.scrollWidth <= innerWidth",
  );
}
function instrument() {
  evaluate(`(() => {
    window.qaFrames=[]; window.qaLongTasks=[]; window.qaShifts=[]; window.qaRunning=true;
    new PerformanceObserver(list => window.qaLongTasks.push(...list.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});
    new PerformanceObserver(list => window.qaShifts.push(...list.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift',buffered:true});
    let previous=performance.now(); const tick=now=>{if(!window.qaRunning)return; window.qaFrames.push(now-previous); previous=now;requestAnimationFrame(tick);};requestAnimationFrame(tick);
    return true;
  })()`);
}
run("open", url);
run("set", "viewport", "1440", "900");
wait(300);
run("snapshot", "-i");
shot("genesis");
overflow("desktop Story");
evaluate(
  "window.qaWorld=document.querySelector('[data-testid=persistent-authority-world]'); window.qaRoot=document.querySelector('[data-testid=node-treasury]'); true",
);
if (process.env.QA_CAPTURE_TRACE === "1") run("trace", "start");
instrument();
record("story", () => {
  wait(3000);
  click("Delegate authority");
  wait(660);
  shot("delegate");
  click("02 Recursion");
  click("Build demo hierarchy");
  wait(3100);
  shot("recursion");
  wait(1800);
  check(
    "same Root node survived construction",
    "window.qaRoot===document.querySelector('[data-testid=node-treasury]')",
  );
  check(
    "all six nodes present",
    "document.querySelectorAll('.authority-map .mandate-plate').length===6",
  );
  click("03 Trace");
  click("Trace Scraper");
  wait(300);
  shot("trace");
  wait(1600);
  check(
    "complete Scraper ancestry",
    "[...document.querySelectorAll('.story-instrument .authority-trace li strong')].map(e=>e.textContent).join(',')==='Treasury,Research,Data,Scraper'",
  );
  click("04 Blast Radius");
  click("Preview Research revoke");
  wait(400);
  shot("blast");
  wait(1600);
  check(
    "preview never blocks authority",
    "document.querySelectorAll('.authority-map .mandate-plate.active').length===6",
  );
  evaluate(
    "window.qaOperations=document.querySelector('[data-testid=node-operations]'); window.qaOperationGeometry=JSON.stringify(window.qaOperations.getBoundingClientRect().toJSON()); true",
  );
  click("Confirm demo revoke");
  wait(650);
  shot("cascade");
  wait(1600);
  check(
    "Operations DOM and geometry unchanged",
    "window.qaOperations===document.querySelector('[data-testid=node-operations]') && window.qaOperationGeometry===JSON.stringify(window.qaOperations.getBoundingClientRect().toJSON()) && window.qaOperations.classList.contains('active')",
  );
  check(
    "one local revoke, three blocked descendants",
    "document.querySelectorAll('.authority-map .mandate-plate.revoked').length===1 && document.querySelectorAll('.authority-map .mandate-plate.blocked').length===3",
  );
  click("Attempt Scraper spend");
  shot("blocked-proof");
  check(
    "explicit simulated execution evidence",
    "document.querySelector('.story-instrument').textContent.includes('EXECUTION REJECTED / SIMULATED')",
  );
  click("02 Recursion");
  check(
    "back preserves revoke",
    "document.querySelector('[data-testid=node-research]').classList.contains('revoked')",
  );
  click("06 Plane Change");
  shot("plane");
  check(
    "one persistent Story object survived all chapters",
    "window.qaWorld===document.querySelector('[data-testid=persistent-authority-world]')",
  );
  evaluate(`window.qaFlatGeometry=null;
    const sample=()=>{const field=document.querySelector('.authority-surface');
      if(field?.dataset.flatten==='1')window.qaFlatGeometry=[...document.querySelectorAll('.mandate-plate')].map(e=>({id:e.dataset.testid,rect:e.getBoundingClientRect().toJSON()}));
      if(document.querySelector('.persistent-story'))requestAnimationFrame(sample);};requestAnimationFrame(sample);true`);
  click("Open Command");
  wait(700);
  shot("command");
});
const perf = evaluate(
  "window.qaRunning=false; ({samples:qaFrames.length,p95:qaFrames.sort((a,b)=>a-b)[Math.floor(qaFrames.length*.95)],max:Math.max(...qaFrames),longTasks:qaLongTasks,cls:qaShifts.reduce((a,b)=>a+b,0),userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency})",
);
findings.push({ name: "desktop observed frame intervals", perf });
check(
  "flatten endpoints match mounted Command labels",
  "window.qaFlatGeometry?.length===6 && window.qaFlatGeometry.every(p=>{const e=document.querySelector('[data-testid=\"'+p.id+'\"]');const r=e?.getBoundingClientRect();return r && Math.abs(r.x-p.rect.x)<1 && Math.abs(r.y-p.rect.y)<1 && Math.abs(r.width-p.rect.width)<1 && Math.abs(r.height-p.rect.height)<1})",
);
if (process.env.QA_CAPTURE_TRACE === "1")
  run("trace", "stop", resolve(output, "story-handoff.trace.json"));
check(
  "Story simulation not copied into Command",
  "document.querySelectorAll('.authority-map .mandate-plate.active').length===6",
);
check(
  "Scraper completely above evidence",
  "document.querySelector('[data-testid=node-scraper]').getBoundingClientRect().bottom < document.querySelector('.evidence-dock').getBoundingClientRect().top",
);
click("Authority Trace");
run("click", "[data-testid=node-scraper]");
run("snapshot", "-i");
shot("command-trace");
run("click", "[data-testid=node-research]");
run("snapshot", "-i");
click("Preview revoke");
shot("command-blast");
record("command-cut", () => {
  click("Review revoke");
  click("Confirm demo revoke");
  wait(650);
  shot("command-cascade");
  click("Attempt demo spend");
  shot("command-proof");
});
click("Reset demo");
link("Arena");
shot("arena-unfunded");
check(
  "unfunded has no departing payout arrow",
  "!document.querySelector('.settlement-channel')",
);
record("arena", () => {
  click("Fund demo mission");
  wait(450);
  shot("arena-funded");
  click("Submit 3 demo results");
  wait(260);
  shot("arena-submissions");
  run("click", ".contender:nth-child(1)");
  run("snapshot", "-i");
  shot("arena-preview");
  check(
    "verifier preview is unpaid",
    "!document.querySelector('.settlement-channel') && document.querySelector('.verifier-preview')!==null",
  );
  click("Select A & settle in demo");
  wait(850);
  shot("arena-settled");
  check(
    "one atomic receipt after settlement",
    "document.querySelector('.mission-outcome').textContent.includes('Verified + settled in one operation')",
  );
});
click("Reset demo");
link("Command");
run("click", "[data-testid=node-treasury]");
run("snapshot", "-i");
click("Spend");
run("fill", "[aria-label='Action amount']", "999");
click("Simulate spend");
link("Arena");
click("Fund demo mission");
shot("arena-error");
check(
  "failed funding preserves unresolved field",
  "document.querySelector('.arena-instrument .error-text')!==null && !document.querySelector('.settlement-channel') && document.querySelector('.mission-stage.ready')!==null",
);
click("Reset demo");
run("open", url);
run("snapshot", "-i");
run("scroll", "down", "650");
wait(500);
run("snapshot", "-i");
check(
  "native scroll changes chapter without constructing authority",
  "document.querySelector('.persistent-story').dataset.chapter==='recursion' && document.querySelectorAll('.authority-map .mandate-plate').length===1",
);
click("Build demo hierarchy");
wait(100);
click("Reset");
wait(2400);
check(
  "non-reduced reset invalidates outstanding construction callbacks",
  "document.querySelectorAll('.authority-map .mandate-plate').length===1",
);
for (const width of [320, 390, 768, 1024]) {
  run("set", "viewport", String(width), "844");
  for (const [route, name] of [
    ["/", "story"],
    ["/app", "command"],
    ["/arena", "arena"],
  ]) {
    run("open", url + route);
    run("snapshot", "-i");
    overflow(`${width}px ${name}`);
    shot(`${name}-${width}`);
  }
}
run("set", "viewport", "390", "844");
run("set", "media", "reduced-motion");
run("open", url);
run("snapshot", "-i");
record("mobile-reduced", () => {
  click("02 Recursion");
  click("Build demo hierarchy");
  click("03 Trace");
  click("Trace Scraper");
  check(
    "mobile ledger follows real parentage",
    "[...document.querySelectorAll('.mobile-mandates .ledger-identity strong')].map(e=>e.textContent).join(',')==='Treasury,Research,Data,Scraper,Analysis,Operations'",
  );
  shot("reduced-trace");
  click("04 Blast Radius");
  click("Preview Research revoke");
  shot("reduced-blast");
  click("Confirm demo revoke");
  click("Attempt Scraper spend");
  shot("reduced-cascade");
});
check(
  "reduced motion has flat persistent field",
  "getComputedStyle(document.querySelector('.story-object > .authority-surface')).transform==='none'",
);
click("Reset");
click("02 Recursion");
click("Build demo hierarchy");
click("Reset");
wait(2400);
check(
  "reset cancels pending construction",
  "document.querySelectorAll('.mobile-mandates .mandate-row').length===1",
);
link("Arena");
record("mobile-arena-reduced", () => {
  click("Fund demo mission");
  click("Submit 3 demo results");
  check(
    "mobile submissions do not imply a verified winner",
    "document.querySelectorAll('.mission-mobile .winner').length===0",
  );
  shot("mobile-arena-submissions");
  run("click", ".mission-mobile > button:nth-of-type(1)");
  run("snapshot", "-i");
  shot("mobile-arena-preview");
  check(
    "mobile verifier preview is unpaid",
    "document.querySelector('.mission-mobile').textContent.includes('PREVIEW · UNPAID') && document.querySelectorAll('.mission-mobile .winner').length===0",
  );
  click("Select A & settle in demo");
  shot("mobile-arena-settled");
  check(
    "mobile verification and payout resolve atomically",
    "document.querySelectorAll('.mission-mobile .winner').length===1 && document.querySelector('.mission-mobile').textContent.includes('verified + settled atomically')",
  );
});
run("set", "media", "no-preference");
run("set", "viewport", "1440", "900");
run("open", url + "/app");
run("snapshot", "-i");
click("Preview revoke");
run("press", "Escape");
run("snapshot", "-i");
check(
  "Escape closes impact and restores keyboard focus",
  "!document.querySelector('.impact-instrument') && document.activeElement.textContent.includes('Preview revoke')",
);
run("press", "Shift+Tab");
check(
  "keyboard selection has visible focus",
  "document.activeElement!==document.body && document.activeElement.matches(':focus-visible') && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2",
);
run("set", "viewport", "720", "450");
overflow("200% desktop zoom equivalent CSS viewport");
shot("command-zoom-200");
run("set", "viewport", "1440", "900");
run("select", "[aria-label='Product mode']", "devnet");
run("snapshot", "-i");
shot("devnet-gate");
check(
  "Devnet has no invented balances",
  "document.querySelector('.empty-root')!==null && document.querySelectorAll('.mandate-plate').length===0",
);
link("Story");
click("06 Plane Change");
click("Open Command");
wait(700);
run("snapshot", "-i");
check(
  "plane handoff preserves the user's Devnet mode",
  "document.querySelector('[aria-label=\"Product mode\"]').value==='devnet' && document.querySelector('.empty-root')!==null",
);
shot("devnet-handoff");
click("Wallet");
shot("wallet-gate");
run("press", "Escape");
check(
  "wallet menu returns focus without fabricating connection",
  "!document.querySelector('.wallet-popover') && document.activeElement.getAttribute('aria-label')==='Wallet'",
);
findings.push({ name: "browser errors", result: run("errors") });
findings.push({ name: "browser console", result: run("console") });
writeFileSync(
  resolve(output, "results.json"),
  JSON.stringify(findings, null, 2),
);
run("close");
console.log(
  `Verified ${findings.filter((f) => f.result === true).length} browser assertions. Evidence: ${output}`,
);
