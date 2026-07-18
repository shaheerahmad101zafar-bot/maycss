const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | Sale Edit";
const desc =
  "Shop MayCSS Online Store for exclusive luxury sale discounts. Limited-time markdowns on curated fashion — elegant pieces at investment-friendly prices.";

const body = `Discover exclusive savings when you Shop MayCSS Online Store — The Sale Edit brings limited-time markdowns on curated luxury fashion without compromising craft or design. Act now while refined outerwear, elevated dresses, tailored layers, and finishing accessories remain available at exceptional value.

These are considered wardrobe investments, not fleeting trends. Each piece is selected for fabric integrity, precise fit, and lasting wear, then offered for a short window that rewards decisive shoppers. Popular sizes move quickly, so if a look has been on your list, this is the moment to claim it. Enjoy the same authenticity guarantee and thoughtful service you expect whenever you Shop MayCSS Online Store.

Review sale details carefully, confirm your size guide, and complete checkout while the edit lasts. Exclusive discounts are temporary; the confidence of wearing MayCSS is not. Secure your favourites today and elevate your wardrobe with high-end pieces priced for this season only — then Shop MayCSS Online Store again for new arrivals once the sale ends.

Limited stock. Elevated style. Shop MayCSS Online Store before The Sale Edit closes.`;

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
