const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | Support";
const desc =
  "Shop MayCSS Online Store with dedicated customer care. Our concierge helps with orders, sizing, styling, and satisfaction — usually within one business day.";

const body = `Thank you for choosing to Shop MayCSS Online Store — we are here to make every step of your experience feel considered, calm, and personal. Whether you need sizing guidance, order support, product details, or a styling consultation, our concierge team responds with care and clarity, usually within one business day.

Customer satisfaction is central to how we serve you. When you Shop MayCSS Online Store, you can expect thoughtful answers, honest recommendations, and solutions that respect your time. Share your enquiry through the form below, and a real member of our team will follow up personally — never a generic reply.

From tracking a parcel to refining a capsule wardrobe, we treat every question with the same standard we bring to our collection: precision, warmth, and quiet confidence. Explore our FAQ for quick answers, or contact us for personalised help whenever you Shop MayCSS Online Store. Luxury fashion deserves luxury service, and that promise guides every conversation.

We are ready when you are. Shop MayCSS Online Store with confidence, knowing support is part of the MayCSS experience — from first browse to final fit, and every moment after.`;

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
