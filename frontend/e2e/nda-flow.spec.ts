import { test, expect } from "@playwright/test";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fillForm(page: import("@playwright/test").Page) {
  // Agreement terms (purpose, effective date are pre-filled with defaults)
  await page.fill("#governing-law", "Delaware");
  await page.fill("#jurisdiction", "New Castle, Delaware");

  // Party 1
  await page.fill("#party1-company", "Acme Inc.");
  await page.fill("#party1-name", "Alice Smith");
  await page.fill("#party1-title", "CEO");
  await page.fill("#party1-address", "alice@acme.com");

  // Party 2
  await page.fill("#party2-company", "Beta LLC");
  await page.fill("#party2-name", "Bob Jones");
  await page.fill("#party2-title", "CTO");
  await page.fill("#party2-address", "bob@beta.com");
}

// ─── Form page ────────────────────────────────────────────────────────────────

test.describe("Form page (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows page title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Mutual Non-Disclosure/i })).toBeVisible();
  });

  test("shows Prelegal brand in header", async ({ page }) => {
    await expect(page.locator("header").getByText("Prelegal")).toBeVisible();
  });

  test("shows the three form sections", async ({ page }) => {
    await expect(page.getByText("Agreement Terms")).toBeVisible();
    await expect(page.getByText("Party 1")).toBeVisible();
    await expect(page.getByText("Party 2")).toBeVisible();
  });

  test("purpose textarea is pre-filled", async ({ page }) => {
    const textarea = page.locator("#purpose");
    await expect(textarea).toHaveValue(/Evaluating whether to enter/);
  });

  test("effective date is pre-filled with today", async ({ page }) => {
    const today = new Date().toISOString().split("T")[0];
    await expect(page.locator("#effective-date")).toHaveValue(today);
  });

  test("MNDA term defaults to expires with 1 year", async ({ page }) => {
    await expect(page.locator("#mnda-term-expires")).toBeChecked();
  });

  test("confidentiality term defaults to expires with 1 year", async ({ page }) => {
    await expect(page.locator("#conf-term-expires")).toBeChecked();
  });

  test("'until terminated' radio can be selected", async ({ page }) => {
    await page.click("label[for='mnda-term-until-terminated']");
    await expect(page.locator("#mnda-term-until-terminated")).toBeChecked();
  });

  test("'in perpetuity' radio can be selected", async ({ page }) => {
    await page.click("label[for='conf-term-perpetuity']");
    await expect(page.locator("#conf-term-perpetuity")).toBeChecked();
  });

  test("submit button is labeled 'Preview Agreement'", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Preview Agreement/i })).toBeVisible();
  });
});

// ─── Form → Preview flow ──────────────────────────────────────────────────────

test.describe("Form submission → Preview page", () => {
  test("navigates to /preview after submitting filled form", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page).toHaveURL(/\/preview/);
  });

  test("preview page shows the NDA document", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toBeVisible();
  });

  test("preview shows the MNDA title", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(
      page.getByRole("heading", { name: /Mutual Non-Disclosure Agreement/i })
    ).toBeVisible();
  });

  test("preview shows Party 1 company name", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText("Acme Inc.");
  });

  test("preview shows Party 2 company name", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText("Beta LLC");
  });

  test("preview shows governing law in clause 9", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText("Delaware");
  });

  test("preview shows 'Download PDF' button", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(
      page.getByRole("button", { name: /Download PDF/i }).first()
    ).toBeVisible();
  });

  test("preview shows 'Edit' button", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(
      page.getByRole("button", { name: /Edit/i }).first()
    ).toBeVisible();
  });
});

// ─── Edit navigation ──────────────────────────────────────────────────────────

test.describe("Edit button returns to form", () => {
  test("clicking Edit in header navigates to /", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");
    await expect(page).toHaveURL(/\/preview/);

    // Click Edit button in header
    await page.click("header button:has-text('Edit')");
    await expect(page).toHaveURL("/");
  });

  test("clicking 'Edit Details' at bottom navigates to /", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("button:has-text('Preview Agreement')");

    await page.click("button:has-text('Edit Details')");
    await expect(page).toHaveURL("/");
  });
});

// ─── Radio options — document interpolation ───────────────────────────────────

test.describe("MNDA term options in document", () => {
  test("'until terminated' option appears in preview document", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("label[for='mnda-term-until-terminated']");
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText(
      "Continues until terminated"
    );
  });

  test("'expires' option appears in preview document", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    // expires is default
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText(
      "Expires 1 year(s) from Effective Date"
    );
  });

  test("'in perpetuity' confidentiality option appears in preview document", async ({ page }) => {
    await page.goto("/");
    await fillForm(page);
    await page.click("label[for='conf-term-perpetuity']");
    await page.click("button:has-text('Preview Agreement')");
    await expect(page.locator("#nda-document")).toContainText("In perpetuity");
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

test.describe("Preview page error state", () => {
  test("shows error when no data param present", async ({ page }) => {
    await page.goto("/preview");
    await expect(page.getByText(/No form data found/i)).toBeVisible();
  });

  test("shows error when data param is invalid JSON", async ({ page }) => {
    await page.goto("/preview?data=not-valid-json");
    await expect(page.getByText(/Could not parse/i)).toBeVisible();
  });

  test("error state has a return-to-form link", async ({ page }) => {
    await page.goto("/preview");
    await page.click("button:has-text('Return to form')");
    await expect(page).toHaveURL("/");
  });
});
