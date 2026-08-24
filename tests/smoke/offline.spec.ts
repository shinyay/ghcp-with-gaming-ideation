import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("allowlisted package runs without external network dependencies", async ({
  page
}) => {
  const externalRequests: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") {
      await route.continue();
      return;
    }
    externalRequests.push(url.href);
    await route.abort("internetdisconnected");
  });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") {
      if (!externalRequests.includes(request.url())) {
        externalRequests.push(request.url());
      }
    }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/STAR RELAY/);
  expect((await page.request.get("/docs")).status()).toBe(404);
  expect((await page.request.get("/")).status()).toBe(200);
  await expect(page.locator("[data-stable-id]")).toHaveCount(14);
  await expect(page.locator("[data-archive-id]")).toHaveCount(30);
  expect(
    await page
      .locator("[data-demo-view]")
      .evaluateAll((elements) => elements.map((element) => element.id))
  ).toEqual(["museum", "archive", "lineage", "legacy", "second-hand"]);
  for (const target of ["museum", "archive", "lineage", "legacy", "second-hand"]) {
    await page.locator(`nav a[href="#${target}"]`).click();
    await expect(page.locator(`#${target}`)).toBeInViewport();
  }
  await expect(page.locator("#legacy-screen")).toBeVisible();
  await expect(page.locator("[data-legacy-step]")).toHaveCount(4);

  const browserReplay = await page.evaluate(
    () => window.__STAR_RELAY_DEMO__.legacy
  );
  const nodeReplay = runLegacyReplay();
  expect(browserReplay.finalHash).toBe(nodeReplay.finalHash);
  expect(browserReplay.checkpointHashes).toEqual(nodeReplay.checkpointHashes);

  await page.locator("#legacy-crt").click();
  await expect(page.locator("#legacy-screen")).toHaveAttribute(
    "data-crt",
    "true"
  );
  expect(externalRequests).toEqual([]);
});
