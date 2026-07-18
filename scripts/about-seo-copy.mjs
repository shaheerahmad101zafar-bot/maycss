const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | About Us";
const desc =
  "Shop MayCSS Online Store and discover our story — curated premium fashion, uncompromising quality, and a vision built on craft, integrity, and quiet luxury.";

const body = `MayCSS began with a simple belief: fashion should feel considered, lasting, and true. When you Shop MayCSS Online Store, you enter a curated world of premium pieces chosen for craft, fit, and quiet confidence — never noise, never excess.

Our story is rooted in partnership with independent ateliers and heritage houses that share our standards. We ask three questions of every piece: Is it made to last? Does it honour the people who make it? Would we wear it ourselves? If the answer is not yes to all three, it does not belong in our edit. That discipline is how we protect quality — and how we earn your trust.

We envision a wardrobe that moves with real life: refined silhouettes, exceptional textiles, and essentials that feel as relevant tomorrow as they do today. Shop MayCSS Online Store to experience fashion that values provenance as much as presence, and substance as much as style.

Transparency, authenticity, and personal care guide everything we do. From the first browse to the final fit, our commitment is clear: elevate dressing without compromising integrity. Discover the MayCSS difference — then Shop MayCSS Online Store with confidence, knowing every piece reflects a vision of luxury that is calm, enduring, and entirely intentional.

This is our promise. This is MayCSS. Shop MayCSS Online Store for fashion that lasts beyond the season.`;

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
