const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | Premium Edit";
const desc =
  "Shop MayCSS Online Store for curated premium fashion and minimalist luxury apparel — high-quality pieces chosen for craft, fit, and lasting style.";

const body = `Welcome to Shop MayCSS Online Store, where curated premium fashion meets quiet confidence. Explore our minimalist luxury edit of high-quality apparel — refined silhouettes, exceptional textiles, and pieces designed to elevate the modern wardrobe without excess.

Every look in this collection is chosen for craftsmanship and longevity. From investment outerwear to elevated essentials and finishing accessories, you will find clothing that moves from day to evening with ease. We partner with independent ateliers and heritage houses so quality remains non-negotiable when you Shop MayCSS Online Store.

Browse by category to discover women’s and men’s edits, dresses, knitwear, and refined layers built for real life. Complimentary shipping applies on qualifying orders, and authenticity is guaranteed on every purchase. Whether you are refining a capsule wardrobe or seeking a signature statement, Shop MayCSS Online Store offers considered fashion with precise fit and enduring polish.

Discover new arrivals and timeless staples as you Shop MayCSS Online Store — sophisticated, minimalist luxury ready for everyday elegance.`;

const words = body.trim().split(/\s+/).length;
const escaped = KW.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const kwCount = (body.match(new RegExp(escaped, "gi")) || []).length;
const firstPara = body.split(/\n\n/)[0];

console.log(
  JSON.stringify(
    {
      titleLen: title.length,
      titleOk: title.length >= 30 && title.length <= 60 && title.includes(KW),
      descLen: desc.length,
      descOk: desc.length >= 120 && desc.length <= 160 && desc.includes(KW),
      words,
      wordsOk: words >= 160,
      kwCount,
      firstParaHasKw: firstPara.includes(KW),
    },
    null,
    2,
  ),
);

export { title, desc, body, KW };
