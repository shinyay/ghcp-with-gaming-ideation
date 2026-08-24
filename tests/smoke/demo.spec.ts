import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("Chromium matches Node replay and renders the static lineage", async ({
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
  await expect(page.locator("canvas")).toHaveCount(2);
  await expect(page.locator("[data-stable-id]")).toHaveCount(11);
  await expect(page.locator("[data-legacy-step]")).toHaveCount(4);
  await expect(page.locator("#legacy-caption-copy")).toBeVisible();

  const browserReplay = await page.evaluate(() => window.__STAR_RELAY_DEMO__.legacy);
  const nodeReplay = runLegacyReplay();
  expect(browserReplay.finalHash).toBe(nodeReplay.finalHash);
  expect(browserReplay.checkpointHashes).toEqual(nodeReplay.checkpointHashes);
  expect(browserReplay.tick).toBe(1800);
  expect(externalRequests).toEqual([]);
});

test("keyboard controls drive the live Mirror Corridor simulation", async ({
  page
}) => {
  await page.goto("/");
  await page.locator("#legacy-mode").click();
  const canvas = page.locator("#legacy-canvas");
  await expect(page.locator("#legacy-status")).toHaveAttribute(
    "data-mode",
    "manual"
  );
  await canvas.focus();

  const startX = await page.evaluate(
    () => window.__STAR_RELAY_DEMO__.getLegacyState().playerX
  );
  await page.keyboard.down("ArrowRight");
  await expect
    .poll(() =>
      page.evaluate(() => window.__STAR_RELAY_DEMO__.getLegacyState().playerX)
    )
    .toBeGreaterThan(startX);
  await page.keyboard.up("ArrowRight");

  await page.keyboard.down("a");
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__STAR_RELAY_DEMO__.getLegacyState().routePreviewTicks
      )
    )
    .toBeGreaterThanOrEqual(48);
  await page.keyboard.up("a");
  await expect
    .poll(() =>
      page.evaluate(() => window.__STAR_RELAY_DEMO__.getLegacyState().phase)
    )
    .toBe(1);
});

test("gamepad movement and A button share the deterministic input path", async ({
  page
}) => {
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      touched: false,
      value: 0
    }));
    const gamepad = {
      axes: [0, 0, 0, 0],
      buttons,
      connected: true,
      id: "STAR RELAY test pad",
      index: 0,
      mapping: "standard",
      timestamp: 0,
      vibrationActuator: null
    };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [null, gamepad]
    });
    (
      window as unknown as {
        __setStarRelayGamepad: (
          axisX: number,
          axisY: number,
          action: boolean
        ) => void;
      }
    ).__setStarRelayGamepad = (axisX, axisY, action) => {
      gamepad.axes[0] = axisX;
      gamepad.axes[1] = axisY;
      const actionButton = gamepad.buttons[0];
      if (actionButton !== undefined) {
        actionButton.pressed = action;
        actionButton.touched = action;
        actionButton.value = action ? 1 : 0;
      }
    };
  });

  await page.goto("/");
  await page.locator("#legacy-mode").click();
  const startX = await page.evaluate(
    () => window.__STAR_RELAY_DEMO__.getLegacyState().playerX
  );
  await page.evaluate(() => {
    (
      window as unknown as {
        __setStarRelayGamepad: (
          axisX: number,
          axisY: number,
          action: boolean
        ) => void;
      }
    ).__setStarRelayGamepad(1, 0, false);
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__STAR_RELAY_DEMO__.getLegacyState().playerX)
    )
    .toBeGreaterThan(startX);

  await page.evaluate(() => {
    (
      window as unknown as {
        __setStarRelayGamepad: (
          axisX: number,
          axisY: number,
          action: boolean
        ) => void;
      }
    ).__setStarRelayGamepad(0, 0, true);
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__STAR_RELAY_DEMO__.getLegacyState().routePreviewTicks
      )
    )
    .toBeGreaterThanOrEqual(48);
  await page.evaluate(() => {
    (
      window as unknown as {
        __setStarRelayGamepad: (
          axisX: number,
          axisY: number,
          action: boolean
        ) => void;
      }
    ).__setStarRelayGamepad(0, 0, false);
  });
  await expect
    .poll(() =>
      page.evaluate(() => window.__STAR_RELAY_DEMO__.getLegacyState().phase)
    )
    .toBe(1);
});

test("the route preview only locks when the simulation would connect", async ({
  page
}) => {
  await page.goto("/");
  await page.locator("#legacy-mode").click();
  const canvas = page.locator("#legacy-canvas");
  const status = page.locator("#legacy-status");
  await expect(status).toHaveAttribute("data-mode", "manual");
  await canvas.focus();

  const readPreview = () =>
    page.evaluate(() => {
      const demo = window.__STAR_RELAY_DEMO__;
      const state = demo.getLegacyState();
      return {
        playerX: state.playerX,
        previewTicks: state.routePreviewTicks,
        connects: demo.predictLegacyRoute(state.playerX, state.playerY).connects
      };
    });

  await page.keyboard.down("a");
  await expect.poll(async () => (await readPreview()).previewTicks).toBeGreaterThanOrEqual(48);

  const seated = await readPreview();
  expect(seated.connects).toBe(true);
  await expect(status).toHaveText(/ROUTE LOCKED/);
  await page.keyboard.up("a");

  await page.locator("#legacy-restart").click();
  await canvas.focus();

  // Walk right until the simulation would no longer reach the Relay.
  await page.keyboard.down("ArrowRight");
  await expect.poll(async () => (await readPreview()).connects).toBe(false);
  await page.keyboard.up("ArrowRight");

  await page.keyboard.down("a");
  await expect.poll(async () => (await readPreview()).previewTicks).toBeGreaterThanOrEqual(48);

  const missing = await readPreview();
  expect(missing.connects).toBe(false);
  await expect(status).not.toHaveText(/ROUTE LOCKED/);
  await expect(status).toHaveText(/(MIRROR|RELAY) MISS/);
  await page.keyboard.up("a");

  // The simulation must agree with what the preview promised.
  await expect
    .poll(() =>
      page.evaluate(() => window.__STAR_RELAY_DEMO__.getLegacyState().routeMissed)
    )
    .toBe(1);
  const finalState = await page.evaluate(() =>
    window.__STAR_RELAY_DEMO__.getLegacyState()
  );
  expect(finalState.connectedRelay).toBe(0);
});

test("CRT and reduced-flash treatments remain optional", async ({ page }) => {
  await page.goto("/");
  const screen = page.locator("#legacy-screen");
  const crt = page.locator("#legacy-crt");
  const flash = page.locator("#legacy-flash");

  await expect(screen).toHaveAttribute("data-crt", "false");
  await crt.click();
  await expect(screen).toHaveAttribute("data-crt", "true");
  await expect(crt).toHaveAttribute("aria-pressed", "true");

  const initialFlash = await flash.getAttribute("aria-pressed");
  await flash.click();
  await expect(flash).not.toHaveAttribute(
    "aria-pressed",
    initialFlash ?? "false"
  );
  await expect(page.locator("#legacy-caption")).toBeVisible();
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
