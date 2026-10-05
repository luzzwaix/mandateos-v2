import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const bin = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-rebuild";
const base = process.argv[2] ?? "http://127.0.0.1:3000";
const rows = [];
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
const ev = (code) => JSON.parse(run("--json", "eval", code)).data.result;
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
  wait(1800);
  run("snapshot", "-i");
};
if (JSON.parse(run("--json", "stream", "status")).data.enabled)
  run("stream", "disable");
run("set", "media", "no-preference");
run("set", "viewport", "1920", "1080");
function sample(name, action, duration) {
  ev(`(()=>{
    const intervals=[],tasks=[];let last,request,started=false,finished=false;
    const root=document.querySelector('.spatial-loom'),profile=window.__loomProfile;
    const initialPrograms=profile?.programs,cpuStart=profile?.cpu.length??0,gpuStart=profile?.gpu.length??0;
    const observer=new PerformanceObserver(l=>tasks.push(...l.getEntries().map(e=>({duration:e.duration,start:e.startTime}))));observer.observe({type:'longtask'});
    function tick(now){const active=root?.dataset.director==='running';if(active){if(started&&last!==undefined)intervals.push(now-last);started=true;last=now;}else{last=undefined;}if(!finished)request=requestAnimationFrame(tick);}request=requestAnimationFrame(tick);
    window.__endInstrumentSample=()=>{finished=true;cancelAnimationFrame(request);observer.disconnect();
      const stat=a=>{if(!a.length)return null;const b=a.toSorted((x,y)=>x-y);return{samples:b.length,p50:b[Math.floor(b.length*.5)],p95:b[Math.floor(b.length*.95)],max:b.at(-1),missed60HzSlots:b.reduce((n,t)=>n+Math.max(0,Math.round(t/(1000/60))-1),0)};};
      return {rafFrameIntervalMs:stat(intervals),cpuRenderSubmissionMs:stat(profile?.cpu.slice(cpuStart)??[]),gpuElapsedMs:stat(profile?.gpu.slice(gpuStart)??[]),longTasks:tasks,
        shaderProgramsBefore:initialPrograms,shaderProgramsAfter:profile?.programs,drawCalls:profile?.calls,triangles:profile?.triangles,
        actualDpr:document.querySelector('canvas')?.width/document.querySelector('canvas')?.getBoundingClientRect().width,
        gpuTimerAvailable:profile?.gpuAvailable,idleStopped:root?.dataset.director==='idle'};
    };return true;
  })()`);
  action();
  wait(duration);
  const data = ev("__endInstrumentSample()");
  rows.push({ name, width: 1920, height: 1080, ...data });
  console.log(
    name +
      ": RAF p95=" +
      data.rafFrameIntervalMs?.p95 +
      "ms, CPU p95=" +
      data.cpuRenderSubmissionMs?.p95 +
      "ms, programs=" +
      data.shaderProgramsBefore +
      "→" +
      data.shaderProgramsAfter,
  );
}
open("/?profile=1");
const device = ev(
  `(()=>{const g=document.querySelector('canvas').getContext('webgl2'),d=g.getExtension('WEBGL_debug_renderer_info');return{gpu:d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):'unavailable',userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,startupCompilationMs:window.__loomProfile?.startupMs,navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd})),paint:performance.getEntriesByType('paint').map(p=>({name:p.name,ms:p.startTime}))};})()`,
);
const displayCadence = ev(`new Promise(resolve=>{const samples=[];let last;function frame(now){if(last!==undefined)samples.push(now-last);last=now;if(samples.length<90)requestAnimationFrame(frame);else{samples.sort((a,b)=>a-b);resolve({samples:samples.length,p50:samples[45],p95:samples[85],max:samples.at(-1),scope:'display rAF while the demand-rendered canvas is idle'});}}requestAnimationFrame(frame);})`);
sample("Genesis / first delegate", () => click("Delegate Research"), 1100);
sample("Recursion / four grants", () => click("Build demo hierarchy"), 2400);
click("Trace");
wait(250);
sample("Complete Scraper trace", () => click("Trace Scraper"), 850);
click("Blast Radius");
wait(250);
sample("Copper impact preview", () => click("Preview Research revoke"), 750);
sample("Confirmed depth cascade", () => click("Confirm demo revoke"), 1350);
sample("Story to flat Command plane", () => click("Plane Change"), 1100);
open("/arena?profile=1");
const arenaStartup = ev("window.__loomProfile?.startupMs");
sample("Capital ingress", () => click("Fund demo mission"), 1100);
sample("Submission approach", () => click("Submit 3 demo results"), 1100);
sample("Unpaid verifier preview", () => click("Submission A", false), 1100);
sample(
  "Atomic demo settlement",
  () => click("Select A & settle in demo"),
  1100,
);
ev(
  `window.__idleStart=document.querySelector('.spatial-loom').dataset.renderFrames;true`,
);
wait(1200);
const idleStopped = ev(
  "window.__idleStart===document.querySelector('.spatial-loom').dataset.renderFrames",
);
run("set", "viewport", "390", "844");
open("/");
const mobileStart = ev(`performance.now()`);
click("Delegate Research");
click("Build demo hierarchy");
click("Trace");
click("Trace Scraper");
click("Blast Radius");
click("Preview Research revoke");
click("Confirm demo revoke");
const mobile = ev(
  `({viewport:{width:innerWidth,height:innerHeight},canvas:!!document.querySelector('canvas'),blocked:document.querySelectorAll('.flat-ledger-node.blocked').length,operationsActive:document.querySelector('[data-mobile-node=operations]').classList.contains('active'),noOverflow:document.documentElement.scrollWidth<=innerWidth,mode:'immediate native state, no animated frame budget'})`,
);
mkdirSync(resolve("artifacts/high-end"), { recursive: true });
writeFileSync(
  resolve("artifacts/high-end/rebuild-performance.json"),
  JSON.stringify(
    {
      device,
      idleDisplayCadenceMs:displayCadence,
      arenaStartupCompilationMs: arenaStartup,
      idleStopped,
      rows,
      mobile,
      mobileAutomationElapsedMs: ev("performance.now()") - mobileStart,
    },
    null,
    2,
  ),
);
