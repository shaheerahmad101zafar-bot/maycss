# MayCSS

A premium, Macy's-inspired e-commerce storefront built with Next.js 15 (App Router), React 19, and TypeScript. Every custom style lives in `/styles/maycss/` — no CSS modules, no styled-components, no inline styling for structural rules.

## Quick start

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

Build & preview:

```bash
npm run build
npm start
```

Lint:

```bash
npm run lint
```

## What's inside

- **Storefront** (`/`, `/shop`, `/new`, `/sale`, `/brands`, `/product/[id]`) — server-rendered catalog with client-side cart, drawer, and add-to-bag interactions
- **Cart** — React Context with `localStorage` persistence, slide-in drawer with quantity steppers, free-shipping progress bar
- **Checkout** (`/checkout`) — two-column layout, client-side validation, simulated payment, order persisted through a server action
- **Admin** (`/admin`) — password-gated dashboard for product CRUD and order review

## Project structure

```
app/
  layout.tsx              # Root shell — mounts CartProvider, Navbar, CartDrawer
  page.tsx                # Homepage — banner + featured grid
  product/[id]/page.tsx   # PDP with breadcrumbs, gallery zoom, variant picker
  checkout/               # Checkout view + placeOrderAction
  shop|new|sale|brands/   # Category pages (using shared CategoryPage component)
  admin/
    login/                # Unprotected login page
    (dashboard)/          # Route-group with AdminNav layout
      page.tsx            # Dashboard
      products/           # List, new, edit
      orders/             # Order history
    actions.ts            # Server actions (auth + product CRUD)
  not-found.tsx           # Global 404
components/
  layout/Navbar.tsx
  marketing/MarketingBanner.tsx
  products/ (Card, Detail, CategoryPage)
  cart/ (Drawer + lazy Loader)
  checkout/CheckoutView.tsx
  admin/ (Nav, LoginForm, ProductForm, DeleteProductButton)
context/CartContext.tsx   # Cart + drawer state + localStorage sync
lib/
  utils.ts                # Client-safe types + formatters (formatPrice, cx, discountPercent, estimateTax)
  data.ts                 # server-only — read/write products & banner slides on disk
  orders.ts               # server-only — order persistence
  auth.ts                 # server-only — admin session helpers
data/
  products.json           # Product catalog (source of truth, mutable via admin)
  banner-slides.json      # Marketing banner slides
  orders.json             # Persisted orders (created on first checkout)
styles/maycss/
  globals.css             # Design tokens, base type, layout primitives
  components.css          # All component-level rules (banner, card, drawer, PDP, checkout, brand grid)
  admin.css               # Admin dashboard + 404 + validation styles
  responsive.css          # All @media queries in one place
middleware.ts             # Protects /admin/* (redirects to /admin/login if unauthed)
```

## Styling conventions — `styles/maycss/`

Everything that isn't a dynamically computed inline value (e.g. a moving zoom lens, a % progress bar width) lives in one of the four CSS files under `styles/maycss/`. Rules follow BEM-lite:

- `.mc-*` — root block, e.g. `.mc-card`
- `.mc-card__body` — element inside the block
- `.mc-card__price--sale` — modifier

Design tokens (colors, fonts, spacing, radii, motion) are CSS variables defined in `globals.css` under `:root`. All components consume them:

```css
color: var(--mc-red);
font-family: var(--mc-font-serif);
transition: transform var(--mc-dur-med) var(--mc-ease);
```

Tailwind is still installed and imported (via `app/globals.css`) but no new work uses utility classes. If you need to add tokens, add them to `globals.css`; if you need a new component style, add a block to `components.css`; and any breakpoint tweaks go in `responsive.css`.

## Cart & drawer

The cart lives in `context/CartContext.tsx`. It exposes:

- `items`, `itemCount`, `subtotal`
- `addToCart(product, qty?)`, `removeFromCart(id)`, `updateQuantity(id, qty)`
- `incrementQuantity(id)`, `decrementQuantity(id)`, `clearCart()`
- `isDrawerOpen`, `openDrawer()`, `closeDrawer()`, `toggleDrawer()`
- `isHydrated` — set to `true` only after the client has rehydrated from `localStorage`. Always render cart-derived values (badge count, subtotal) behind this flag to avoid hydration mismatch.

