const KW = "Shop MayCSS Online Store";

const title = "Refund & Returns Policy | Shop MayCSS Online Store";
const desc =
  "Need to return an item? Learn about our easy returns and refund process at Shop MayCSS Online Store. Your satisfaction is our priority.";

const body = `Simple, fair returns — because you should love what you bought when you Shop MayCSS Online Store. This Refund & Returns Policy explains eligibility, how to send an item back, and when your refund is issued.

Return Eligibility
- Items must be unworn, unwashed, and unused
- Return with all original tags and packaging intact
- Request a return within 30 days of delivery
- Sale items are final unless the item is faulty
- Personalised or intimate items may not be returnable unless defective

How to Initiate a Return
1. Sign in to your account and open My Orders
2. Select the order and choose Return
3. Follow the prompts to confirm the item and reason
4. We email a prepaid return label for eligible orders when you Shop MayCSS Online Store
5. Pack the item securely and drop it at any approved carrier location
6. Keep your drop-off receipt until the refund is complete

Refund Timeline
- We inspect returns once they arrive at our studio
- Approved refunds go back to your original payment method
- Most refunds appear within 5–10 business days after we receive the return
- Shipping charges are non-refundable unless the item was faulty
- You will receive an email confirmation when the refund is processed

Exchanges and Damaged Items
- Prefer an exchange? Start a return, then place a new order for the size or colour you want
- If an item arrives damaged, email hello@maycss.example within 7 days with a clear photo
- We will replace damaged goods at no cost when confirmed

Your satisfaction remains our priority. Review this policy before checkout, then Shop MayCSS Online Store with confidence knowing returns are clear, calm, and fair. Questions? Contact support — we are here to help every step of the way when you Shop MayCSS Online Store.`;

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
