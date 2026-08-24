import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const host = "127.0.0.1";
const port = 4173;
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const requestPath = new URL(request.url ?? "/", `http://${host}`).pathname;
    const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const candidate = resolve(root, decodeURIComponent(relativePath));
    if (!candidate.startsWith(`${root}${sep}`) || !existsSync(candidate)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const file = statSync(candidate).isDirectory()
      ? resolve(candidate, "index.html")
      : candidate;
    if (!existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const content = await readFile(file);
    response.writeHead(200, {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
      "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  } catch (error) {
    console.error("Offline server request failed.", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
    } else {
      response.destroy();
    }
  }
}).listen(port, host, () => {
  console.log(`STAR RELAY offline demo: http://${host}:${port}`);
});
