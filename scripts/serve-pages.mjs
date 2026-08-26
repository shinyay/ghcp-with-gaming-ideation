import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve("pages");
const host = "127.0.0.1";
const port = 4174;

if (!existsSync(resolve(root, "index.html"))) {
  throw new Error("Pages site is missing. Restore the allowlisted pages directory.");
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
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
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'",
      "Content-Type": contentTypes[extname(file)] ?? "application/octet-stream",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  } catch (error) {
    console.error("Pages preview request failed.", error);
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error");
    } else {
      response.destroy();
    }
  }
}).listen(port, host, () => {
  console.log(`Local: http://${host}:${port}`);
});
