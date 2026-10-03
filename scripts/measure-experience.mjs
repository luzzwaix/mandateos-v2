import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Production frame sampling without screenshots or the browser video stream.
// Bootstrap the chosen agent-browser session before invoking this helper.
const executable = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-polish";
const url = process.argv[2] ?? "http://127.0.0.1:3000";
const evidence = process.env.QA_EVIDENCE_ROOT ?? "artifacts/surgical-polish";
const output = resolve(evidence, "performance.json");
const run = (...args) => {
  const result = spawnSync(executable, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
  });
  if (result.status !== 0 || result.error)
    throw new Error(result.error?.message ?? result.stdout + result.stderr);
  return result.stdout;
};
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
const measurements = [];
for (const [label, width, height, animate] of [
  ["desktop idle", 1440, 900, false],
  ["desktop construction, trace, preview, cascade", 1440, 900, true],
  ["mobile idle", 390, 844, false],
  ["mobile flat construction, trace, preview, cascade", 390, 844, true],
]) {
  run("open", url);
  run("set", "viewport", String(width), String(height));
  if (JSON.parse(run("--json", "stream", "status")).data.enabled)
    run("stream", "disable");
  run("wait", "500");
  evaluate(`(() => {
    const intervals=[],longTasks=[],shifts=[];
    const longObserver=new PerformanceObserver(l=>longTasks.push(...l.getEntries().map(e=>({duration:e.duration,start:e.startTime}))));
    const shiftObserver=new PerformanceObserver(l=>shifts.push(...l.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value)));
    longObserver.observe({type:'longtask'});shiftObserver.observe({type:'layout-shift'});
    let previous,frame,finished=false;
    function tick(now){if(finished)return;if(previous!==undefined)intervals.push(now-previous);previous=now;frame=requestAnimationFrame(tick);}
    frame=requestAnimationFrame(tick);
    window.finishFrameSample=()=>{
      finished=true;cancelAnimationFrame(frame);longObserver.disconnect();shiftObserver.disconnect();
      const sorted=intervals.toSorted((a,b)=>a-b);
      return {samples:sorted.length,p95:sorted[Math.floor(sorted.length*.95)],median:sorted[Math.floor(sorted.length*.5)],max:Math.max(...sorted),framesOver22ms:sorted.filter(t=>t>22).length,longTasks,cls:shifts.reduce((a,b)=>a+b,0),finalChapter:document.querySelector('.persistent-story').dataset.chapter,finalNodeCount:document.querySelectorAll('.mandate-plate').length,localRevoked:document.querySelectorAll('.mandate-plate.revoked').length,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency};
    };
    return true;
  })()`);
  // Actual pointer input preserves the browser's hadRecentInput classification.
  // Synthetic element.click() incorrectly counts deliberate chapter changes as CLS.
  if (animate) {
    const click = (name) =>
      run("find", "role", "button", "click", "--name", name, "--exact");
    click("Delegate authority");
    run("wait", "660");
    click("02 Recursion");
    click("Build demo hierarchy");
    run("wait", "3100");
    click("03 Trace");
    click("Trace Scraper");
    run("wait", "300");
    click("04 Blast Radius");
    click("Preview Research revoke");
    run("wait", "400");
    click("Confirm demo revoke");
    run("wait", "600");
  } else run("wait", "2400");
  const result = evaluate("finishFrameSample()");
  if (animate && (result.finalNodeCount !== 6 || result.localRevoked !== 1))
    throw new Error(`Incomplete measured flow: ${label}`);
  measurements.push({ label, viewport: { width, height }, ...result });
  console.log(
    `${label}: p95 ${result.p95.toFixed(2)}ms / CLS ${result.cls.toFixed(4)}`,
  );
}
mkdirSync(resolve(evidence), { recursive: true });
writeFileSync(output, JSON.stringify(measurements, null, 2));
run("close");
