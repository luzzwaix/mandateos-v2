// Check the actual Markdown/HTML destinations without crawling historical docs.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = process.cwd();
const markdown = readFileSync(resolve(root, "README.md"), "utf8");
function anchors(content) {
  const seen = new Map();
  return new Set(
    [...content.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
      const slug = match[1]
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}_\-\s]/gu, "")
        .replace(/\s/g, "-");
      const count = seen.get(slug) ?? 0;
      seen.set(slug, count + 1);
      return count ? `${slug}-${count}` : slug;
    }),
  );
}
const destinations = new Set([
  ...[...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]),
  ...[...markdown.matchAll(/\b(?:src|srcset|href)="([^"]+)"/g)].map(
    (m) => m[1],
  ),
]);
const results = await Promise.all(
  [...destinations].map(async (destination) => {
    try {
      if (!/^https?:\/\//.test(destination)) {
        const [pathname, fragment] = destination.split("#");
        const file = resolve(root, decodeURIComponent(pathname || "README.md"));
        if (!file.startsWith(root + sep)) throw Error("Path outside checkout");
        if (!statSync(file).isFile()) throw Error("Not a file");
        if (fragment) {
          if (!/\.md$/i.test(file))
            throw Error("Unsupported local anchor target");
          if (
            !anchors(readFileSync(file, "utf8")).has(
              decodeURIComponent(fragment),
            )
          )
            throw Error("Missing Markdown heading anchor");
        }
        return {
          destination,
          status: fragment ? "local-anchor" : "local-file",
        };
      }
      const response = await fetch(destination, {
        signal: AbortSignal.timeout(30000),
        redirect: "follow",
      });
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
      if (login) throw Error("Unexpected login redirect");
      return {
        destination,
        status: "http-ok",
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
