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
  await expect(page.locator("#latency-fixture-rows tr")).toHaveCount(4);
  await expect(page.locator("#handoff-caption")).not.toBeEmpty();

  const browserReplay = await page.evaluate(() => window.__STAR_RELAY_DEMO__.legacy);
  const nodeReplay = runLegacyReplay();
  expect(browserReplay.finalHash).toBe(nodeReplay.finalHash);
  expect(browserReplay.checkpointHashes).toEqual(nodeReplay.checkpointHashes);
  expect(browserReplay.tick).toBe(1800);
  expect(externalRequests).toEqual([]);
});

test("live regions stay quiet per tick and invalid settings do not reset", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");

  const mutations = await page.evaluate(async () => {
    const status = document.querySelector("#handoff-status");
    const caption = document.querySelector("#handoff-caption");
    const tick = document.querySelector("#handoff-tick");
    if (status === null || caption === null || tick === null) {
      throw new Error("Missing SECOND HAND status elements");
    }
    const counts = { status: 0, caption: 0, tick: 0 };
    const observers = [
      [status, "status"],
      [caption, "caption"],
      [tick, "tick"]
    ].map(([element, key]) => {
      const observer = new MutationObserver(() => {
        counts[key as keyof typeof counts] += 1;
      });
      observer.observe(element as Node, {
        childList: true,
        characterData: true,
        subtree: true
      });
      return observer;
    });
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    for (const observer of observers) {
      observer.disconnect();
    }
    return counts;
  });
  expect(mutations.status).toBe(0);
  expect(mutations.caption).toBe(0);
  expect(mutations.tick).toBeGreaterThan(5);

  const originalSession = await page.evaluate(
    () => window.__STAR_RELAY_DEMO__.getPlaytestLog().sessionId
  );
  await page.locator("#latency-p1").fill("3000");
  await page.getByRole("button", { name: "1P + AI companion" }).click();
  await expect(
    page.getByRole("button", { name: "Local 2P" })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() => window.__STAR_RELAY_DEMO__.getSecondHandState().mode)
  ).toBe(1);
  expect(
    await page.evaluate(() => window.__STAR_RELAY_DEMO__.getPlaytestLog().sessionId)
  ).toBe(originalSession);

  await page.locator("#latency-p1").fill("0");
  await page.getByRole("button", { name: "1P + AI companion" }).click();
  expect(
    await page.evaluate(() => window.__STAR_RELAY_DEMO__.getSecondHandState().mode)
  ).toBe(2);

  await page.getByText("Keyboard remapping", { exact: true }).click();
  await page
    .getByRole("button", { name: "P1 上へ移動: W", exact: true })
    .click();
  await page.keyboard.press("g");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe(
    "handoff-canvas"
  );
  expect(pageErrors).toEqual([]);
});

test("local keyboard players exchange sender and receiver roles", async ({
  page
}) => {
  await page.goto("/");
  const canvas = page.locator("#handoff-canvas");
  const status = page.locator("#handoff-status");
  const caption = page.locator("#handoff-caption");
  await caption.evaluate((element) => {
    element.setAttribute("data-history", element.textContent ?? "");
    new MutationObserver(() => {
      const history = element.getAttribute("data-history") ?? "";
      element.setAttribute(
        "data-history",
        `${history}\n${element.textContent ?? ""}`
      );
    }).observe(element, { childList: true, characterData: true, subtree: true });
  });
  await canvas.focus();

  await page.keyboard.down("a");
  await page.keyboard.down("f");
  await page.waitForTimeout(100);
  await page.keyboard.up("a");
  await page.keyboard.up("f");
  await page.keyboard.down("ArrowUp");
  await page.keyboard.down("Enter");
  await page.waitForTimeout(100);
  await page.keyboard.up("ArrowUp");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("1");
  await page.keyboard.up("Enter");
  await expect(status).toHaveAttribute("data-owner", "2");
  await expect
    .poll(async () => caption.getAttribute("data-history"))
    .toContain("受領可能");

  await page.keyboard.down("ArrowRight");
  await page.keyboard.down("Enter");
  await page.waitForTimeout(100);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.up("Enter");
  await page.keyboard.down("f");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("2");
  await page.keyboard.up("f");
  await expect(status).toHaveAttribute("data-owner", "1");
});

test("AI companion receives and returns the Core without network calls", async ({
  page
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "1P + AI companion" }).click();
  const canvas = page.locator("#handoff-canvas");
  const status = page.locator("#handoff-status");
  await canvas.focus();

  await page.keyboard.down("a");
  await page.keyboard.down("f");
  await page.waitForTimeout(100);
  await page.keyboard.up("a");
  await page.keyboard.up("f");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("1");
  await expect(status).toHaveAttribute("data-owner", "2");

  await page.keyboard.down("w");
  await page.keyboard.down("f");
  await page.waitForTimeout(100);
  await page.keyboard.up("w");
  await expect
    .poll(async () => status.getAttribute("data-sequence"))
    .toBe("2");
  await page.keyboard.up("f");
  await expect(status).toHaveAttribute("data-owner", "1");

  const log = await page.evaluate(() =>
    window.__STAR_RELAY_DEMO__.getPlaytestLog()
  );
  expect(log.sessionId).toMatch(/^[0-9a-f]{32}$/);
  expect(log.events.every((event) =>
    Object.values(event).every((value) => Number.isSafeInteger(value))
  )).toBe(true);
});
