import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Sample the real production browser without screenshot/video-stream overhead.
const executable = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-high-end";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const run = (...args) => {
  const result = spawnSync(executable, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
    windowsHide: true,
  });
  if (result.status !== 0 || result.error)
    throw new Error(result.error?.message ?? result.stdout + result.stderr);
  return result.stdout;
};
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
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
const wait = (ms) => run("wait", String(ms));
if (JSON.parse(run("--json", "stream", "status")).data.enabled)
  run("stream", "disable");
run("set", "media", "no-preference");
const measurements = [];
for (const [name, route, width, flow] of [
  ["Story desktop idle", "/", 1440, "idle"],
  ["Story desktop causal sequence", "/", 1440, "story"],
  ["Arena desktop lifecycle", "/arena", 1440, "arena"],
  ["Story mobile causal sequence", "/", 390, "story"],
]) {
  run("set", "viewport", String(width), "900");
  run("open", base + route);
  wait(2200);
  evaluate(`(() => {
    const intervals=[],longTasks=[],shifts=[];
    const lo=new PerformanceObserver(l=>longTasks.push(...l.getEntries().map(e=>({duration:e.duration,start:e.startTime}))));
    const so=new PerformanceObserver(l=>shifts.push(...l.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value)));
    lo.observe({type:'longtask'});so.observe({type:'layout-shift'});
    let previous,frame,done=false;
    function tick(now){if(done)return;if(previous!==undefined)intervals.push(now-previous);previous=now;frame=requestAnimationFrame(tick);}
    frame=requestAnimationFrame(tick);
    window.__finishSample=()=>{done=true;cancelAnimationFrame(frame);lo.disconnect();so.disconnect();
      const s=intervals.toSorted((a,b)=>a-b),root=document.querySelector('.spatial-loom');
      const canvas=document.querySelector('canvas'),gl=canvas?.getContext('webgl2'),debug=gl?.getExtension('WEBGL_debug_renderer_info');
      return {samples:s.length,medianMs:s[Math.floor(s.length*.5)],p95Ms:s[Math.floor(s.length*.95)],maxMs:Math.max(...s),framesOver22ms:s.filter(t=>t>22).length,longTasks,cls:shifts.reduce((a,b)=>a+b,0),director:root?.dataset.director??'native fallback',canvas:!!canvas,renderScale:canvas?canvas.width/canvas.getBoundingClientRect().width:null,gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency};};return true;
  })()`);
  if (flow === "story") {
    click("Delegate Research");
    wait(1350);
    click("Build demo hierarchy");
    wait(width < 1100 ? 200 : 2200);
    click("Trace");
    click("Trace Scraper");
    wait(900);
    click("Blast Radius");
    click("Preview Research revoke");
    wait(1100);
    click("Confirm demo revoke");
    wait(1600);
  } else if (flow === "arena") {
    click("Fund demo mission");
    wait(1050);
    click("Submit 3 demo results");
    wait(950);
    click("Submission A", false);
    wait(950);
    click("Select A & settle in demo");
    wait(1500);
  } else wait(2400);
  const data = evaluate("__finishSample()");
  evaluate(
    "window.__idleFrames=document.querySelector('.spatial-loom')?.dataset.renderFrames;true",
  );
  wait(1200);
  const idleStopped = evaluate(
    "document.querySelector('.spatial-loom')?.dataset.renderFrames===window.__idleFrames",
  );
  measurements.push({
    name,
    viewport: { width, height: 900 },
    idleStopped,
    ...data,
  });
  console.log(
    `${name}: p95=${data.p95Ms.toFixed(2)}ms, CLS=${data.cls.toFixed(4)}, long tasks=${data.longTasks.length}, idle stopped=${idleStopped}`,
  );
}
mkdirSync(resolve("artifacts/high-end"), { recursive: true });
writeFileSync(
  resolve("artifacts/high-end/performance.json"),
  JSON.stringify(measurements, null, 2),
);
