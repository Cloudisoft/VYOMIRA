import { expect, test } from "@playwright/test";

test("homepage works on mobile without horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  // Mobile gets the CSS planet, not WebGL
  expect(await page.locator("canvas").count()).toBeLessThanOrEqual(1);
});

test("onboarding is usable on mobile", async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Mobile");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator("#dob")).toBeVisible();
});