The drawer is loaded via `components/cart/CartDrawerLoader.tsx`, which wraps the drawer in `next/dynamic({ ssr: false })` so it stays out of the initial layout bundle.

## Checkout flow

1. `components/checkout/CheckoutView.tsx` validates the form client-side (email format, ZIP, card length, CVC, MM/YY).
2. On submit it calls `placeOrderAction` (a server action in `app/checkout/actions.ts`).
3. The action re-validates required fields, computes `subtotal`, `shipping`, `tax` (8.25% flat), `total`, and appends the order to `data/orders.json` via `lib/orders.ts`.
4. It calls `revalidatePath('/admin/orders')` and returns `{ ok: true, orderId }`.
5. Client shows the confirmation screen and `clearCart()`s.

No real payment gateway is wired — this is a stub. Swap the action body for your PSP (Stripe, Adyen, etc.) when integrating for real.

## Admin dashboard

**URL:** <http://localhost:3000/admin>

**Default dev password:** `maycss-admin`

Override via environment variables (create `.env.local`):

```
ADMIN_PASSWORD=your-strong-password
ADMIN_SESSION_TOKEN=any-random-string
```

### How auth works

- `middleware.ts` matches `/admin/:path*` and lets `/admin/login` through unauthenticated.
- Every other admin path requires an `mc-admin` HTTP-only cookie whose value matches `ADMIN_SESSION_TOKEN`.
- `loginAction` in `app/admin/actions.ts` validates the password, sets the cookie for 12 hours, then redirects.
- `logoutAction` clears the cookie and redirects to `/admin/login`.

This is intentionally simple — appropriate for internal tooling on a trusted network. For public admin use, layer in real session storage / SSO / 2FA.

### What the admin can do

- **Dashboard** (`/admin`) — product count, order count, gross revenue, recent orders
- **Products** (`/admin/products`) — list, edit, delete
- **New / Edit product** — full form with client + server validation for name, image URL, price, and sale-price rules
- **Orders** (`/admin/orders`) — order history with customer, item count, total, timestamp

### Data persistence

Product and order data live in flat JSON files under `data/`. Server actions read and rewrite them with `fs.writeFile`. This works in local development, custom Node.js deploys, and self-hosted environments. It will **not** persist on serverless platforms with read-only filesystems (Vercel, Netlify Functions) — swap `lib/data.ts` and `lib/orders.ts` for a database (Postgres, SQLite, Prisma, etc.) before deploying that way. Client caches are invalidated with `revalidatePath('/', 'layout')` after any product mutation, so storefront pages reflect changes immediately.

## Performance

- Route-level code splitting is automatic (each `page.tsx` gets its own bundle).
- The cart drawer is deferred via `next/dynamic({ ssr: false })`.
- Images use `loading="lazy"`.
- The marketing banner defers its render for 5 s and pauses auto-rotation on hover/focus.
- `styles/maycss/responsive.css` includes a `@media (prefers-reduced-motion: reduce)` block that disables non-essential animations and transitions.

## Error handling

- `app/not-found.tsx` renders a branded 404 for every unmatched route.
- `notFound()` is called from `app/product/[id]/page.tsx`, `app/brands/[brand]/page.tsx`, and `app/admin/(dashboard)/products/[id]/edit/page.tsx` whenever the record is missing.
- Server actions return typed `{ ok: false, error }` results; the UI surfaces them without a full page crash.

## Extending

- **Add products** through the admin form, or edit `data/products.json` directly (schema in `lib/utils.ts` — `type Product`).
- **Add categories** — set `category` on the product; the filter helpers (`getRelatedProducts`) already use it.
- **Add a footer** — create `components/layout/Footer.tsx`, style it under `styles/maycss/components.css` with a `.mc-footer*` block, and mount it in `app/layout.tsx` below `<main>`.
- **Swap file storage for a DB** — the only files that touch the filesystem are `lib/data.ts` and `lib/orders.ts`. Everything else consumes their async exports.
