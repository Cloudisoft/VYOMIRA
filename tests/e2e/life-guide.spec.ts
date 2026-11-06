import { expect, test } from "@playwright/test";

/** A signed-in user with a saved chart sees the plain-language Life Guide (past, present, future, remedies). */
test("life guide explains past, present, future and what to do", async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Meera Shah");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#dob").fill("1992-04-18");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("radio", { name: /Approximate/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#place").fill("Ahmedabad");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Calculate my chart/ }).click();
  await expect(page.getByText("Your sky is ready.")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /View my Kundli/ }).click();
  await page.getByRole("link", { name: /Create free account/ }).click();
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Meera Shah");
  await page.locator("#email").fill(`meera.${Date.now()}@example.com`);
  await page.locator("#password").fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding/save");
  await page.waitForLoadState("networkidle");
  await page.getByText("Store my birth details").click();
  await page.getByText(/I agree to the/).click();
  await page.getByRole("button", { name: /Save securely/ }).click();
  await page.waitForURL("**/dashboard");

  await expect(page.getByText("Your story in simple words")).toBeVisible();
  await page.getByRole("link", { name: /Open my Life Guide/ }).click();
  await expect(page.getByRole("heading", { name: "My Life Guide" })).toBeVisible();
  for (const s of ["Your story so far", "Right now", "What's coming", "How each part of life looks now", "What you can do"]) await expect(page.getByRole("heading", { name: s })).toBeVisible();
  await expect(page.getByText(/^Om /).first()).toBeVisible();
  if (process.env.SHOTS) await page.screenshot({ path: process.env.SHOTS, fullPage: true });
});
