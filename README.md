# Asthetic Accessory

A jewellery storefront for **Asthetic Accessory** — a React + Vite + Tailwind single-page app with a **Convex** backend and an admin panel for the store owner.

> **Status: interactive prototype / pre-launch.** Checkout runs in a clearly-labelled **demo mode** (no real money), products are demo catalogue items with stock photos, and admin access uses a shared password. Real payments, the client's product catalogue, and production-grade admin auth are the remaining launch steps.

## ✨ Features

- **Storefront** — product grid with live search, category filter, and sorting (all state lives in the URL, so filters survive refresh and are shareable)
- **Cart & wishlist** — persist across refreshes (localStorage), with quantity controls
- **Inventory-aware** — products carry SKU + stock; sold-out items are disabled and the cart refuses to oversell
- **Spin & Win** — cart-spend-based reward wheel (discounts, free shipping, free ring, gift wrap, points) that genuinely changes the order
- **Checkout** — details form → payment-method picker → **demo** payment simulation that records a real order in the database
- **Admin panel** (`#/admin`) — password-guarded product CRUD with photo uploads, stock/SKU management, and an **Orders** view with customer/payment details and a fulfilment workflow (paid → processing → shipped → delivered)
- **Newsletter** — signups stored (deduped) in the backend
- **Razorpay plumbing** — order creation, signature verification, and a webhook receiver are deployed and dormant; they activate once gateway keys are added
- **Accessible & polished** — brand theme tokens, keyboard-complete dialogs, AA-checked contrast, focus rings
- **92 unit/component tests**

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Convex (database, queries/mutations/actions, file storage, HTTP routes) |
| Currency | ₹ INR everywhere (prices, shipping, rewards) |
| Payments | Razorpay (dormant — see below) |
| Tests | Vitest + React Testing Library |

## 🚀 Getting started

```bash
pnpm install
pnpm dev          # start the Vite dev server
pnpm test         # run tests
pnpm build        # production build
```

### Convex backend

The app talks to a Convex deployment through `VITE_CONVEX_URL` (set in `.env.local`, which is gitignored). Without it the storefront runs on a static demo catalogue and checkout/newsletter/admin fall back gracefully.

The backend schema lives in `convex/schema.ts`; functions are grouped by domain:

- `convex/products.ts` — public catalogue queries
- `convex/admin.ts` — password-guarded admin functions (product CRUD, photo upload, order listing + status transitions, migrations)
- `convex/orders.ts` — `demoPay`, records paid orders (demo)
- `convex/subscribers.ts` — newsletter signup
- `convex/checkout.ts`, `convex/internal/checkout.ts`, `convex/http.ts` — Razorpay order creation, payment verification, `/razorpay-webhook`

Push code to a deployment with:

```bash
CONVEX_DEPLOY_KEY='dev:...' npx convex deploy --url 'https://<deployment>.convex.cloud'
```

## 🔐 Admin panel

Open the site and append **`#/admin`** to the URL (the link is deliberately absent from the public footer).

- Sign in with the `ADMIN_PASSWORD` deployment environment variable (set in the Convex dashboard → Settings → Environment Variables)
- **Products tab** — add / edit / archive / delete products, upload photos, set price, SKU, stock, category, tag, visibility
- **Orders tab** — expandable order cards with customer + payment details, itemised totals, and one-click fulfilment status

> ⚠️ Before launch this must be upgraded to proper account-based auth (the shared password is a prototype measure).

## 💳 Payments — demo vs real

- **Today:** checkout simulates a successful UPI payment (`orders:demoPay`). Orders are recorded as paid with a `demo:`-prefixed payment id, clearly marked in the admin.
- **Going live:** set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` on the deployment and switch the frontend from `placeDemoOrder` to the `checkout:createOrder` + `checkout:verifyPayment` flow. Razorpay then POSTs `payment.captured` / `payment.failed` events to the `/razorpay-webhook` HTTP route, which flips orders to paid/failed.

## 📁 Project layout

- `src/App.tsx` — storefront shell (hero, catalogue, newsletter, footer) and app state
- `src/components/` — `ProductCard`, `CartDrawer`, `WishlistDrawer`, `SpinWheelModal`, `CheckoutModal`, `OrderConfirmation`, `AdminPanel`, `GoldLogoMark`
- `src/lib/` — pure logic + shared helpers: `cart` (stock-aware), `filter`, `rewards`, `currency` (₹ formatting + thresholds), `catalog` (live Convex data with local overrides), `theme` (brand tokens), `useOverlay`, `urlState`, `persistence`, `adminApi`, `checkout`
- `convex/` — backend schema and functions (see above)
- `src/data.ts` — the static demo catalogue used until live data arrives

## 📝 Notes

- Prices are plain INR numbers (e.g. `4999` = ₹4,999); `formatPrice` renders them.
- Product ids are strings — the Convex document `_id` in live mode, `"1".."12"` in the static catalogue.
- The 12 seeded demo products are kept in sync with `src/data.ts` via one-off admin migrations (`applyInrPricing`, `applyStockTracking`).
- Demo UI features (price editing on cards, Spin & Win) are prototype conveniences — the store owner may drop them at launch.
