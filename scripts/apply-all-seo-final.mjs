/**
 * Apply the latest validated SEO copy to every key page, then write pages.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesPath = join(__dirname, "..", "data", "pages.json");
const KW = "Shop MayCSS Online Store";

const pages = JSON.parse(readFileSync(pagesPath, "utf8"));
const byId = Object.fromEntries(pages.map((p) => [p.id, p]));

function setSeo(p, metaTitle, metaDescription, extraKeywords = []) {
  p.seo = {
    ...(p.seo || {}),
    metaTitle,
    metaDescription,
    keywords: [KW, ...extraKeywords.filter((k) => k !== KW)],
    ogImage: p.seo?.ogImage || p.bannerImage || "",
  };
  p.lastUpdated = "2026-07-19";
}

function setRichtext(p, id, heading, body) {
  const b = p.blocks.find((x) => x.id === id);
  if (!b) return;
  if (heading) b.heading = heading;
  b.body = body;
}

// HOME
{
  const p = byId.home;
  setSeo(
    p,
    "Shop MayCSS Online Store | Luxury Fashion",
    "Shop MayCSS Online Store for curated luxury fashion. Discover premium apparel, timeless design, free shipping over $75, and authenticity you can trust.",
    ["luxury fashion", "curated clothing", "designer fashion online"],
  );
  const hero = p.blocks.find((b) => b.id === "blk_home_hero");
  if (hero) {
    hero.subheading =
      "Welcome to Shop MayCSS Online Store — where curated luxury fashion meets timeless design. Explore premium apparel selected for craft, fit, and quiet confidence.";
  }
  const seoBlk = p.blocks.find((b) => b.id === "blk_home_seo_copy");
  if (seoBlk) {
    seoBlk.body =
      "Discover why discerning shoppers choose Shop MayCSS Online Store for premium fashion online. We curate independent designers and heritage maisons with a focus on fabric integrity, considered silhouettes, and lasting wear. Complimentary shipping is available on qualifying orders, authenticity is guaranteed on every piece, and our team offers personal styling when you want a second eye. Whether you are building a capsule wardrobe or searching for a signature statement, MayCSS is your destination for minimalist luxury that feels effortless, elevated, and entirely your own. Explore the collection, save favourites, and shop with confidence knowing every detail has been vetted for quality and provenance.";
  }
}

// SHOP
{
  const p = byId.shop;
  p.hero =
    "Welcome to Shop MayCSS Online Store — curated premium fashion and minimalist luxury apparel, organised the way we shop.";
  setSeo(
    p,
    "Shop MayCSS Online Store | Premium Edit",
    "Shop MayCSS Online Store for curated premium fashion and minimalist luxury apparel — high-quality pieces chosen for craft, fit, and lasting style.",
    ["shop luxury fashion", "designer clothing online", "MayCSS collection"],
  );
  setRichtext(
    p,
    "blk_shop_intro",
    "Curated Premium Fashion for the Modern Wardrobe",
    `Welcome to Shop MayCSS Online Store, where curated premium fashion meets quiet confidence. Explore our minimalist luxury edit of high-quality apparel — refined silhouettes, exceptional textiles, and pieces designed to elevate the modern wardrobe without excess.

Every look in this collection is chosen for craftsmanship and longevity. From investment outerwear to elevated essentials and finishing accessories, you will find clothing that moves from day to evening with ease. We partner with independent ateliers and heritage houses so quality remains non-negotiable when you Shop MayCSS Online Store.

Browse by category to discover women’s and men’s edits, dresses, knitwear, and refined layers built for real life. Complimentary shipping applies on qualifying orders, and authenticity is guaranteed on every purchase. Whether you are refining a capsule wardrobe or seeking a signature statement, Shop MayCSS Online Store offers considered fashion with precise fit and enduring polish.

Discover new arrivals and timeless staples as you Shop MayCSS Online Store — sophisticated, minimalist luxury ready for everyday elegance.`,
  );
}

// SALE
{
  const p = byId.sale;
  p.hero =
    "Discover exclusive savings when you Shop MayCSS Online Store — limited-time luxury markdowns, while they last.";
  setSeo(
    p,
    "Shop MayCSS Online Store | Sale Edit",
    "Shop MayCSS Online Store for exclusive luxury sale discounts. Limited-time markdowns on curated fashion — elegant pieces at investment-friendly prices.",
    ["sale", "luxury fashion sale", "markdowns"],
  );
  setRichtext(
    p,
    "blk_sale_intro",
    "Exclusive Discounts on Luxury Fashion",
    `Discover exclusive savings when you Shop MayCSS Online Store — The Sale Edit brings limited-time markdowns on curated luxury fashion without compromising craft or design. Act now while refined outerwear, elevated dresses, tailored layers, and finishing accessories remain available at exceptional value.

These are considered wardrobe investments, not fleeting trends. Each piece is selected for fabric integrity, precise fit, and lasting wear, then offered for a short window that rewards decisive shoppers. Popular sizes move quickly, so if a look has been on your list, this is the moment to claim it. Enjoy the same authenticity guarantee and thoughtful service you expect whenever you Shop MayCSS Online Store.

Review sale details carefully, confirm your size guide, and complete checkout while the edit lasts. Exclusive discounts are temporary; the confidence of wearing MayCSS is not. Secure your favourites today and elevate your wardrobe with high-end pieces priced for this season only — then Shop MayCSS Online Store again for new arrivals once the sale ends.

Limited stock. Elevated style. Shop MayCSS Online Store before The Sale Edit closes.`,
  );
}

// ABOUT
{
  const p = byId.about;
  p.hero =
    "Shop MayCSS Online Store to experience our mission: timeless design, uncompromising quality, and fashion for people who care about the difference between good and exceptional.";
  setSeo(
    p,
    "Shop MayCSS Online Store | About Us",
    "Shop MayCSS Online Store and discover our story — curated premium fashion, uncompromising quality, and a vision built on craft, integrity, and quiet luxury.",
    ["about MayCSS", "curated fashion", "luxury boutique"],
  );
  // Replace first richtext blocks with about story if present
  const intro = p.blocks.find((b) => b.type === "richtext");
  if (intro) {
    intro.heading = "Our Story";
    intro.body = `MayCSS began with a simple belief: fashion should feel considered, lasting, and true. When you Shop MayCSS Online Store, you enter a curated world of premium pieces chosen for craft, fit, and quiet confidence — never noise, never excess.

Our story is rooted in partnership with independent ateliers and heritage houses that share our standards. We ask three questions of every piece: Is it made to last? Does it honour the people who make it? Would we wear it ourselves? If the answer is not yes to all three, it does not belong in our edit. That discipline is how we protect quality — and how we earn your trust.

We envision a wardrobe that moves with real life: refined silhouettes, exceptional textiles, and essentials that feel as relevant tomorrow as they do today. Shop MayCSS Online Store to experience fashion that values provenance as much as presence, and substance as much as style.

Transparency, authenticity, and personal care guide everything we do. From the first browse to the final fit, our commitment is clear: elevate dressing without compromising integrity. Discover the MayCSS difference — then Shop MayCSS Online Store with confidence, knowing every piece reflects a vision of luxury that is calm, enduring, and entirely intentional.

This is our promise. This is MayCSS. Shop MayCSS Online Store for fashion that lasts beyond the season.`;
  }
}

// FAQ
{
  const p = byId.faq;
  p.hero =
    "Before you Shop MayCSS Online Store, browse clear answers on shipping, returns, sizing, and quality.";
  setSeo(
    p,
    "Shop MayCSS Online Store | FAQ Help",
    "Shop MayCSS Online Store with confidence. Quick answers on shipping, returns, sizing, authenticity, and product quality from our help centre.",
    ["FAQ", "shipping", "returns", "MayCSS help"],
  );
  let intro = p.blocks.find((b) => b.id === "blk_faq_intro");
  if (!intro) {
    intro = {
      id: "blk_faq_intro",
      type: "richtext",
      layout: {
        alignment: "center",
        width: "medium",
        columnCount: 1,
        padding: "md",
      },
      heading: "Shopping Guidance from MayCSS",
      headingLevel: 2,
      body: "",
      alignment: "center",
    };
    p.blocks.unshift(intro);
  }
  intro.body = `Before you Shop MayCSS Online Store, browse these clear answers on shipping, returns, sizing, and quality — written to keep your experience calm, informed, and effortless. Our help centre covers delivery times, international shipping, returns, exchanges, payment methods, and how we guarantee product quality. If your question is not listed, our concierge team is ready to help within one business day when you Shop MayCSS Online Store.`;
  const faq = p.blocks.find((b) => b.type === "faq");
  if (faq) {
    faq.items = [
      {
        q: "How long does shipping take when I Shop MayCSS Online Store?",
        a: "Standard shipping typically arrives in 3–5 business days. Express shipping is 1–2 business days. Orders over $75 usually ship free. Tracking is emailed once your parcel leaves our studio.",
      },
      {
        q: "What is your return policy?",
        a: "Unworn items with original tags can be returned within 30 days of delivery for a full refund to your original payment method. Sale items are final unless faulty. See our Refund & Returns Policy for full details.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes — we ship to over 40 countries when you Shop MayCSS Online Store. International orders may be subject to customs duties in the destination country, which are the customer’s responsibility.",
      },
      {
        q: "How do I know what size to order?",
        a: "Every product page includes a size guide. If you are between sizes, size up for outerwear and down for knitwear. Our support team can also advise on fit before you order.",
      },
      {
        q: "How do you ensure product quality and authenticity?",
        a: "Every MayCSS product is sourced directly from the brand or an authorised distributor. Authenticity is guaranteed, and we vet materials, construction, and finish before pieces appear in Shop MayCSS Online Store.",
      },
      {
        q: "How can I track my order?",
        a: "Once your order ships, we email a tracking link. You can also view orders under My Account. Contact support if tracking has not updated within two business days of dispatch.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept major cards and other secure checkout methods shown at payment. We never store your full card number; payments are processed by PCI-compliant providers.",
      },
    ];
  }
}

// PRIVACY
{
  const p = byId["privacy-policy"];
  p.hero =
    "Your privacy matters when you Shop MayCSS Online Store — clear policies for trust and transparency.";
  setSeo(
    p,
    "Shop MayCSS Online Store | Privacy",
    "Shop MayCSS Online Store with peace of mind. Learn how we collect, use, and protect your personal data with clear, trustworthy privacy practices.",
    ["privacy policy", "data protection", "MayCSS privacy"],
  );
  let intro = p.blocks.find((b) => b.id === "blk_privacy_intro");
  if (!intro) {
    intro = {
      id: "blk_privacy_intro",
      type: "richtext",
      layout: {
        alignment: "center",
        width: "full",
        columnCount: 1,
        padding: "md",
      },
      heading: "Your Privacy at MayCSS",
      headingLevel: 2,
      body: "",
      alignment: "left",
    };
    p.blocks.unshift(intro);
  }
  intro.body = `Your privacy matters when you Shop MayCSS Online Store. This Privacy Policy explains what information we collect, why we use it, and how we protect it. We wrote it to be clear, transparent, and easy to understand — so you can shop luxury fashion online with confidence.

Information We Collect includes details you provide at checkout, account information, site activity, and technical data used to keep the site secure. How We Use Your Data: to process orders when you Shop MayCSS Online Store, send updates, personalise your experience, and send marketing only if you opt in. We do not sell your personal information.

Security: payments on Shop MayCSS Online Store are processed by PCI-DSS compliant providers over encrypted connections. We never store your full card number. You may request a copy of your data, corrections, or account deletion by emailing privacy@maycss.example. Continued use of Shop MayCSS Online Store after policy updates means you accept the revised policy.`;
}

// REFUND
{
  const p = byId["refund-policy"];
  p.hero =
    "Simple, fair returns when you Shop MayCSS Online Store — because you should love what you bought.";
  setSeo(
    p,
    "Refund & Returns Policy | Shop MayCSS Online Store",
    "Need to return an item? Learn about our easy returns and refund process at Shop MayCSS Online Store. Your satisfaction is our priority.",
    ["refund policy", "returns", "exchanges"],
  );
  let intro = p.blocks.find((b) => b.id === "blk_refund_intro");
  if (!intro) {
    intro = {
      id: "blk_refund_intro",
      type: "richtext",
      layout: {
        alignment: "center",
        width: "full",
        columnCount: 1,
        padding: "md",
      },
      heading: "Fair Returns You Can Trust",
      headingLevel: 2,
      body: "",
      alignment: "left",
    };
    p.blocks.unshift(intro);
  }
  intro.body = `Simple, fair returns — because you should love what you bought when you Shop MayCSS Online Store. This Refund & Returns Policy explains eligibility, how to send an item back, and when your refund is issued.

Return Eligibility: items must be unworn, unwashed, unused, with original tags and packaging; request within 30 days of delivery. Sale items are final unless faulty.

How to Initiate a Return: sign in, open My Orders, choose Return, and use the prepaid label we email for eligible orders when you Shop MayCSS Online Store. Pack securely and keep your drop-off receipt.

Refund Timeline: approved refunds return to your original payment method within 5–10 business days after we receive the return. Shipping is non-refundable unless the item was faulty.

Exchanges and damaged items: start a return then place a new order, or email hello@maycss.example within 7 days with a photo for replacements. Shop MayCSS Online Store with confidence — returns are clear, calm, and fair. Questions? Contact support when you Shop MayCSS Online Store.`;
}

// CONTACT
{
  const p = byId.contact;
  p.hero =
    "Thank you for choosing to Shop MayCSS Online Store — our concierge team is ready to help within one business day.";
  setSeo(
    p,
    "Shop MayCSS Online Store | Support",
    "Shop MayCSS Online Store with dedicated customer care. Our concierge helps with orders, sizing, styling, and satisfaction — usually within one business day.",
    ["customer support", "contact", "concierge"],
  );
  let intro = p.blocks.find((b) => b.id === "blk_contact_intro");
  if (!intro) {
    intro = {
      id: "blk_contact_intro",
      type: "richtext",
      layout: {
        alignment: "center",
        width: "medium",
        columnCount: 1,
        padding: "md",
      },
      heading: "Dedicated Customer Support",
      headingLevel: 2,
      body: "",
      alignment: "left",
    };
    p.blocks.unshift(intro);
  }
  intro.body = `Thank you for choosing to Shop MayCSS Online Store — we are here to make every step of your experience feel considered, calm, and personal. Whether you need sizing guidance, order support, product details, or a styling consultation, our concierge team responds with care and clarity, usually within one business day.

Customer satisfaction is central to how we serve you. When you Shop MayCSS Online Store, you can expect thoughtful answers, honest recommendations, and solutions that respect your time. Share your enquiry through the form below, and a real member of our team will follow up personally — never a generic reply.

From tracking a parcel to refining a capsule wardrobe, we treat every question with the same standard we bring to our collection: precision, warmth, and quiet confidence. Explore our FAQ for quick answers, or contact us for personalised help whenever you Shop MayCSS Online Store. Luxury fashion deserves luxury service, and that promise guides every conversation.

We are ready when you are. Shop MayCSS Online Store with confidence, knowing support is part of the MayCSS experience — from first browse to final fit, and every moment after.`;
}

writeFileSync(pagesPath, JSON.stringify(pages, null, 2) + "\n");
console.log("Updated", pagesPath);
for (const id of [
  "home",
  "shop",
  "sale",
  "about",
  "faq",
  "privacy-policy",
  "refund-policy",
  "contact",
]) {
  const p = byId[id];
  console.log(
    id,
    "→",
    p.seo.metaTitle,
    `(${p.seo.metaTitle.length}c)`,
    p.seo.metaDescription.length + "c desc",
  );
}
