import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist/offline-demo-pack");
const host = "127.0.0.1";
const port = 4173;

if (!existsSync(resolve(root, "index.html"))) {
  throw new Error("Offline package is missing. Run npm run build and npm run package:offline.");
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

createServer((request, response) => {
  const requestPath = new URL(request.url ?? "/", `http://${host}`).pathname;
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const candidate = resolve(root, decodeURIComponent(relativePath));

  if (!candidate.startsWith(`${root}${sep}`) || !existsSync(candidate)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const file = statSync(candidate).isDirectory()
    ? resolve(candidate, "index.html")
    : candidate;
  const type =
    contentTypes[extname(file)] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": type });
  createReadStream(file).pipe(response);
}).listen(port, host, () => {
  console.log(`Offline demo: http://${host}:${port}`);
});
