import { expect, test } from "@playwright/test";

/** New reading modules: landing → sign-up → numerology (pay, report, PDF) → tarot (pick, flip, report) → My Readings → Insights → AURA mode. */
test("numerology and tarot purchase journeys", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Four Paths to Self-Discovery/ })).toBeVisible();
  await page.getByRole("heading", { name: /Four Paths to Self-Discovery/ }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/shot-paths.png" });
  await page.goto("/tarot");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ask a question");
  await expect(page.getByText("LAUNCH PRICE").first()).toBeVisible();

  await page.goto("/sign-up");
  await page.locator("#name").fill("Meera Nair");
  await page.locator("#email").fill(`meera.${Date.now()}@example.com`);
  await page.locator("#password").fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/dashboard|onboarding/);

  // Numerology
  await page.goto("/dashboard/readings/new?category=numerology");
  await page.getByText("Numerology Complete").click();
  await page.getByLabel("Full name at birth").fill("Meera Nair");
  await page.getByLabel("Date of birth").fill("1994-09-21");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/dashboard\/readings\/c/);
  await page.getByRole("button", { name: /Pay ₹249 securely/ }).click();
  await expect(page.getByText("LOCAL TEST MODE")).toBeVisible();
  await page.getByRole("button", { name: "Simulate success" }).click();
  await expect(page.getByRole("heading", { name: "Your Core Numbers" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Lo Shu Grid" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Lo Shu grid" })).toBeVisible();
  await expect(page.getByText(/Pythagorean/).first()).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/shot-numerology.png", fullPage: true });
  const pdf = await page.request.get(page.url().split("?")[0].replace("/dashboard/readings/", "/api/readings/service/") + "/pdf");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");

  // Tarot
  await page.goto("/dashboard/readings/new?category=tarot");
  await page.getByText("Three Cards — Past, Present, Future").click();
  await page.getByLabel("Area of life").selectOption("career");
  await page.getByLabel(/Your question/).fill("Should I change teams this year?");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/dashboard\/readings\/c/);
  await page.getByRole("button", { name: /Pay ₹79 securely/ }).click();
  await page.getByRole("button", { name: "Simulate success" }).click();
  await expect(page.getByRole("heading", { name: "Choose 3 cards" })).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/shot-picker.png" });
  for (const n of [4, 11, 17]) await page.getByRole("button", { name: `Face-down card ${n}`, exact: true }).click();
  await page.getByRole("button", { name: "Reveal my cards" }).click();
  await expect(page.getByRole("heading", { name: /^Past — / })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "What the Cards Say Together" })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "test-results/shot-tarot.png", fullPage: true });
  await expect(page.getByRole("img", { name: /of |The |Strength|Justice|Death|Temperance|Judgement/ }).first()).toBeVisible();

  // My Readings + Insights + AURA mode selector
  await page.goto("/dashboard/readings");
  await expect(page.getByRole("link", { name: "Numerology Complete" })).toBeVisible();
  await expect(page.getByText("Ready").first()).toBeVisible();
  await page.getByRole("link", { name: "Tarot", exact: true }).click();
  await expect(page.getByRole("link", { name: "Numerology Complete" })).toHaveCount(0);
  await page.goto("/dashboard/insights");
  await expect(page.getByRole("heading", { name: "Career Insight" })).toBeVisible();
  await expect(page.getByText(/ drew /).first()).toBeVisible();
  await page.screenshot({ path: "test-results/shot-insights.png", fullPage: true });
  await page.goto("/dashboard/aura?mode=tarot");
  await expect(page.getByLabel("Answer from")).toHaveValue("tarot");
});
