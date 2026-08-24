import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("allowlisted package runs without external network dependencies", async ({
  page
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173")) {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(page).toHaveTitle(/STAR RELAY/);
  await expect(page.locator("[data-stable-id]")).toHaveCount(11);

  const browserHash = await page.evaluate(
    () => window.__STAR_RELAY_DEMO__.legacy.finalHash
  );
  expect(browserHash).toBe(runLegacyReplay().finalHash);
  expect(externalRequests).toEqual([]);
});
