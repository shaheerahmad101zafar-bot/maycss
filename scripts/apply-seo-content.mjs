/**
 * Apply SEO content for all key pages, validate against auditor rules, write pages.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesPath = join(__dirname, "..", "data", "pages.json");
const KW = "Shop MayCSS Online Store";

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function extractBody(blocks, hero) {
  const parts = [];
  if (hero?.trim()) parts.push(hero.trim());
  for (const b of blocks) {
    switch (b.type) {
      case "richtext":
        if (b.heading) parts.push(b.heading);
        parts.push(b.body);
        break;
      case "hero":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "cta":
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "faq":
        for (const it of b.items) parts.push(it.q, it.a);
        break;
      case "features":
        for (const it of b.items) parts.push(it.title, it.body);
        break;
      case "editorial":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading, b.body);
        break;
      case "splitbanner":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "banner":
        if (b.eyebrow) parts.push(b.eyebrow);
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "countdown":
        parts.push(b.heading);
        if (b.body) parts.push(b.body);
        break;
      case "categorygrid":
        if (b.eyebrow) parts.push(b.eyebrow);
        if (b.heading) parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "productgrid":
        if (b.heading) parts.push(b.heading);
        break;
      case "contactform":
        if (b.heading) parts.push(b.heading);
        if (b.subheading) parts.push(b.subheading);
        break;
      case "image":
        if (b.alt) parts.push(b.alt);
        if (b.caption) parts.push(b.caption);
        break;
      case "columns":
        for (const c of b.columns) {
          if (c.heading) parts.push(c.heading);
          parts.push(c.body);
        }
        break;
    }
  }
  return parts.filter(Boolean).join(" ");
}

function checkMeta(label, title, desc) {
  const issues = [];
  if (title.length < 30 || title.length > 60)
    issues.push(`title ${title.length} chars (need 30–60)`);
  if (!title.includes(KW)) issues.push("title missing KW");
  if (desc.length < 120 || desc.length > 160)
    issues.push(`desc ${desc.length} chars (need 120–160)`);
  if (!desc.includes(KW)) issues.push("desc missing KW");
  return issues;
}

const SEO = {
  home: {
    metaTitle: "Shop MayCSS Online Store | Luxury Fashion",
    metaDescription:
      "Shop MayCSS Online Store for curated luxury fashion. Discover premium apparel, timeless design, free shipping over $75, and authenticity you can trust.",
    keywords: [KW, "luxury fashion", "curated clothing", "designer fashion online", "premium womenswear"],
  },
  shop: {
    metaTitle: "Shop MayCSS Online Store | Premium Edit",
    metaDescription:
      "Shop MayCSS Online Store to explore curated premium fashion, minimalist luxury apparel, and high-quality pieces chosen for craft, fit, and lasting style.",
    keywords: [KW, "shop luxury fashion", "designer clothing online", "MayCSS collection"],
  },
  sale: {
    metaTitle: "Shop MayCSS Online Store | Sale Edit",
    metaDescription:
      "Shop MayCSS Online Store for exclusive sale discounts on luxury fashion. Limited-time markdowns on curated pieces — refined style at investment-friendly prices.",
    keywords: [KW, "sale", "luxury fashion sale", "markdowns"],
  },
  about: {
    metaTitle: "Shop MayCSS Online Store | About Us",
    metaDescription:
      "Shop MayCSS Online Store and discover our story: curated premium fashion, quality assurance, and a brand built on craft, integrity, and trust.",
    keywords: [KW, "about MayCSS", "curated fashion", "luxury boutique"],
  },
  faq: {
    metaTitle: "Shop MayCSS Online Store | FAQ Help",
    metaDescription:
      "Shop MayCSS Online Store with confidence. Find clear answers on shipping, returns, sizing, authenticity, and product quality from our help centre.",
    keywords: [KW, "FAQ", "shipping", "returns", "MayCSS help"],
  },
  "privacy-policy": {
    metaTitle: "Shop MayCSS Online Store | Privacy",
    metaDescription:
      "Shop MayCSS Online Store with peace of mind. Read how we collect, use, and protect your personal information with clear, trustworthy privacy practices.",
    keywords: [KW, "privacy policy", "data protection", "MayCSS privacy"],
  },
  "refund-policy": {
    metaTitle: "Shop MayCSS Online Store | Returns",
    metaDescription:
      "Shop MayCSS Online Store with a fair 30-day returns policy. Learn how refunds, exchanges, and damaged-item replacements work for every order.",
    keywords: [KW, "refund policy", "returns", "exchanges"],
  },
  contact: {
    metaTitle: "Shop MayCSS Online Store | Support",
    metaDescription:
      "Shop MayCSS Online Store with dedicated customer support. Our concierge team helps with orders, styling, and satisfaction — usually within one business day.",
    keywords: [KW, "customer support", "contact", "concierge"],
  },
};

const BODY = {
  homeHeroSub:
    "Welcome to Shop MayCSS Online Store — where curated luxury fashion meets timeless design. Explore premium apparel selected for craft, fit, and quiet confidence.",
  homeEditorial:
    "At Shop MayCSS Online Store, we partner with makers who share our values — fair wages, responsible sourcing, and techniques passed down through generations. Every MayCSS edit is chosen for quality, provenance, and the kind of quiet luxury that never needs to announce itself. From sculptural outerwear to refined finishing pieces, our collection is built for wardrobes that last beyond a single season. Browse new arrivals, discover heritage houses, and find investment clothing designed to elevate everyday dressing with intention and ease.",
  homeSplit:
    "Investment pieces need not shout. At Shop MayCSS Online Store we favour clean lines, exceptional fabrics, and a palette that works harder — so your wardrobe does too. Explore looks that feel modern today and essential tomorrow.",
  homeBanner:
    "Refined layers and sculptural tailoring — selected by our style curators at Shop MayCSS Online Store for wardrobes that transcend seasons and trends.",
  homeCta:
    "First looks at new arrivals, private sales, and styling notes from our curators at Shop MayCSS Online Store — delivered to your inbox.",
  homeSeoBlock:
    "Discover why discerning shoppers choose Shop MayCSS Online Store for premium fashion online. We curate independent designers and heritage maisons with a focus on fabric integrity, considered silhouettes, and lasting wear. Complimentary shipping is available on qualifying orders, authenticity is guaranteed on every piece, and our team offers personal styling when you want a second eye. Whether you are building a capsule wardrobe or searching for a signature statement, MayCSS is your destination for minimalist luxury that feels effortless, elevated, and entirely your own. Explore the collection, save favourites, and shop with confidence knowing every detail has been vetted for quality and provenance.",

  shopHero:
    "Welcome to Shop MayCSS Online Store — explore our curated premium fashion range of minimalist luxury and high-quality apparel, organised the way we shop.",
  shopBody:
    "At Shop MayCSS Online Store, every piece is selected for craftsmanship, provenance, and timeless appeal. Browse women’s and men’s edits, outerwear, dresses, knitwear, and refined accessories designed to elevate a modern wardrobe without noise. We favour clean lines, exceptional textiles, and silhouettes that move from day to evening with ease. Use categories below to find investment outerwear, elevated basics, and finishing pieces that complete a look. Quality is non-negotiable: we partner with independent ateliers and heritage houses so you can shop premium fashion online with confidence. Complimentary shipping applies on qualifying orders, and authenticity is guaranteed on every purchase. Whether you are refining a capsule or discovering a new signature style, Shop MayCSS Online Store is built for shoppers who value quiet luxury, precise fit, and clothing that lasts beyond a single season. Explore the full collection and build a wardrobe that feels intentional, polished, and enduring.",

  saleHero:
    "Shop MayCSS Online Store for exclusive discounts on luxury fashion — investment pieces at investment-friendly prices, available for a limited time only.",
  saleBody:
    "The Sale Edit at Shop MayCSS Online Store brings curated markdowns on premium apparel without compromising craft or design. Discover limited-time savings on elevated outerwear, refined dresses, tailored layers, and accessories selected for quality and longevity. These are not fleeting trend pieces — they are considered wardrobe investments offered at a moment that rewards decisive shoppers. Quantities are limited and popular sizes move quickly, so if a piece has been on your list, now is the time to act. Enjoy the same authenticity guarantee, careful packaging, and thoughtful service you expect when you Shop MayCSS Online Store year-round. Review sale items carefully, check size guides, and complete your order while the edit lasts. Exclusive discounts on luxury fashion are temporary; the confidence of wearing MayCSS is not. Explore the sale, secure your favourites, and elevate your wardrobe with pieces priced for this season only.",

  aboutHero:
    "Shop MayCSS Online Store to experience our mission: timeless design, uncompromising quality, and fashion for people who care about the difference between good and exceptional.",
  aboutIntro:
    "MayCSS was founded so shoppers could Shop MayCSS Online Store with trust — curated premium fashion from independent ateliers and heritage maisons, never mass-produced noise. We work directly with makers across Italy, France, Portugal, and Scotland to bring pieces that outlast trends and become part of your story. Our brand story begins with a simple standard: if we would not wear it ourselves, it does not belong in our edit.",
  aboutChoose:
    "Every piece you find when you Shop MayCSS Online Store is vetted against three questions: Is it made to last? Does it improve the lives of the people who make it? Would we buy it ourselves? If we cannot answer yes to all three, it does not make it onto our floor. That quality assurance process protects your wardrobe and our reputation.",
  aboutPromise:
    "Transparent sourcing. Authenticity on every order. Personal styling when you want it. Customers trust MayCSS because we built Shop MayCSS Online Store for people who value craft over hype — and we intend to keep it that way with every collection we release.",
  aboutEditorial:
    "We do not chase trends. We chase integrity — in fabric, in fit, in the story behind every seam. That is the MayCSS difference you feel when you Shop MayCSS Online Store: quiet luxury, loud standards, and a commitment to pieces worthy of a lasting wardrobe.",

  faqHero:
    "Everything you need to know before you Shop MayCSS Online Store — shipping, returns, sizing, authenticity, and product quality answers in one place.",
  faqIntro:
    "Our help centre is designed to make it simple to Shop MayCSS Online Store with clarity and confidence. Below you will find professional guidance on delivery times, international shipping, returns, exchanges, payment methods, and how we guarantee product quality. If your question is not listed, our concierge team is ready to help within one business day.",

  privacyHero:
    "How we collect, use, and protect your personal information when you Shop MayCSS Online Store — clear policies written for trust and transparency.",
  privacyIntro:
    "Your privacy matters at Shop MayCSS Online Store. This Privacy Policy explains what information we collect, why we use it, and the choices you have. We designed these practices to be legal-friendly, easy to understand, and aligned with responsible e-commerce standards so you can shop luxury fashion online with confidence.",

  refundHero:
    "Simple, fair returns when you Shop MayCSS Online Store — because you should love what you bought, and trust how we handle refunds and exchanges.",
  refundIntro:
    "This Refund & Returns Policy explains how returns, exchanges, and refunds work at Shop MayCSS Online Store. We aim for clarity and fairness: unworn items may be returned within 30 days, sale conditions are disclosed upfront, and damaged goods are handled promptly with care.",

  contactHero:
    "Whether you need styling guidance, order support, or a personal shopping appointment — Shop MayCSS Online Store with a team that responds within one business day.",
  contactBody:
    "Customer satisfaction is central to how we Shop MayCSS Online Store experiences. Our concierge team helps with order tracking, sizing questions, product details, returns guidance, and styling recommendations for your wardrobe. Send a message through the form, and a real person will follow up personally — usually within one business day during business hours. We believe luxury fashion deserves luxury service: clear answers, warm support, and solutions that respect your time. Whether you are placing a first order or refining a long-term edit, we are here to help you shop with confidence. Explore our FAQ for quick answers, or contact us for personalised assistance. At MayCSS, support is not an afterthought — it is part of the promise behind every piece you purchase when you Shop MayCSS Online Store.",
};

function layout(pad = "md") {
  return { alignment: "center", width: "full", columnCount: 1, padding: pad };
}

function richtext(id, heading, body, opts = {}) {
  return {
    id,
    type: "richtext",
    layout: {
      alignment: "center",
      width: opts.width ?? "full",
      columnCount: 1,
      padding: opts.padding ?? "md",
    },
    heading,
    headingLevel: 2,
    body,
    alignment: opts.align ?? "left",
  };
}

function imageSlot(id, alt, caption) {
  return {
    id,
    type: "image",
    layout: layout("md"),
    src: "",
    alt,
    caption,
    width: "wide",
  };
}

const pages = JSON.parse(readFileSync(pagesPath, "utf8"));
const byId = Object.fromEntries(pages.map((p) => [p.id, p]));

// HOME
{
  const p = byId.home;
  p.seo = { ...p.seo, ...SEO.home, ogImage: p.seo?.ogImage || "/uploads/cms/mrjo0pkj-b303b84ea3634104.webp" };
  p.lastUpdated = "2026-07-19";
  const hero = p.blocks.find((b) => b.id === "blk_home_hero");
  if (hero) hero.subheading = BODY.homeHeroSub;
  const editorial = p.blocks.find((b) => b.id === "blk_home_editorial");
  if (editorial) editorial.body = BODY.homeEditorial;
  const split = p.blocks.find((b) => b.id === "blk_home_split");
  if (split) split.body = BODY.homeSplit;
  const banner = p.blocks.find((b) => b.id === "blk_home_banner");
  if (banner) banner.body = BODY.homeBanner;
  const cta = p.blocks.find((b) => b.id === "blk_home_cta");
  if (cta) cta.body = BODY.homeCta;
  // SEO body block after features if missing
  if (!p.blocks.some((b) => b.id === "blk_home_seo_copy")) {
    const idx = p.blocks.findIndex((b) => b.id === "blk_home_features");
    p.blocks.splice(
      idx >= 0 ? idx + 1 : 1,
      0,
      richtext("blk_home_seo_copy", "Curated Luxury, Delivered Online", BODY.homeSeoBlock, {
        width: "medium",
        align: "center",
      }),
    );
  } else {
    const b = p.blocks.find((b) => b.id === "blk_home_seo_copy");
    b.body = BODY.homeSeoBlock;
    b.heading = "Curated Luxury, Delivered Online";
  }
}

// SHOP
{
  const p = byId.shop;
  p.hero = BODY.shopHero;
  p.seo = { ...p.seo, ...SEO.shop, ogImage: p.seo?.ogImage || p.bannerImage || "" };
  p.lastUpdated = "2026-07-19";
  const intro = p.blocks.find((b) => b.id === "blk_shop_intro");
  if (intro) {
    intro.heading = "Curated Premium Fashion for the Modern Wardrobe";
    intro.body = BODY.shopBody;
  }
  if (!p.blocks.some((b) => b.id === "blk_shop_image_slot")) {
    p.blocks.splice(1, 0, imageSlot("blk_shop_image_slot", "MayCSS collection lookbook", "Upload a collection image in admin — Replace anytime."));
  }
}

// SALE
{
  const p = byId.sale;
  p.hero = BODY.saleHero;
  p.seo = { ...p.seo, ...SEO.sale, ogImage: p.seo?.ogImage || p.bannerImage || "" };
  p.lastUpdated = "2026-07-19";
  if (!p.blocks.some((b) => b.id === "blk_sale_intro")) {
    p.blocks.unshift(
      richtext("blk_sale_intro", "Exclusive Discounts on Luxury Fashion", BODY.saleBody, {
        width: "medium",
        align: "center",
      }),
    );
  } else {
    const b = p.blocks.find((b) => b.id === "blk_sale_intro");
    b.body = BODY.saleBody;
  }
  if (!p.blocks.some((b) => b.id === "blk_sale_image_slot")) {
    p.blocks.splice(1, 0, imageSlot("blk_sale_image_slot", "MayCSS sale edit campaign", "Upload a sale campaign image in admin — Edit or Replace anytime."));
  }
}

// ABOUT
{
  const p = byId.about;
  p.hero = BODY.aboutHero;
  p.seo = { ...p.seo, ...SEO.about, ogImage: p.seo?.ogImage || p.bannerImage || "" };
  p.lastUpdated = "2026-07-19";
  const a1 = p.blocks.find((b) => b.id === "blk_a604677a3349");
  if (a1) a1.body = BODY.aboutIntro;
  const a2 = p.blocks.find((b) => b.id === "blk_8b44500f82e7");
  if (a2) a2.body = BODY.aboutChoose;
  const a3 = p.blocks.find((b) => b.id === "blk_about_values");
  if (a3) a3.body = BODY.aboutPromise;
  const ed = p.blocks.find((b) => b.id === "blk_about_editorial");
  if (ed) ed.body = BODY.aboutEditorial;
}

// FAQ
{
  const p = byId.faq;
  p.hero = BODY.faqHero;
  p.bannerImage = p.bannerImage || "";
  p.seo = {
    ...p.seo,
    ...SEO.faq,
    ogImage: p.seo?.ogImage || "",
  };
  p.lastUpdated = "2026-07-19";
  if (!p.blocks.some((b) => b.id === "blk_faq_intro")) {
    p.blocks.unshift(
      richtext("blk_faq_intro", "Shopping Guidance from MayCSS", BODY.faqIntro, {
        width: "medium",
        align: "center",
      }),
    );
  }
  if (!p.blocks.some((b) => b.id === "blk_faq_image_slot")) {
    p.blocks.splice(1, 0, imageSlot("blk_faq_image_slot", "MayCSS customer help", "Upload a help-centre image in admin — Replace anytime."));
  }
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
      {
        q: "Do you offer gift wrapping?",
        a: "Yes — you can add complimentary gift wrapping at checkout and include a personal note when available.",
      },
    ];
  }
}

// PRIVACY
{
  const p = byId["privacy-policy"];
  p.hero = BODY.privacyHero;
  p.bannerImage = p.bannerImage || "";
  p.seo = { ...p.seo, ...SEO["privacy-policy"], ogImage: p.seo?.ogImage || "" };
  p.lastUpdated = "2026-07-19";
  if (!p.blocks.some((b) => b.id === "blk_privacy_intro")) {
    p.blocks.unshift(
      richtext("blk_privacy_intro", "Your Privacy at MayCSS", BODY.privacyIntro),
    );
  }
  // Expand first content block slightly to keep KW density natural
  const collect = p.blocks.find((b) => b.id === "blk_cea9c874c53b");
  if (collect) {
    collect.body =
      "When you Shop MayCSS Online Store, we collect the information you give us directly (name, email, shipping address, payment details) and information about how you use the site (pages visited, items viewed, cart activity). We do not sell your data to third parties. This information helps us fulfil orders, improve the shopping experience, and communicate with you about purchases you have made.";
  }
  const use = p.blocks.find((b) => b.id === "blk_2d9a5c2db7d9");
  if (use) {
    use.body =
      "We use your information to process orders, send order updates, personalise your experience on Shop MayCSS Online Store, and — if you have opted in — to send occasional emails about new arrivals and members-only offers. You can unsubscribe from marketing messages at any time using the link in our emails.";
  }
  const cookies = p.blocks.find((b) => b.id === "blk_7d8ec7aafaf0");
  if (cookies) {
    cookies.body =
      "We use essential cookies to keep your bag and preferences between visits, and analytics cookies to understand what is working on Shop MayCSS Online Store. You can control cookies through your browser settings. Disabling some cookies may affect checkout or saved preferences.";
  }
  const rights = p.blocks.find((b) => b.id === "blk_e47cddbe1146");
  if (rights) {
    rights.body =
      "You can request a copy of everything we hold about you, ask us to correct anything inaccurate, or ask us to delete your account entirely. Email privacy@maycss.example and we will respond within a reasonable timeframe. These rights help you stay in control while you Shop MayCSS Online Store.";
  }
  const pay = p.blocks.find((b) => b.id === "blk_46441afabbec");
  if (pay) {
    pay.body =
      "We never store your full card number. Payments on Shop MayCSS Online Store are processed by our PCI-DSS compliant payment providers over a TLS-encrypted connection. If you believe there has been unauthorised activity on your account, contact us immediately so we can secure your information.";
  }
}

// REFUND
{
  const p = byId["refund-policy"];
  p.hero = BODY.refundHero;
  p.bannerImage = p.bannerImage || "";
  p.seo = { ...p.seo, ...SEO["refund-policy"], ogImage: p.seo?.ogImage || "" };
  p.lastUpdated = "2026-07-19";
  if (!p.blocks.some((b) => b.id === "blk_refund_intro")) {
    p.blocks.unshift(
      richtext("blk_refund_intro", "Fair Returns You Can Trust", BODY.refundIntro),
    );
  }
  const r1 = p.blocks.find((b) => b.id === "blk_09d2ca00d81f");
  if (r1) {
    r1.body =
      "You have 30 days from the day your order arrives to request a return when you Shop MayCSS Online Store. Items must be unworn, unwashed, and returned with all original tags and packaging. Please keep proof of delivery and your order confirmation to make the process smoother.";
  }
  const r2 = p.blocks.find((b) => b.id === "blk_8b6d54731dd8");
  if (r2) {
    r2.body =
      "Sign in to your account, find your order under My Orders, and click Return. We will email a prepaid return label for eligible orders. Drop the package at any carrier location; your refund is processed the day we receive and inspect the return at Shop MayCSS Online Store.";
  }
  const r3 = p.blocks.find((b) => b.id === "blk_c5dfde37efb4");
  if (r3) {
    r3.body =
      "Refunds go back to your original payment method within 5–10 business days after we receive your return. Shipping charges are non-refundable unless the item was faulty. Exchanges are available by starting a return and placing a new order for the size or colour you want at Shop MayCSS Online Store.";
  }
  const faq = p.blocks.find((b) => b.type === "faq");
  if (faq) {
    faq.items = [
      {
        q: "Can I exchange instead of return?",
        a: "Yes — start a return and place a new order for the size or colour you want at Shop MayCSS Online Store so you do not miss popular sizes.",
      },
      {
        q: "What about sale items?",
        a: "Sale items are final sale unless the item is faulty. Please review sale terms carefully before you complete checkout.",
      },
      {
        q: "What if my item arrived damaged?",
        a: "Email hello@maycss.example within 7 days with a clear photo. We will replace it at no cost when you Shop MayCSS Online Store and the item is confirmed damaged in transit or on arrival.",
      },
    ];
  }
}

// CONTACT / HELP
{
  const p = byId.contact;
  p.hero = BODY.contactHero;
  p.seo = { ...p.seo, ...SEO.contact, ogImage: p.seo?.ogImage || "" };
  p.lastUpdated = "2026-07-19";
  if (!p.blocks.some((b) => b.id === "blk_contact_intro")) {
    p.blocks.unshift(
      richtext("blk_contact_intro", "Dedicated Customer Support", BODY.contactBody, {
        width: "medium",
        align: "left",
      }),
    );
  } else {
    const b = p.blocks.find((b) => b.id === "blk_contact_intro");
    b.body = BODY.contactBody;
  }
  if (!p.blocks.some((b) => b.id === "blk_contact_image_slot")) {
    p.blocks.splice(1, 0, imageSlot("blk_contact_image_slot", "MayCSS concierge support", "Upload a support or studio image in admin — Edit or Replace anytime."));
  }
  const form = p.blocks.find((b) => b.type === "contactform");
  if (form) {
    form.heading = "Send a Message";
    form.subheading =
      "Share your enquiry and a member of our team will follow up personally. We are here to help you Shop MayCSS Online Store with confidence.";
  }
}

// Validate all
let failed = 0;
for (const id of Object.keys(SEO)) {
  const p = byId[id];
  const issues = checkMeta(id, p.seo.metaTitle, p.seo.metaDescription);
  const text = extractBody(p.blocks, p.hero);
  const words = countWords(text);
  const hasKw = text.toLowerCase().includes(KW.toLowerCase());
  const kwFirst = p.seo.keywords?.[0] === KW;
  if (words < 150) issues.push(`body ${words} words (<150)`);
  if (!hasKw) issues.push("body missing KW");
  if (!kwFirst) issues.push("primary keyword not first in keywords[]");
  const status = issues.length ? "FAIL" : "OK";
  if (issues.length) failed++;
  console.log(
    `${status} ${id}: title=${p.seo.metaTitle.length} desc=${p.seo.metaDescription.length} words=${words} kw=${hasKw}`,
  );
  if (issues.length) console.log("  ", issues.join("; "));
}

if (failed) {
  console.error(`\n${failed} page(s) failed validation — not writing.`);
  process.exit(1);
}

writeFileSync(pagesPath, JSON.stringify(pages, null, 2) + "\n");
console.log(`\nWrote ${pagesPath}`);
