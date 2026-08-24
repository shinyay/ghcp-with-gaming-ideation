import { expect, test } from "@playwright/test";

test("source offline server survives a directory request", async ({ request }) => {
  const directoryResponse = await request.get("/assets/");
  expect(directoryResponse.status()).toBe(404);

  const rootResponse = await request.get("/");
  expect(rootResponse.status()).toBe(200);
  expect(rootResponse.headers()["content-security-policy"]).toContain(
    "default-src 'self'"
  );
  expect(rootResponse.headers()["referrer-policy"]).toBe("no-referrer");
  expect(rootResponse.headers()["x-content-type-options"]).toBe("nosniff");
});
