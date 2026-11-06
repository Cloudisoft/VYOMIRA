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
