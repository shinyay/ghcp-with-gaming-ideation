import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("Chromium matches Node replay and renders the static lineage", async ({
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
  await expect(page.locator("canvas")).toHaveCount(2);
  await expect(page.locator("[data-stable-id]")).toHaveCount(11);

  const browserReplay = await page.evaluate(() => window.__STAR_RELAY_DEMO__.legacy);
  const nodeReplay = runLegacyReplay();
  expect(browserReplay.finalHash).toBe(nodeReplay.finalHash);
  expect(browserReplay.checkpointHashes).toEqual(nodeReplay.checkpointHashes);
  expect(browserReplay.tick).toBe(1800);
  expect(externalRequests).toEqual([]);
});

test("keyboard handoff changes owner exactly at acceptance", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("#handoff-canvas");
  const status = page.locator("#handoff-status");
  await canvas.focus();

  await page.keyboard.down("f");
  await page.waitForTimeout(80);
  await page.keyboard.up("f");
  await page.waitForTimeout(560);
  await page.keyboard.down("Enter");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("1");
  await page.keyboard.up("Enter");
  await expect(status).toHaveAttribute("data-owner", "2");

  await page.keyboard.down("Enter");
  await page.waitForTimeout(80);
  await page.keyboard.up("Enter");
  await page.waitForTimeout(560);
  await page.keyboard.down("q");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("2");
  await page.keyboard.up("q");
  await expect(status).toHaveAttribute("data-owner", "1");
});
