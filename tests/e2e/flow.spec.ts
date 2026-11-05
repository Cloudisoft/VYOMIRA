import { expect, test } from "@playwright/test";

/** Landing → Birth Details → Calculated Kundli → AI Question → Signup → Payment (test mode) → Dashboard. */
test("primary user journey", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("written in your");
  await page.getByRole("link", { name: /Reveal My Cosmic Blueprint/ }).click();
  await page.waitForLoadState("networkidle");

  await page.locator("#name").fill("Ravi Iyer");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#dob").fill("1985-11-23");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("radio", { name: /Approximate/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#place").fill("Chennai");
  await page.getByRole("option").first().click();
  await expect(page.getByText("Asia/Kolkata")).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Calculate my chart/ }).click();

  await expect(page.getByText("Your sky is ready.")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/Lahiri ayanamsa 2\d\.\d{4}°/)).toBeVisible();
  await page.getByRole("button", { name: /View my Kundli/ }).click();
  await expect(page.getByText("cosmic blueprint")).toBeVisible();
  await expect(page.getByText(/Birth time is approximate/)).toBeVisible();

  await page.getByRole("button", { name: "What does my current Mahadasha indicate?" }).click();
  await expect(page.getByText(/Mahadasha/).nth(1)).toBeVisible();

  await page.getByRole("link", { name: /Create free account/ }).click();
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Ravi Iyer");
  await page.locator("#email").fill(`ravi.${Date.now()}@example.com`);
  await page.locator("#password").fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding/save");
  await page.waitForLoadState("networkidle");
  await page.getByText("Store my birth details").click();
  await page.getByText(/I agree to the/).click();
  await page.getByRole("button", { name: /Save securely/ }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Janma Nakshatra")).toBeVisible();

  await page.goto("/dashboard/aura?q=" + encodeURIComponent("Which relationship patterns appear in my chart?"));
  await expect(page.getByRole("button", { name: /Chart factors/ })).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: /Chart factors/ }).click();
  await expect(page.getByText(/interp-1/)).toBeVisible();

  // Free unit used → second question asks for a pack
  await page.locator("#aura-q").fill("What does my current Mahadasha indicate?");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/used all your AURA messages/)).toBeVisible();

  await page.goto("/dashboard/billing?plan=starter");
  await page.getByRole("button", { name: "Buy Starter" }).click();
  await expect(page.getByText("LOCAL TEST MODE")).toBeVisible();
  await page.getByRole("button", { name: "Simulate success" }).click();
  await expect(page.getByText(/pack activated/)).toBeVisible();
  await page.reload();
  await expect(page.getByText("PAID")).toBeVisible();

  await page.goto("/dashboard/aura");
  await expect(page.getByText(/10 left/)).toBeVisible();
});

test("guardrails answer without charging", async ({ page, request }) => {
  const r = await request.post("/api/aura/preview", { data: { birth: { fullName: "X", date: "1990-01-01", time: "10:00", precision: "exact", placeId: 1273294, language: "en" }, question: "When will I die?" } });
  expect(r.ok()).toBeTruthy();
  expect((await r.json()).guard).toContain("don't predict");
  await page.goto("/");
});

test("private APIs require authentication", async ({ request }) => {
  for (const [method, url] of [["GET", "/api/charts/current"], ["POST", "/api/aura/chat"], ["GET", "/api/account/export"], ["GET", "/api/admin/config/pricing"], ["POST", "/api/payments/order"]] as const) {
    const r = method === "GET" ? await request.get(url) : await request.post(url, { data: {} });
    expect(r.status(), url).toBe(401);
  }
});

test("webhook rejects unsigned payloads", async ({ request }) => {
  const r = await request.post("/api/payments/webhook/razorpay", { data: { event: "payment.captured" } });
  expect(r.status()).toBe(400);
});
