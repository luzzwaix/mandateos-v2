import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Bounded browser observations, independent of the app's renderer or state.
const executable = process.env.AGENT_BROWSER_BIN ?? "agent-browser";
const session = process.env.QA_BROWSER_SESSION ?? "mandate-spatial-detail";
const url = process.argv[2] ?? "http://127.0.0.1:3000";
const output = resolve(
  process.env.QA_EVIDENCE_ROOT ?? "artifacts/spatial-director",
);
const findings = [];
function run(...args) {
  const result = spawnSync(executable, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
  });
  if (result.status || result.error)
    throw Error(result.error?.message ?? result.stdout + result.stderr);
  return result.stdout;
}
const evaluate = (code) => JSON.parse(run("--json", "eval", code)).data.result;
const click = (name) =>
  run("find", "role", "button", "click", "--name", name, "--exact");
const link = (name) =>
  run("find", "role", "link", "click", "--name", name, "--exact");
const wait = (ms) => run("wait", String(ms));
function check(name, code) {
  const result = typeof code === "string" ? evaluate(code) : code;
  findings.push({ name, result });
  mkdirSync(output, { recursive: true });
  writeFileSync(
    resolve(output, "director-checks.json"),
    JSON.stringify(findings, null, 2),
  );
  assert.equal(result, true, name);
  console.log(`Verified ${name}`);
}
function sample(action) {
  evaluate(`(() => {
    window.directorSamples=[];
    document.addEventListener('click',()=>{
      const start=performance.now();
      const timer=setInterval(()=>{
        const item=id=>document.querySelector('[data-testid="node-'+id+'"]');
        const child=item('research');
        const edge=document.querySelector('[data-edge="research"] > path');
        const root=item('treasury');
        const rim=id=>document.querySelector('[data-rim="'+id+'"]');
        window.directorSamples.push({t:performance.now()-start,
          clip:child ? getComputedStyle(child).clipPath : null,
          edge:edge ? getComputedStyle(edge).strokeDashoffset : null,
          amount:root?.querySelector('.capital-number > [aria-hidden]')?.textContent,
          data:rim('data') ? getComputedStyle(rim('data')).stroke : null,
          scraper:rim('scraper') ? getComputedStyle(rim('scraper')).stroke : null,
          revoked:child?.classList.contains('revoked'),
          metadata:child?.querySelector('.status')?.textContent});
        if(performance.now()-start>1000)clearInterval(timer);
      },10);
    },{once:true,capture:true});return true;
  })()`);
  click(action);
  wait(1100);
  return evaluate("directorSamples");
}
run("set", "viewport", "1440", "900");
run("set", "media", "no-preference");
run("open", url);
run("snapshot", "-i");
wait(300);
const construct = sample("Delegate authority");
findings.push({ name: "construction timeline", samples: construct });
check(
  "connector grows before child resolves",
  construct.some(
    (p) =>
      p.t > 100 &&
      p.t < 300 &&
      Number.parseFloat(p.edge) > 0 &&
      p.clip?.includes("100%"),
  ) &&
    construct
      .filter((p) => p.t < 330 && p.clip)
      .every((p) => p.clip.includes("100%")) &&
    construct.some((p) => p.t > 800 && p.clip === "none"),
);
check(
  "intermediate amount precision stays fixed",
  construct
    .filter((p) => p.amount)
    .every((p) => /^\d[\d,]*\.\d{2}$/.test(p.amount)),
);
click("02 Recursion");
click("Build demo hierarchy");
wait(3100);
check(
  "construction fully settles",
  "document.querySelectorAll('.grant-resolve').length===0 && document.querySelectorAll('.mandate-plate').length===6",
);
check(
  "SVG rims exactly register with labels",
  `(()=>{const svg=document.querySelector('.authority-channels');return [...document.querySelectorAll('[data-rim]')].every(e=>{
  const numbers=e.getAttribute('d').match(/-?\\d+(?:\\.\\d+)?/g).map(Number);
  const p=new DOMPoint(numbers[0],numbers[1]).matrixTransform(svg.getScreenCTM());
  const r=document.querySelector('[data-testid="node-'+e.dataset.rim+'"]').getBoundingClientRect();
  return Math.abs(p.x-r.left)<.5 && Math.abs(p.y-r.top)<.5;})})()`,
);
click("04 Blast Radius");
click("Preview Research revoke");
wait(450);
check(
  "twelve wires exclude Root and Operations",
  `(()=>{const v=document.querySelector('.impact-volume').getBoundingClientRect();const root=document.querySelector('[data-testid=node-treasury]').getBoundingClientRect();const op=document.querySelector('[data-testid=node-operations]').getBoundingClientRect();return document.querySelectorAll('.impact-volume path').length===12 && v.top>root.bottom && v.right<op.left && document.querySelectorAll('.mandate-plate.active').length===6})()`,
);
click("Cancel preview");
wait(250);
check(
  "cancel removes volume without changing authority",
  "!document.querySelector('.impact-volume') && document.querySelectorAll('.mandate-plate.active').length===6",
);
click("Preview Research revoke");
wait(450);
evaluate(
  "window.operationsBefore={rect:document.querySelector('[data-testid=node-operations]').getBoundingClientRect().toJSON(),text:document.querySelector('[data-testid=node-operations]').textContent,opacity:getComputedStyle(document.querySelector('[data-testid=node-operations]')).opacity};true",
);
const cascade = sample("Confirm demo revoke");
findings.push({ name: "cascade timeline", samples: cascade });
check(
  "cascade discloses exact amount and local status immediately",
  cascade
    .filter((p) => p.revoked)
    .every((p) => p.amount === "1,390.00" && p.metadata === "revoked"),
);
check(
  "Data rim extinguishes before Scraper rim",
  cascade.some((p) => p.t > 280 && p.t < 330 && p.data !== p.scraper) &&
    cascade.some((p) => p.t > 500 && p.data === p.scraper),
);
check(
  "Operations is unchanged through the cut",
  "JSON.stringify(operationsBefore)===JSON.stringify({rect:document.querySelector('[data-testid=node-operations]').getBoundingClientRect().toJSON(),text:document.querySelector('[data-testid=node-operations]').textContent,opacity:getComputedStyle(document.querySelector('[data-testid=node-operations]')).opacity})",
);
check(
  "blocked channels use normalized dash units",
  "parseFloat(getComputedStyle(document.querySelector('[data-edge=data] > path')).strokeDasharray)<1",
);
evaluate(
  "window.idleRAF=0;window.originalRAF=window.requestAnimationFrame;window.requestAnimationFrame=function(cb){window.idleRAF++;return window.originalRAF(cb)};true",
);
wait(1200);
check("idle app schedules no animation frames", "idleRAF===0");
evaluate("window.requestAnimationFrame=window.originalRAF;true");
check(
  "final renderer has no canvas or WebGL dependency fetch",
  "document.querySelectorAll('canvas').length===0 && performance.getEntriesByType('resource').every(e=>!/(three|fiber|story-spike)/i.test(e.name))",
);
run("set", "media", "reduced-motion");
click("Reset");
click("02 Recursion");
click("Build demo hierarchy");
check(
  "desktop reduced motion has flat geometry and immediate final state",
  "document.querySelector('.authority-surface').dataset.depth==='flat' && document.querySelectorAll('.mandate-plate').length===6 && document.getAnimations().every(a=>a.playState!=='running')",
);
run("set", "media", "no-preference");
run("set", "viewport", "1024", "844");
click("Reset");
click("02 Recursion");
click("Build demo hierarchy");
wait(3900);
check(
  "complete 1024px hierarchy fits without label collisions",
  `(()=>{const field=document.querySelector('.authority-map').getBoundingClientRect();const rects=[...document.querySelectorAll('.mandate-plate')].map(e=>e.getBoundingClientRect());return rects.length===6 && rects.every((a,i)=>a.left>=field.left && a.right<=field.right && a.bottom<=field.bottom && rects.every((b,j)=>i===j || a.right<=b.left || a.left>=b.right || a.bottom<=b.top || a.top>=b.bottom))})()`,
);
link("Command");
run("select", "[aria-label='Product mode']", "devnet");
link("Story");
click("Delegate authority");
link("Command");
wait(1000);
check(
  "interrupted Story navigation preserves Devnet gate",
  "document.querySelector('[aria-label=\"Product mode\"]').value==='devnet' && !!document.querySelector('.empty-root') && !document.querySelector('.mandate-plate')",
);
run("select", "[aria-label='Product mode']", "demo");
link("Story");
check(
  "re-entry starts one clean world",
  "document.querySelectorAll('[data-testid=persistent-authority-world]').length===1 && document.querySelectorAll('.mandate-plate').length===1",
);
check("browser reports no runtime errors", run("errors").trim() === "");
run("close");
console.log(
  `Director checks: ${findings.filter((f) => f.result === true).length} passed.`,
);
