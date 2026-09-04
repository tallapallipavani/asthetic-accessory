# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - App state, cart/reward logic, and page layout
- `src/types.ts` - Shared types (`Product` with `addedAt`, `CartItem`, `Reward`, `Order`)
- `src/data.ts` - Static catalog constants (`CATEGORIES`, `PRIZES`, `PRODUCTS`) — products carry ISO `addedAt` dates that drive the "Newest First" sort
- `src/lib/persistence.ts` - localStorage helpers and image data-URL utilities
- `src/lib/cart.ts`, `src/lib/filter.ts`, `src/lib/rewards.ts` - Pure cart, filtering/sorting, and spin-reward logic (unit-tested alongside in colocated `*.test.ts` files). `cart.ts` is stock-aware: `availableStock`, `addCartItem`/`updateCartQuantity` cap at `product.stock` when tracked
- Products carry optional `sku` + `stock` (stock `0` = sold out; blank/undefined = untracked). The storefront shows "Sold Out" states; the admin product form edits both and the list shows a stock badge
- `src/lib/urlState.ts` - `useUrlFilterState` hook syncing category/search/sort to the URL
- `src/lib/csv.ts` - CSV export helpers (`toCsv`, `downloadCsv` with UTF-8 BOM, `dateStamp`) used by the admin
- `src/lib/useOverlay.ts` - `useOverlay` hook for dialogs/drawers: Escape-to-close, background scroll lock, focus move/trap/restore
- `src/lib/catalog.ts` - `useCatalog` (live Convex catalog with static fallback) + `applyLocalOverrides` (persisted photo/price overrides)
- `convex/` - Convex backend: `schema.ts` (products/orders/subscribers), `products.ts` (public catalog queries), `seed.ts` (demo catalog seeder), `admin.ts` (password-guarded admin CRUD/orders/upload + `updateOrderStatus` along the flow paid → processing → shipped → delivered), `orders.ts` (`demoPay` — records paid orders until Razorpay keys arrive), `subscribers.ts` (`subscribe` — deduped newsletter signups), `checkout.ts` + `internal/checkout.ts` + `http.ts` (Razorpay order creation, signature verification, `/razorpay-webhook`)
- `src/components/AdminPanel.tsx` + `src/lib/adminApi.ts` - client admin UI at the `#/admin` hash route (login uses the `ADMIN_PASSWORD` deployment env var, held in sessionStorage during the session). Tabs: Dashboard (revenue/order/status/subscriber stats + CSV exports), Products (CRUD + photo upload + sku/stock), Orders (expandable cards with customer/payment details and fulfillment status buttons)
- `src/components/CheckoutModal.tsx` + `src/lib/checkout.ts` - checkout UI (details → demo UPI payment step → recorded order); swap `placeDemoOrder` for the Razorpay flow when `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` are set on the deployment
- `.env.local` - `VITE_CONVEX_URL` + `CONVEX_DEPLOY_KEY` (gitignored); **the dev server must be restarted to pick up env changes**
- Product `id` is a **string** (Convex `_id`); the static demo catalog uses `"1".."12"`
- The 12 live demo products carry sku/stock via the idempotent `admin:applyStockTracking` migration (demo catalog matches `src/data.ts`); run `admin:applyInrPricing` only if prices regress
- Admin deployments use: `CONVEX_DEPLOY_KEY=dev:... npx convex deploy` and `npx convex run <fn> '<json>'` (non-interactive; no `npx convex dev` needed)
- `src/test/setup.ts` - Vitest setup (jest-dom matchers, Testing Library cleanup)
- `src/components/*.test.tsx` - React Testing Library component tests (CartDrawer, WishlistDrawer, OrderConfirmation, SpinWheelModal) — run in jsdom via the `test` block in `vite.config.ts`
- `src/lib/theme.ts` - Brand tokens: `colors`, `fonts`, and `gradients` (use these instead of hard-coded hex/font strings)
- `package.json` scripts - `dev`, `build`, `preview`, `test` (Vitest), `format`
- `src/components/` - `ProductCard`, `CartDrawer`, `WishlistDrawer`, `SpinWheelModal`, `OrderConfirmation`, and `GoldLogoMark`
- `src/index.css` - Global CSS entrypoint, Tailwind CSS v4 import, and keyframe animations
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
