import "dotenv/config";
import { expect, test } from "@playwright/test";
import { createCipheriv, randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { SAMPLE_HAND } from "../../src/lib/readings/palm-sample";

const enc = (v: unknown) => {
  const key = Buffer.from(process.env.BIRTH_DATA_ENCRYPTION_KEY!, "base64"), iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(v), "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
};
const SHOTS = process.env.SHOT_DIR;

test("Hindi and Hinglish readings, and the palm hand map", async ({ page }) => {
  const email = `hindi.${Date.now()}@example.com`;
  await page.goto("/sign-up");
  await page.locator("#name").fill("Ananya Gupta");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("a-long-test-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/dashboard|onboarding/);

  // Numerology in Hindi
  await page.goto("/dashboard/readings/new?category=numerology");
  await page.getByText("Numerology Detailed").click();
  await page.getByLabel(/Full name at birth/).fill("Ananya Gupta");
  await page.getByLabel("Date of birth").fill("1996-02-29");
  await page.getByLabel("Report language").selectOption("hi");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/dashboard\/readings\/c/);
  await expect(page.getByRole("heading", { name: "यह रीडिंग अनलॉक करें" })).toBeVisible();
  await page.getByRole("button", { name: /सुरक्षित भुगतान करें/ }).click();
  await page.getByRole("button", { name: "Simulate success" }).click();
  await expect(page.getByRole("heading", { name: "आपके मूल अंक" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "करियर और काम" })).toBeVisible();
  await expect(page.getByText(/मूलांक-पथ/).first()).toBeVisible();
  if (SHOTS) { await page.waitForTimeout(1500); await page.screenshot({ path: `${SHOTS}/num-hi.png`, fullPage: true }); }
  const pdf = await page.request.get(page.url().split("?")[0].replace("/dashboard/readings/", "/api/readings/service/") + "/pdf");
  expect(pdf.headers()["content-type"]).toBe("application/pdf");

  // Tarot in Hinglish
  await page.goto("/dashboard/readings/new?category=tarot");
  await page.getByText("Single Card").click();
  await page.getByLabel("Report language").selectOption("hinglish");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/dashboard\/readings\/c/);
  await page.getByRole("button", { name: /secure pay kijiye/ }).click();
  await page.getByRole("button", { name: "Simulate success" }).click();
  await expect(page.getByRole("heading", { name: "Apna card chuniye" })).toBeVisible();
  await page.getByRole("button", { name: "Ulta rakha card 7", exact: true }).click();
  await page.getByRole("button", { name: "Mere cards kholiye" }).click();
  await expect(page.getByRole("heading", { name: "Aapka Sawaal" })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Practical Reflection" })).toBeVisible();

  // Palm reading in Hindi (seeded result — no AI model runs in tests)
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const u = await db.query(`select id from "user" where email=$1`, [email]);
  const id = `c${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const report = { title: "हस्तरेखा पठन", subtitle: "विस्तृत", sections: [{ id: "overview", title: "हथेली परिचय", body: "आपकी हथेली चौकोर है और मुख्य रेखाएँ गहरी हैं।" }], disclaimer: "हस्तरेखा शास्त्र एक पारंपरिक व्याख्यात्मक पद्धति है।", method: ["अवलोकन केवल फ़ोटो पर आधारित हैं।"] };
  await db.query(`insert into "ServiceReading"(id,"userId",category,"productId",tier,title,status,"encryptedInput",result,language,"generatedAt","updatedAt") values ($1,$2,'palmistry','palmistry_detailed','detailed','Palm Reading Detailed','READY',$3,$4,'hi',now(),now())`, [id, u.rows[0].id, enc({ dominant: "right", hands: "right" }), JSON.stringify({ kind: "palmistry", report, hands: [SAMPLE_HAND], dominant: "right" })]);
  await db.end();
  await page.goto(`/dashboard/readings/${id}`);
  await expect(page.getByRole("heading", { name: "आपकी हथेली का नक्शा" })).toBeVisible();
  await expect(page.getByRole("button", { name: /हृदय रेखा/ })).toBeVisible();
  await page.getByRole("button", { name: /हृदय रेखा/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "fork" })).toBeVisible();
  if (SHOTS) { await page.waitForTimeout(1800); await page.screenshot({ path: `${SHOTS}/palm-hi.png`, fullPage: true }); }

  // My Readings in the user's language (English profile) lists all three
  await page.goto("/dashboard/readings");
  await expect(page.getByText("Ready", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /अंक ज्योतिष विस्तृत|Numerology Detailed/ })).toBeVisible();
});
