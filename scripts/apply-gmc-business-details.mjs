/**
 * Apply GMC-aligned business contact + 10-day mail-in returns to CMS pages.
 * Run: node scripts/apply-gmc-business-details.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const email = "myacssstore@gmail.com";
const phone = "+1 (501) 436-9308";
const address = "1707 S Lee's Summit Rd\nIndependence, MO 64050\nUSA";
const addressOne =
  "1707 S Lee's Summit Rd, Independence, MO 64050, USA";

const pagesPath = path.join(root, "data/pages.json");
const footerPath = path.join(root, "data/footer-pages.json");
const pages = JSON.parse(fs.readFileSync(pagesPath, "utf8"));

function walkReplace(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(walkReplace);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      obj[k] = v
        .replaceAll("hello@maycss.example", email)
        .replaceAll("privacy@maycss.example", email)
        .replaceAll("450 Madison Avenue", "1707 S Lee's Summit Rd")
        .replaceAll("New York, NY 10022", "Independence, MO 64050")
        .replaceAll("+1 (800) 555-0199", phone);
    } else {
      walkReplace(v);
    }
  }
}

// CONTACT
{
  const p = pages.find((x) => x.slug === "contact");
  if (p) {
    p.contactDetails = {
      heading: "MAYCSS Customer Support",
      lead: "Official contact details for MAYCSS — matching our Google Merchant Center business profile.",
      rows: [
        { id: "cdr_store", label: "Store name", body: "MAYCSS" },
        { id: "cdr_address", label: "Business address", body: address },
        { id: "cdr_email", label: "Support email", body: email },
        { id: "cdr_phone", label: "Support phone", body: phone },
        {
          id: "cdr_returns",
          label: "Mail-in returns",
          body: `Return eligible items within 10 days of delivery to:\n${address}`,
        },
      ],
    };
    p.hero =
      "Contact MAYCSS support by email or phone. Mail-in returns are accepted at our Independence, MO business address.";
    const intro = p.blocks?.find((b) => b.type === "richtext");
    if (intro) {
      intro.heading = "Contact MAYCSS";
      intro.body = `Thank you for shopping with MAYCSS. For order help, sizing, or returns, email ${email} or call ${phone}. Our business address is ${addressOne}. We typically respond within one business day.`;
    }
    for (const b of p.blocks || []) {
      if (b.type === "cta") {
        b.ctaHref = `mailto:${email}`;
        b.ctaLabel = b.ctaLabel || "Email support";
      }
    }
  }
}

// REFUND — 10-day + mail-in
{
  const p = pages.find((x) => x.slug === "refund-policy");
  if (p) {
    p.hero =
      "MAYCSS offers a clear 10-day return window with mail-in returns to our Independence, MO address.";
    p.seo = {
      ...(p.seo || {}),
      metaTitle: "Refund & Returns Policy | 10-Day Returns | MAYCSS",
      metaDescription: `MAYCSS 10-day return policy: unworn items with tags may be mailed to ${addressOne}. Contact ${email} or ${phone}.`,
      keywords: [
        "MAYCSS",
        "refund policy",
        "10-day returns",
        "mail-in returns",
      ],
    };
    p.blocks = [
      {
        id: "blk_refund_intro",
        type: "richtext",
        heading: "MAYCSS Refund & Returns Policy",
        body: `This Refund & Returns Policy applies to all purchases from MAYCSS (myacssstore.store). It matches our Google Merchant Center return settings: a 10-day return window and mail-in returns to our US business address.\n\nStore name: MAYCSS\nSupport email: ${email}\nSupport phone: ${phone}\nReturns address: ${addressOne}`,
      },
      {
        id: "blk_refund_window",
        type: "richtext",
        heading: "10-day return window",
        body: "You have 10 days from the date your order is delivered to start a return. Items must be unworn, unwashed, unused, and returned with all original tags and packaging intact. Sale items are final sale unless the item is faulty or not as described.",
      },
      {
        id: "blk_refund_mailin",
        type: "richtext",
        heading: "How to return (mail-in)",
        body: `1. Email ${email} (or call ${phone}) with your order number and reason for return within 10 days of delivery.\n2. We will confirm eligibility and provide return instructions.\n3. Pack the item securely and mail it to:\n\nMAYCSS Returns\n1707 S Lee's Summit Rd\nIndependence, MO 64050\nUSA\n\nKeep your shipping receipt until your refund is issued. Return shipping is the customer's responsibility unless the item is faulty or we sent the wrong item.`,
      },
      {
        id: "blk_refund_issue",
        type: "richtext",
        heading: "How refunds are issued",
        body: "Once we receive and inspect your return, approved refunds are issued to your original payment method within 5–10 business days. Shipping charges are non-refundable unless the item was faulty or we made an error. Exchanges: start a return, then place a new order for the size or color you want.",
      },
      {
        id: "blk_refund_faq",
        type: "faq",
        heading: "Returns FAQ",
        items: [
          {
            q: "What is the return window?",
            a: "10 days from delivery. Contact us within that window to start a mail-in return.",
          },
          {
            q: "Where do I mail returns?",
            a: `MAYCSS Returns, ${addressOne}.`,
          },
          {
            q: "How do I contact support?",
            a: `Email ${email} or call ${phone}.`,
          },
          {
            q: "What about damaged items?",
            a: `Email ${email} within 7 days of delivery with a clear photo. We will arrange a replacement or refund when the item is confirmed damaged.`,
          },
          {
            q: "Are sale items returnable?",
            a: "Sale items are final sale unless faulty or not as described.",
          },
        ],
      },
    ];
  }
}

// PRIVACY
{
  const p = pages.find((x) => x.slug === "privacy-policy");
  if (p) {
    const rights = (p.blocks || []).find((b) => b.heading === "Your rights");
    if (rights) {
      rights.body = `You can request a copy of the personal data we hold, ask us to correct inaccurate information, or request deletion of your account. Email ${email} and we will respond within a reasonable timeframe. Business contact: MAYCSS, ${addressOne}, phone ${phone}.`;
    }
    const intro = (p.blocks || []).find(
      (b) => b.heading === "Your Privacy at MayCSS",
    );
    if (intro && !String(intro.body || "").includes("Independence")) {
      intro.body = `${intro.body}\n\nController / business contact: MAYCSS, ${addressOne}. Email: ${email}. Phone: ${phone}.`;
    }
  }
}

// ABOUT
{
  const p = pages.find((x) => x.slug === "about");
  if (p) {
    for (const b of p.blocks || []) {
      if (b.type === "cta") {
        b.ctaHref = `mailto:${email}`;
        b.ctaLabel = "Email MAYCSS support";
        b.body = `Email ${email} or call ${phone}. Business address: ${addressOne}.`;
      }
    }
  }
}

// FAQ returns
{
  const p = pages.find(
    (x) => x.slug === "faq" || /faq/i.test(String(x.title || "")),
  );
  if (p) {
    for (const b of p.blocks || []) {
      if (b.type === "faq" && Array.isArray(b.items)) {
        for (const item of b.items) {
          if (/return|refund/i.test(item.q || "")) {
            item.a = `Unworn items with original tags may be returned within 10 days of delivery by mail to MAYCSS Returns, ${addressOne}. Email ${email} or call ${phone} to start a return. See our Refund & Returns Policy for full details.`;
          }
          if (typeof item.a === "string") {
            item.a = item.a
              .replaceAll("hello@maycss.example", email)
              .replaceAll("30 days", "10 days");
          }
        }
      }
      if (b.ctaHref && String(b.ctaHref).includes("maycss.example")) {
        b.ctaHref = `mailto:${email}`;
      }
    }
  }
}

// TERMS OF SERVICE
{
  let p = pages.find(
    (x) => x.slug === "terms-of-service" || x.slug === "terms",
  );
  if (!p) {
    p = {
      id: "terms-of-service",
      slug: "terms-of-service",
      title: "Terms of Service",
      eyebrow: "Legal",
      published: true,
      showInFooter: true,
      footerColumn: "legal",
      pageKind: "standard",
      showHeroBanner: true,
      seo: {},
      blocks: [],
    };
    pages.push(p);
  }
  p.slug = "terms-of-service";
  p.published = true;
  p.showInFooter = true;
  p.footerColumn = "legal";
  p.title = "Terms of Service";
  p.hero =
    "Please read these Terms of Service carefully before purchasing from MAYCSS.";
  p.seo = {
    metaTitle: "Terms of Service | MAYCSS",
    metaDescription: `MAYCSS Terms of Service for myacssstore.store — purchases, 10-day returns, and customer responsibilities. Contact ${email}.`,
    keywords: ["MAYCSS", "terms of service", "legal"],
  };
  p.blocks = [
    {
      id: "blk_tos_intro",
      type: "richtext",
      heading: "Agreement to terms",
      body: `By accessing myacssstore.store or placing an order with MAYCSS, you agree to these Terms of Service. Store name: MAYCSS. Business address: ${addressOne}. Support: ${email} / ${phone}.`,
    },
    {
      id: "blk_tos_orders",
      type: "richtext",
      heading: "Orders & pricing",
      body: "All prices are listed in USD unless otherwise stated. We reserve the right to refuse or cancel orders in case of pricing errors, suspected fraud, or stock issues. You will receive an order confirmation by email after checkout.",
    },
    {
      id: "blk_tos_returns",
      type: "richtext",
      heading: "Returns",
      body: `Returns are governed by our Refund & Returns Policy: a 10-day return window from delivery and mail-in returns to MAYCSS at ${addressOne}. Contact ${email} to start a return.`,
    },
    {
      id: "blk_tos_contact",
      type: "richtext",
      heading: "Contact",
      body: `Questions about these terms: email ${email}, call ${phone}, or write to MAYCSS, ${addressOne}.`,
    },
  ];
}

for (const p of pages) walkReplace(p);

fs.writeFileSync(pagesPath, `${JSON.stringify(pages, null, 2)}\n`);

const footer = pages.map((p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  showInFooter: p.showInFooter,
  footerColumn: p.footerColumn,
  published: p.published,
}));
fs.writeFileSync(footerPath, `${JSON.stringify(footer, null, 2)}\n`);

console.log(
  "OK — updated",
  ["contact", "refund-policy", "privacy-policy", "terms-of-service", "about"]
    .filter((s) => pages.some((p) => p.slug === s))
    .join(", "),
);
