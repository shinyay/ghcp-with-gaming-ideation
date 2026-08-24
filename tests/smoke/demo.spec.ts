import { expect, test } from "@playwright/test";
import { runLegacyReplay } from "@star-relay/legacy-1998";

test("Chromium follows Museum to both playables without external requests", async ({
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
  await expect(page.locator("[data-stable-id]")).toHaveCount(14);
  await expect(page.locator("[data-archive-id]")).toHaveCount(30);
  await expect(page.locator("[data-demo-view]")).toHaveCount(5);
  expect(
    await page
      .locator("[data-demo-view]")
      .evaluateAll((elements) => elements.map((element) => element.id))
  ).toEqual(["museum", "archive", "lineage", "legacy", "second-hand"]);
  await expect(page.locator("#latency-fixture-rows tr")).toHaveCount(4);
  await expect(page.locator("#handoff-caption")).not.toBeEmpty();
  await expect(page.locator("[data-legacy-step]")).toHaveCount(4);
  await expect(page.locator("#legacy-caption-copy")).toBeVisible();

  const browserReplay = await page.evaluate(() => window.__STAR_RELAY_DEMO__.legacy);
  const nodeReplay = runLegacyReplay();
  expect(browserReplay.finalHash).toBe(nodeReplay.finalHash);
  expect(browserReplay.checkpointHashes).toEqual(nodeReplay.checkpointHashes);
  expect(browserReplay.tick).toBe(1800);
  expect(externalRequests).toEqual([]);
});

test("Archive and Lineage filters preserve stable offline resolvers", async ({
  page
}) => {
  await page.goto("/");

  await page.locator("#archive-search").fill("DRV-003");
  await expect(page.locator("[data-archive-id]")).toHaveCount(1);
  await expect(page.locator("[data-archive-id='DRV-003']")).toContainText(
    "md:heading/core-loop"
  );
  await page.locator("#archive-clear").click();
  await page.locator("#archive-media").selectOption("source");
  await expect(page.locator("[data-archive-id]")).toHaveCount(4);

  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  await expect(page.locator("[data-stable-id]")).toHaveCount(3);
  await expect(page.locator("[data-stable-id='DRV-001']")).toContainText(
    "offline:DRV-001"
  );
  await page.getByRole("button", { name: "Proposal / delivery" }).click();
  await expect(page.locator("[data-stable-id='PR-004']")).toBeVisible();
  await expect(page.locator("[data-stable-id='PR-005']")).toBeVisible();
  await expect(page.locator("[data-stable-id='BLD-001']")).toContainText(
    "PR-004 —verified-by→ BLD-001"
  );
  await expect(page.locator("[data-stable-id='BET-002']")).toContainText(
    "offline:DISC-004"
  );
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.locator("[data-stable-id]")).toHaveCount(14);
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

test("remapping reserves focus keys and the Canvas never traps Tab", async ({
  page
}) => {
  await page.goto("/");
  await page.getByText("Keyboard remapping", { exact: true }).click();
  const upBinding = page.getByRole("button", {
    name: "P1 上へ移動: W",
    exact: true
  });

  await upBinding.click();
  await page.keyboard.press("Tab");
  await expect(upBinding).toHaveAccessibleName("P1 上へ移動: W");
  await expect(upBinding).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => document.activeElement?.id)).not.toBe(
    "handoff-canvas"
  );

  await upBinding.click();
  await page.keyboard.press("Escape");
  await expect(upBinding).toHaveAccessibleName("P1 上へ移動: W");
  await expect(upBinding).toBeFocused();

  await upBinding.click();
  await page.keyboard.press("g");
  const remappedBinding = page.getByRole("button", {
    name: "P1 上へ移動: G",
    exact: true
  });
  await expect(remappedBinding).toBeVisible();
  await expect(page.locator("#handoff-canvas")).toBeFocused();

  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe(
    "export-playtest"
  );
  await page.locator("#handoff-canvas").focus();
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe(
    "reset-bindings"
  );

  await page.getByRole("button", { name: "既定キーに戻す" }).click();
  await expect(upBinding).toHaveAccessibleName("P1 上へ移動: W");
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
