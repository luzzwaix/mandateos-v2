// Check the actual Markdown/HTML destinations without crawling historical docs.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = process.cwd();
const markdown = readFileSync(resolve(root, "README.md"), "utf8");
const destinations = new Set([
  ...[...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]),
  ...[...markdown.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
]);
const results = await Promise.all(
  [...destinations].map(async (destination) => {
    try {
      if (!/^https?:\/\//.test(destination)) {
        const file = resolve(root, decodeURIComponent(destination));
        if (!file.startsWith(root + sep)) throw Error("Path outside checkout");
        if (!statSync(file).isFile()) throw Error("Not a file");
        return { destination, status: "local-file" };
      }
      const response = await fetch(destination, {
        signal: AbortSignal.timeout(30000),
        redirect: "follow",
      });
      const protectedPreview =
        new URL(destination).hostname ===
        "mandateos-v2-f984ud67a-luzzwaixs-projects.vercel.app";
      const login =
        new URL(response.url).hostname === "vercel.com" &&
        new URL(response.url).pathname.startsWith("/login");
      await response.body?.cancel();
      if (response.status === 429)
        return {
          destination,
          status: "rate-limited",
          httpStatus: 429,
          retryAfter: response.headers.get("retry-after"),
        };
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      if (protectedPreview && !login)
        throw Error("Preview authentication boundary changed; inspect again");
      if (!protectedPreview && login) throw Error("Unexpected login redirect");
      return {
        destination,
        status: protectedPreview ? "expected-authentication" : "http-ok",
        httpStatus: response.status,
        finalUrl: response.url,
      };
    } catch (error) {
      return { destination, status: "failed", error: String(error) };
    }
  }),
);
const report = { at: new Date().toISOString(), results };
if (process.argv[2])
  writeFileSync(
    resolve(process.argv[2]),
    JSON.stringify(report, null, 2) + "\n",
  );
console.log(JSON.stringify(report, null, 2));
if (results.some((r) => r.status === "failed")) process.exitCode = 1;
else if (results.some((r) => r.status === "rate-limited")) process.exitCode = 2;
