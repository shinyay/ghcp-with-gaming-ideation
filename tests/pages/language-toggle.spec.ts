import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "star-relay-pages-language-v1";
const JAPANESE_TEXT = /[ぁ-んァ-ヶ一-龠々ー]/;

interface TranslationEntry {
  readonly ja: string;
  readonly en: string;
}

interface TranslationCatalog {
  readonly schemaVersion: 1;
  readonly defaultLanguage: "ja";
  readonly storageKey: typeof STORAGE_KEY;
  readonly translations: Readonly<Record<string, TranslationEntry>>;
}

async function assertLocale(page: Page, locale: "ja" | "en"): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("html")).toHaveAttribute("data-language", locale);
  await expect(
    page.locator(`[data-language-choice="${locale}"]`)
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(
      `[data-language-choice="${locale === "ja" ? "en" : "ja"}"]`
    )
  ).toHaveAttribute("aria-pressed", "false");

  const issues = await page.evaluate(
    ({ selectedLocale, japanesePattern }) => {
      const catalogElement = document.getElementById("i18n-catalog");
      if (!(catalogElement instanceof HTMLScriptElement)) {
        return ["Missing i18n catalog."];
      }
      const catalog = JSON.parse(
        catalogElement.textContent ?? ""
      ) as TranslationCatalog;
      const errors: string[] = [];

      document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
        const key = element.dataset["i18n"];
        const expected =
          key === undefined ? undefined : catalog.translations[key]?.[selectedLocale];
        if (expected === undefined) {
          errors.push(`Missing text translation: ${key ?? "<undefined>"}`);
        } else if ((element.textContent ?? "").trim() !== expected.trim()) {
          errors.push(`Text mismatch: ${key}`);
        }
      });

      document.querySelectorAll<HTMLElement>("*").forEach((element) => {
        for (const attribute of Array.from(element.attributes)) {
          if (!attribute.name.startsWith("data-i18n-")) {
            continue;
          }
          const targetAttribute = attribute.name.slice("data-i18n-".length);
          const expected =
            catalog.translations[attribute.value]?.[selectedLocale];
          if (expected === undefined) {
            errors.push(`Missing attribute translation: ${attribute.value}`);
          } else if (element.getAttribute(targetAttribute) !== expected) {
            errors.push(
              `Attribute mismatch: ${attribute.value} -> ${targetAttribute}`
            );
          }
        }
      });

      if (selectedLocale === "en") {
        const matcher = new RegExp(japanesePattern);
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT
        );
        let node = walker.nextNode();
        while (node !== null) {
          const parent = node.parentElement;
          const value = node.nodeValue?.trim() ?? "";
          const ignored =
            parent === null ||
            parent.closest("script, style, template") !== null ||
            parent.closest('[data-language-choice="ja"]') !== null ||
            parent.getClientRects().length === 0;
          if (!ignored && matcher.test(value)) {
            errors.push(`Visible Japanese remains: ${value.slice(0, 80)}`);
          }
          node = walker.nextNode();
        }
      }

      return errors;
    },
    {
      selectedLocale: locale,
      japanesePattern: JAPANESE_TEXT.source
    }
  );

  expect(issues).toEqual([]);
  if (locale === "en") {
    await expect(page.locator("[data-translation-notice]")).toBeVisible();
  } else {
    await expect(page.locator("[data-translation-notice]")).toBeHidden();
  }
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test("language choice defaults to Japanese and persists across both routes", async ({
  page
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4174") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await assertLocale(page, "ja");
  await expectNoHorizontalOverflow(page);

  const englishButton = page.locator('[data-language-choice="en"]');
  await englishButton.focus();
  await page.keyboard.press("Enter");
  await assertLocale(page, "en");
  await expectNoHorizontalOverflow(page);
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))
    .toBe("en");

  await page.reload();
  await assertLocale(page, "en");

  await page.locator(".site-switch-link").click();
  await expect(page).toHaveURL(/\/game-guide\/$/);
  await assertLocale(page, "en");
  await expectNoHorizontalOverflow(page);

  const japaneseButton = page.locator('[data-language-choice="ja"]');
  await japaneseButton.focus();
  await page.keyboard.press("Space");
  await assertLocale(page, "ja");
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY))
    .toBe("ja");

  await page.locator(".site-switch-link").click();
  await expect(page).toHaveURL("http://127.0.0.1:4174/");
  await assertLocale(page, "ja");
  expect(externalRequests).toEqual([]);
});

test("language switching remains usable when preference storage is blocked", async ({
  page
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") {
      warnings.push(message.text());
    }
  });
  await page.addInitScript(() => {
    const unavailable = (): never => {
      throw new DOMException("Storage is unavailable.", "SecurityError");
    };
    Storage.prototype.getItem = unavailable;
    Storage.prototype.setItem = unavailable;
  });

  await page.goto("/");
  await assertLocale(page, "ja");
  await page.locator('[data-language-choice="en"]').click();
  await assertLocale(page, "en");
  await expect(page.locator("[data-language-status]")).toContainText(
    /保存|save|stored|persist/i
  );
  expect(warnings.length).toBeGreaterThan(0);
});
