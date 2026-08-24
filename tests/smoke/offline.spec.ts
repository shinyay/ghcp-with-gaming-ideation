import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("allowlisted package runs without external network dependencies", async ({
  page
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4173") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/STAR RELAY/);
  await expect(page.locator("[data-stable-id]")).toHaveCount(11);
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
