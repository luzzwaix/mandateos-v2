import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Development evidence only. Reference images never enter the web app or public assets.
const frames = [
  ["01-arrival", "Arrival", "exec-a5aa1e3a-5959-4184-bd0c-89924a2e7b71.png"],
  [
    "02-organization",
    "Organization",
    "exec-328a29aa-5ab8-4407-a378-6e1531b1a945.png",
  ],
  [
    "03-blast-preview",
    "Blast Radius",
    "exec-98843c89-969a-434a-9159-3e1fcd2d8c24.png",
  ],
  ["04-cascade", "Cascade", "exec-98fa30b3-70ea-44f6-9d2c-289b119f07c5.png"],
  [
    "05-plane-change",
    "Plane Change",
    "exec-7e05b99a-34a4-40ee-b830-e77b5929e2d4.png",
  ],
  [
    "06-command-active",
    "Command",
    "exec-910c430b-be73-4c60-8caf-187f05c80283.png",
  ],
  [
    "07-arena-settlement",
    "Arena",
    "exec-5fd666a6-1d7c-47e1-837f-858c2ed65d49.png",
  ],
];
const out = resolve("artifacts/high-end");
const uri = (path) => pathToFileURL(path).href;
mkdirSync(out, { recursive: true });
writeFileSync(
  resolve(out, "comparison.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MandateOS — visual evidence</title>
<style>body{margin:24px;background:#111617;color:#ede9df;font:16px system-ui}h1{font-size:24px}h2{margin-top:40px}p{max-width:850px;color:#b7bfbc}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{margin:10px 0;font:12px monospace}img{width:100%;display:block}a{color:#b9efdb}details{margin:16px 0}details img{max-width:1440px}@media(max-width:900px){.pair{grid-template-columns:1fr}}</style>
<h1>Authority Loom — reference / real browser</h1><p>Seven approved concept references versus the production localhost captures at 1440×900. Labels, values and controls in the application are native DOM/SVG. These references are used only in this development comparison and are never shipped with the interface. Differences in amounts and selected nodes follow the existing fixture state.</p>
${frames.map(([file, title, target]) => `<section><h2>${title}</h2><div class="pair"><figure><figcaption>Approved concept — 1586×992</figcaption><a href="${uri(resolve(process.env.USERPROFILE, "Downloads", target))}"><img alt="Approved ${title} concept" src="${uri(resolve(process.env.USERPROFILE, "Downloads", target))}"></a></figure><figure><figcaption>Final production browser — 1440×900</figcaption><a href="${uri(resolve(out, "pass2", file + ".png"))}"><img alt="Production ${title} capture" src="${uri(resolve(out, "pass2", file + ".png"))}"></a></figure></div><details><summary>Browser PASS 1</summary><img alt="PASS 1 ${title}" src="${uri(resolve(out, "pass1", file + ".png"))}"></details></section>`).join("\n")}
</html>`,
);
console.log(resolve(out, "comparison.html"));
