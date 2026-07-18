const KW = "Shop MayCSS Online Store";

const title = "Shop MayCSS Online Store | Privacy";
const desc =
  "Shop MayCSS Online Store with peace of mind. Learn how we collect, use, and protect your personal data with clear, trustworthy privacy practices.";

const body = `Your privacy matters when you Shop MayCSS Online Store. This Privacy Policy explains what information we collect, why we use it, and how we protect it. We wrote it to be clear, transparent, and easy to understand — so you can shop luxury fashion online with confidence.

Information We Collect
- Details you provide directly: name, email, shipping address, and payment information at checkout
- Account information if you create a profile
- Site activity such as pages viewed, items browsed, and cart behaviour
- Technical data such as browser type and device information used to keep the site secure

How We Use Your Data
- To process and deliver orders placed when you Shop MayCSS Online Store
- To send order confirmations, shipping updates, and customer-care replies
- To personalise your shopping experience and improve our site
- To send marketing emails only if you have opted in (you may unsubscribe at any time)
- We do not sell your personal information to third parties

Who We Share Information With
- Trusted payment providers and logistics partners needed to complete your order
- Service providers who help us operate the site under strict confidentiality
- Authorities when required by law

Security
Payments on Shop MayCSS Online Store are processed by PCI-DSS compliant providers over encrypted connections. We never store your full card number. We use reasonable technical and organisational measures to protect your data against unauthorised access, loss, or misuse.

Your Choices and Rights
- Request a copy of the data we hold about you
- Ask us to correct inaccurate information
- Request deletion of your account where applicable
- Control cookies through your browser settings
- Contact privacy@maycss.example for privacy requests

Cookies
We use essential cookies for your bag and preferences, and analytics cookies to understand what works on the site. Disabling some cookies may affect checkout or saved settings.

Updates
We may update this policy from time to time. The latest version will always appear on this page. Continued use of Shop MayCSS Online Store after updates means you accept the revised policy.

If you have questions about privacy or security, contact our team — we are committed to protecting your trust.`;

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
