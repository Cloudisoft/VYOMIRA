/**
 * Submits every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver… — Bing also feeds DuckDuckGo,
 * Yahoo, Ecosia and ChatGPT search). Run after a deploy: node scripts/brand/indexnow.cjs
 * The key file public/<key>.txt proves ownership.
 */
const fs = require("fs");
const path = require("path");
const HOST = "vyomira.cloudisoft.com";
const key = fs.readFileSync(path.join(__dirname, "indexnow-key.txt"), "utf8").trim();
(async () => {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
  });
  console.log(`IndexNow: submitted ${urlList.length} URLs → HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(accepted)" : await res.text()}`);
})();
