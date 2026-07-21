/**
 * Test Macy's Discover browse XAPI for category product IDs.
 * Usage: node scripts/test-macys-discover.mjs
 */
async function discover(pathname, id, page = 1) {
  const path = page > 1 ? `${pathname}/Pageindex/${page}` : pathname;
  const qs =
    `pathname=${encodeURIComponent(path)}` +
    `&id=${id}` +
    `&_navigationType=BROWSE&_regionCode=US&currencyCode=USD&sortBy=NEW_ITEMS`;
  const urls = [
    `https://www.macys.com/xapi/discover/v1/page?${qs}`,
    `https://r.jina.ai/http://www.macys.com/xapi/discover/v1/page?${qs}`,
  ];
  for (const url of urls) {
    const label = url.includes("jina") ? "jina" : "direct";
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json,text/plain,*/*",
        },
        signal: AbortSignal.timeout(45000),
      });
      const t = await r.text();
      const ids = [
        ...t.matchAll(/"productId"\s*:\s*"?(\d{6,})"?/g),
      ].map((m) => m[1]);
      const uniq = [...new Set(ids)];
      console.log(
        label,
        r.status,
        path,
        "ids",
        uniq.length,
        "sample",
        uniq.slice(0, 5).join(","),
      );
      if (uniq.length) return uniq;
    } catch (e) {
      console.log(label, "err", e instanceof Error ? e.message : e);
    }
  }
  return [];
}

const tests = [
  ["/shop/womens/clothing", "188851"],
  ["/shop/womens/clothing/dresses", "5449"],
  ["/shop/womens/clothing/dresses/formal", "339414"],
  ["/shop/womens/clothing/dresses/occasion/wedding-guest", "280756"],
  ["/shop/womens/clothing/dresses/cocktail-party", "339107"],
  ["/shop/womens/clothing/dresses/casual", "298457"],
  ["/shop/womens/clothing/dresses/work", "339346"],
  ["/shop/womens/clothing/jeans", "3111"],
  ["/shop/womens/clothing/jeans/wide-leg", "339584"],
  ["/shop/womens/clothing/jeans/straight-leg", "72589"],
  ["/shop/womens/clothing/jeans/barrel-leg", "350066"],
  ["/shop/womens/clothing/jeans/skinny", "66442"],
];

for (const [path, id] of tests) {
  console.log("\n===", path, id);
  await discover(path, id, 1);
}
