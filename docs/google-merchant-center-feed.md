# Google Merchant Center — MAYCSS product feed

## Live feed URLs

| Format | URL |
|--------|-----|
| **XML (recommended)** | `https://www.myacssstore.store/feeds/google-shopping.xml` |
| TSV (alternate) | `https://www.myacssstore.store/feeds/google-shopping.tsv` |

The feed is **public**, **dynamic**, and regenerates from the live catalog on each fetch (draft products are excluded). Prices and sale prices update automatically when products change in admin.

## How to submit in Google Merchant Center

1. Open [Google Merchant Center](https://merchants.google.com/) → select your MAYCSS account.
2. Go to **Products** → **Feeds** (or **Data sources**).
3. Click **Add product feed** / **Add data source**.
4. Choose your **country of sale** and **language**.
5. Select **Scheduled fetch** (or “Fetch from URL”).
6. Paste the XML feed URL:  
   `https://www.myacssstore.store/feeds/google-shopping.xml`
7. Set fetch frequency to **daily** (or hourly if available).
8. Save and run an initial fetch. Review **Diagnostics** for any attribute warnings.

## What the feed includes

For every **published** product with a name, image, and price:

- `id`, `title`, `description`, `link`, `image_link`
- `price` / `sale_price` (USD)
- `availability` (`in_stock`), `condition` (`new`)
- `brand` (`MAYCSS`)
- `product_type` + `google_product_category` (apparel taxonomy)
- Optional: color / size when present on the product

## Notes

- Feed routes live under `/feeds/` (not `/api/`) so they are **not** blocked by `robots.txt`.
- Currency is **USD** to match the storefront checkout.
- Do **not** use local “near me” keywords in titles — feed copy stays GMC-safe.
