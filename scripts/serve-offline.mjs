import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const packagedServer = resolve("dist/offline-demo-pack/serve.mjs");
if (!existsSync(packagedServer)) {
  throw new Error(
    "Offline package is missing. Run npm run package:release before npm run serve:offline."
  );
}

await import(pathToFileURL(packagedServer).href);
