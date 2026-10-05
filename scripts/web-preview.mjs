// Static-export preview only. No application API, persistence or signing service.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../web/out/", import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/x-component",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
await stat(resolve(root, "index.html"));
createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    let file = resolve(root, `.${path}`);
    if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) {
        try {
          await stat(file + ".html");
          file += ".html";
        } catch {
          file = resolve(file, "index.html");
        }
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (path.endsWith(".__PAGE__.txt")) {
        // Next's Windows export puts the page segment in a directory.
        file = file.replace(/\.__PAGE__\.txt$/, `${sep}__PAGE__.txt`);
      } else if (!extname(file)) {
        file += ".html";
      } else throw error;
    }
    response.writeHead(200, {
      "content-type": mime[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-cache",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Static production export: http://127.0.0.1:${port}`),
);
