const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | FAQ Help";
const desc =
  "Shop MayCSS Online Store with confidence. Quick answers on shipping, returns, sizing, authenticity, and product quality from our help centre.";

const body = `Before you Shop MayCSS Online Store, browse these clear answers on shipping, returns, sizing, and quality — written to keep your experience calm, informed, and effortless.

How long does shipping take?
Standard delivery typically arrives in 3–5 business days. Express options are usually 1–2 business days. Qualifying orders often ship free, and tracking is emailed once your parcel leaves our studio.

What is your return policy?
Unworn items with original tags may be returned within 30 days of delivery for a refund to your original payment method. Sale items are final unless faulty. Full details are in our Refund & Returns Policy.

Do you ship internationally?
Yes. When you Shop MayCSS Online Store, we ship to many destinations worldwide. International orders may incur customs duties in the destination country, which remain the customer’s responsibility.

How do I choose the right size?
Every product page includes a size guide. If you are between sizes, size up for outerwear and down for knitwear. Our support team can also advise on fit before you order.

How do you ensure quality and authenticity?
Every piece is sourced from the brand or an authorised partner. Materials, construction, and finish are vetted before items appear when you Shop MayCSS Online Store — authenticity guaranteed.

How can I track my order?
Once shipped, we email a tracking link. You can also review orders under My Account. If tracking has not updated within two business days of dispatch, contact support.

Still need help?
Our concierge team is ready with warm, precise answers. Explore more tips above, then Shop MayCSS Online Store knowing help is always close at hand.`;

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
