import { expect, test } from "@playwright/test";

const ldTypes = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap((m) => { const d = JSON.parse(m[1]); return (Array.isArray(d) ? d : [d]).map((x) => x["@type"]); });

test("public pages expose canonical URLs and valid structured data", async ({ request }) => {
  const home = await (await request.get("/")).text();
  expect(ldTypes(home)).toEqual(expect.arrayContaining(["Organization", "WebSite", "WebApplication", "FAQPage"]));
  expect(home).toMatch(/<link rel="canonical" href="[^"]+"/);
  const art = await (await request.get("/learn/sade-sati")).text();
  expect(ldTypes(art)).toEqual(expect.arrayContaining(["Article", "BreadcrumbList", "FAQPage"]));
  expect(art).toContain("<h2>Is Sade Sati always bad?</h2>");
});

test("answer-engine files and crawler rules", async ({ request }) => {
  const llms = await request.get("/llms.txt");
  expect(llms.headers()["content-type"]).toContain("text/plain");
  const t = await llms.text();
  expect(t).toMatch(/^# VYOMIRA/);
  expect(t).toContain("/learn/what-is-janam-kundli");
  expect((await (await request.get("/llms-full.txt")).text()).length).toBeGreaterThan(5000);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("GPTBot");
  expect(robots).toContain("Disallow: /dashboard");
  expect((await (await request.get("/sitemap.xml")).text()).match(/<url>/g)!.length).toBeGreaterThan(20);
});

test("favicon, app icons, manifest and social share images", async ({ request }) => {
  const home = await (await request.get("/")).text();
  expect(home).toMatch(/<link rel="icon" href="\/favicon\.ico/);
  expect(home).toMatch(/<link rel="apple-touch-icon"/);
  expect(home).toContain('<link rel="manifest" href="/manifest.webmanifest"/>');
  expect(home).toMatch(/<meta property="og:image" content="[^"]+\/og\/default\.jpg"/);
  expect(home).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
  const art = await (await request.get("/learn/sade-sati")).text();
  expect(art).toMatch(/og:image" content="[^"]+\/og\/learn-sade-sati\.jpg"/);
  for (const u of ["/favicon.ico", "/apple-icon.png", "/manifest.webmanifest", "/og/default.jpg", "/icons/icon-192.png", "/icons/icon-512.png"]) expect((await request.get(u)).status(), u).toBe(200);
  const og = await request.get("/og/default.jpg");
  expect((await og.body()).length).toBeLessThan(300_000); // WhatsApp preview limit
});
