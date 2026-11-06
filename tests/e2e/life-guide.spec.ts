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
  for (const s of ["Your life timeline, area by area", "Right now", "What's coming", "Your story so far", "What you can do"]) await expect(page.getByRole("heading", { name: s })).toBeVisible();
  for (const a of ["Career & job", "Business & partnerships", "Love & marriage", "Family & home", "Money & wealth", "Luck & fortune"]) await expect(page.getByRole("heading", { name: a })).toBeVisible();
  await expect(page.getByText(/^Om /).first()).toBeVisible();
  await page.getByRole("link", { name: "हिन्दी" }).click();
  await expect(page.getByRole("heading", { name: "मेरी जीवन मार्गदर्शिका" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "करियर और नौकरी" })).toBeVisible();
  await page.getByRole("link", { name: "Hinglish" }).click();
  await expect(page.getByRole("heading", { name: "Meri Life Guide" })).toBeVisible();
  if (process.env.SHOTS) await page.screenshot({ path: process.env.SHOTS, fullPage: true });
});

test("choosing Hindi at onboarding shows the blueprint and the whole dashboard in Hindi", async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Kavya Joshi");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#dob").fill("1993-02-14");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("radio", { name: /Approximate/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.locator("#place").fill("Pune");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("radio", { name: "हिन्दी" }).click();
  await page.getByRole("button", { name: /Calculate my chart/ }).click();
  await expect(page.getByText("Your sky is ready.")).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: /View my Kundli/ }).click();
  await expect(page.getByRole("heading", { name: /की कॉस्मिक ब्लूप्रिंट/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "करियर और नौकरी" })).toBeVisible();
  // switch the blueprint to Hinglish
  await page.getByRole("link", { name: "Hinglish" }).first().click();
  await expect(page.getByRole("heading", { name: "Career & naukri" })).toBeVisible({ timeout: 20000 });
  await page.getByRole("link", { name: "हिन्दी" }).first().click();
  await expect(page.getByRole("heading", { name: "करियर और नौकरी" })).toBeVisible({ timeout: 20000 });
  await page.getByRole("link", { name: /मुफ़्त खाता बनाएँ/ }).click();
  await page.waitForLoadState("networkidle");
  await page.locator("#name").fill("Kavya Joshi");
  await page.locator("#email").fill(`kavya.${Date.now()}@example.com`);
  await page.locator("#password").fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding/save");
  await page.waitForLoadState("networkidle");
  await page.getByText("Store my birth details").click();
  await page.getByText(/I agree to the/).click();
  await page.getByRole("button", { name: /Save securely/ }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("link", { name: "मेरी कुंडली" })).toBeVisible();
  await expect(page.getByText("आज का संकेत")).toBeVisible();
  for (const [link, heading] of [["मेरी कुंडली", "मेरी कुंडली"], ["ग्रह-दशा समयरेखा", "ग्रह-दशा समयरेखा"], ["दैनिक संकेत", "आज आपके आकाश में"], ["कुंडली मिलान", "कुंडली मिलान"], ["सेटिंग्स", "खाता और गोपनीयता"]] as const) {
    await page.getByRole("link", { name: link }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});
