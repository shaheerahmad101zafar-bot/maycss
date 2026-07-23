# Google Merchant Center — MAYCSS product feed

## Live feed URLs

| Format | URL |
|--------|-----|
| **XML (recommended)** | `https://www.myacssstore.store/api/google-feed.xml` |
| XML (canonical /feeds) | `https://www.myacssstore.store/feeds/google-shopping.xml` |
| XML (short alias) | `https://www.myacssstore.store/feeds/google-feed.xml` |
| **CSV (downloadable)** | `https://www.myacssstore.store/api/google-feed.csv` |
| CSV (/feeds alias) | `https://www.myacssstore.store/feeds/google-feed.csv` |
| TSV (alternate) | `https://www.myacssstore.store/feeds/google-shopping.tsv` |

All of these are **public**, **dynamic**, and regenerate from the live catalog on each fetch (draft products are excluded). Titles, descriptions, brands, prices, and image links update automatically when products change in admin / Blob storage.

## How to submit in Google Merchant Center

1. Open [Google Merchant Center](https://merchants.google.com/) → select your MAYCSS account.
2. Go to **Products** → **Feeds** (or **Data sources**).
3. Click **Add product feed** / **Add data source**.
4. Choose your **country of sale** and **language**.
5. Select **Scheduled fetch** (or “Fetch from URL”).
6. Paste the XML feed URL:  
   `https://www.myacssstore.store/api/google-feed.xml`
7. Set fetch frequency to **daily** (or hourly if available).
8. Save and run an initial fetch. Review **Diagnostics** for any attribute warnings.

## Required attributes included

For every **published** product with a name, image, and price &gt; 0:

| Attribute | Source |
|-----------|--------|
| `id` | Product ID |
| `title` | Product name |
| `description` | Product description (generated fallback if empty) |
| `link` | Absolute PDP URL (`/product/{id}`) |
| `image_link` | Primary product image (unchanged; never rewritten by the feed) |
| `availability` | `in_stock` |
| `price` | USD with currency (`49.99 USD`) |
| `brand` | Product brand (fallback `MAYCSS`) |
| `condition` | `new` |

Also included when available: `sale_price`, `additional_image_link`, `product_type`, `google_product_category`, `color`, `size`.

## Notes

- Prefer `/feeds/` URLs for crawlers; `/api/google-feed.*` is allowed for Merchant Center scheduled fetch.
- Currency is **USD** to match the storefront checkout.
- The feed only **reads** catalog data — it does not alter product images, layouts, or admin settings.
