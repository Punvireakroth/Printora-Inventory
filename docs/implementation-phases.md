# Printora Inventory — Implementation Phases

> Step-by-step build plan for the Printora stock management platform.
> Each phase is self-contained and shippable. Implement, verify, then move to the next.

---

## Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Foundation & Setup | Scaffold project, DB, i18n, design system |
| 2 | Auth & User Management | Login, roles, route protection, staff accounts |
| 3 | Core Data | Categories, Suppliers, Products CRUD |
| 4 | Stock Management | Stock receive, adjustments, movement history |
| 5 | POS & Sales | POS screen, checkout, receipt, Telegram alert |
| 6 | Dashboard & Reports | Owner dashboard, all report screens |
| 7 | Polish & Deploy | i18n completion, error messages, responsive QA, Vercel |

---

## Phase 1 — Foundation & Setup

**Goal:** A running Next.js app with Supabase connected, database schema applied, i18n routing active, and the brand design system in place. No features yet — just a solid base to build on.

### 1.1 Project Scaffolding
- [x] Init Next.js 15 App Router project with TypeScript
- [x] Set up `src/` directory structure:
  ```
  src/
    app/
    components/
      layout/
      ui/
    features/
    lib/
    constants/
    messages/
      en.json
      km.json
  ```
- [x] Install core dependencies:
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `next-intl`
  - `tailwindcss`, `shadcn/ui`
  - `react-hook-form`, `@hookform/resolvers`, `zod`
  - `next/font` (Outfit + Kantumruy Pro)
- [x] Set up `.env.local` with Supabase URL + anon key
- [x] Add `.env.example` with all required keys documented

### 1.2 Database Schema (Supabase CLI)
- [x] Install [Supabase CLI](https://supabase.com/docs/guides/cli); run `supabase init` in the repo if `supabase/` is missing  
  - **In this repo:** CLI is available via `devDependency` `supabase` and `npx supabase`. `supabase init` has been run (`supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`).
- [x] Link the CLI to your Supabase project so migrations apply to the right database  
  - Log in once: `npm run db:login` (runs `supabase login`, opens browser) or `npx supabase login`, or set `SUPABASE_ACCESS_TOKEN`.  
  - From project root: `npm run db:link` (same as `supabase link`) → enter **database password** when prompted; `--project-ref` is read from the Dashboard URL (`https://supabase.com/dashboard/project/<project-ref>`).  
  - This step must be done on your machine; it is not committed to git.
- [x] Version schema changes only via SQL files under `supabase/migrations/`:
  - New change: `npm run db:migration:new -- <short-description>` → edit the generated `.sql` under `supabase/migrations/`
  - Apply to linked remote: `npm run db:push` (`supabase db push`). Local disposable Postgres: `npm run db:start` / `npm run db:stop`, full reset: `npm run db:reset`
  - Prefer **not** using the Dashboard SQL editor as the primary way to define schema — keep the repo authoritative
- [x] Create all tables via those migrations:
  - `users` (with `role`, `preferred_locale`)
  - `categories`
  - `suppliers`
  - `products`
  - `stock_receives` + `stock_receive_items`
  - `stock_movements`
  - `sales` + `sale_items` (with snapshot fields + `locale_at_sale`)
  - `stock_adjustments`
  - `system_settings`
- [x] Add enums: `OWNER/CASHIER`, `ACTIVE/INACTIVE`, `STOCK_IN/SALE/ADJUSTMENT/REFUND`, `COMPLETED/CANCELLED/REFUNDED`, `CASH/BANK_TRANSFER/ABA/OTHER`
- [x] Add locale constraints on `preferred_locale`, `locale_at_sale`, `default_locale`
- [x] Enable RLS (Row Level Security) — baseline policies per role
- [x] Set up Supabase Storage bucket for product images (`product-images`, public read)

  **Migration:** `supabase/migrations/20260516120000_application_schema.sql` — apply with `npm run db:push`. First Supabase Auth user defaults to role `CASHIER`; promote at least one account to owner with SQL:  
  `UPDATE public.users SET role = 'OWNER' WHERE email = '<owner@example.com>';`  
  **POS note:** cashier JWTs insert `sales` / `sale_items` only; stock deduction + `stock_movements` updates should run server-side (`service_role`) or via a SECURITY DEFINER RPC in Phase 5.

### 1.3 Internationalization (i18n)
- [x] Configure `next-intl` with App Router:
  - `app/[locale]/layout.tsx` as root layout
  - Middleware: negotiate locale from cookie → `preferred_locale` → `system_settings.default_locale` → `km` fallback
  - Supported locales: `en`, `km`
- [x] Create `messages/en.json` and `messages/km.json` with skeleton keys (navigation, common actions, errors)
- [x] Load `Outfit` (Latin) and `Kantumruy Pro` (Khmer) via `next/font`
- [x] Language switcher component that updates cookie + `users.preferred_locale` and navigates to `/{newLocale}/...`

### 1.4 Design System & Brand
- [x] Configure Tailwind with Printora brand palette:
  - `--brand-red: #EB1C24`
  - `--brand-dark-red: #4C0A0C`
  - `--brand-warm: #C1A98F`
  - Black `#000000`, neutral gray `#3A3A3A`
- [x] Install and configure `shadcn/ui` (use brand red as primary accent)
- [x] Create base layout shell components (sidebar, header, main content area) — aligned with next-shadcn-dashboard-starter patterns
- [x] Add language switcher to layout shell
- [x] Verify Khmer + Latin font rendering on a test page

### Phase 1 Done When
- App runs at `localhost:3000/km` and `localhost:3000/en`
- Database tables exist in Supabase
- Language switcher changes the locale and persists
- Brand colors and fonts render correctly

---

## Phase 2 — Auth & User Management

**Goal:** Owners and cashiers can log in. Routes are protected by role. Owners can manage staff accounts.

### 2.1 Authentication
- [x] Supabase Auth integration with `@supabase/ssr`:
  - `src/lib/supabase/server.ts`, `middleware.ts`, `browser.ts`, `route-handler.ts`
  - Session refresh + cookie writes in `src/middleware.ts`
  - PKCE callback: `src/app/[locale]/auth/callback/route.ts`
- [x] Login page at `[locale]/login` (`src/app/[locale]/(auth)/login/page.tsx`):
  - Email + password (React Hook Form + Zod) — **password only** (no email OTP / magic link)
  - Error messages via `auth.errors.*` in `messages/en.json` + `messages/km.json` (`mapAuthErrorToMessageKey`)
  - Language switcher on login (and other auth screens)
  - Split layout: `auth-split-shell.tsx` + hero placeholder image
  - **Remember me:** `printora_auth_persist` cookie + longer-lived session cookies when checked
- [x] Forgot password: `[locale]/forgot-password` → email reset link → callback → `[locale]/update-password`
- [x] Auth middleware: unauthenticated users → `[locale]/login?next=…` (`next` is locale-less for client router; see `sanitizeRouterPath` in `src/lib/site-url.ts`)
- [x] After login:
  - Client: `router.replace` to sanitized `next` (e.g. `/` → locale home)
  - Middleware: logged-in user on `/login` → OWNER → `/dashboard`, CASHIER → `/pos`; locale root `/` → role-based redirect
- [x] Logout: `SignOutControl` in dashboard shell (client `supabase.auth.signOut()` + redirect to `/login`) — not a server action; sufficient for v1
- [x] Sync Auth → `public.users`: DB trigger `handle_auth_user_created` (default `CASHIER`); seed script inserts row if trigger lags

### 2.2 Role-Based Route Protection
- [x] Middleware reads `users.role` after `supabase.auth.getUser()`:
  - CASHIER on `/`, `/dashboard`, `/products`, `/settings` (and subpaths) → redirect to `/pos`
  - OWNER: no extra redirects
  - **Note:** `/reports`, `/stock`, `/users` are listed in the product spec but routes do not exist yet — add those path prefixes to `isOwnerOnlyRestPath` in `src/features/auth/route-paths.ts` when those modules ship (Phase 3–6)
- [x] `getCurrentUser()` server utility + `useCurrentUser()` hook (`src/features/auth/services/get-current-user.ts`, `CurrentUserProvider` in dashboard layout). Helpers: `requireCurrentUser()`, `requireOwnerUser()`, `getCurrentUserAction()` for client refresh.

### 2.3 Staff Account Management (Owner only)
- [ ] Staff list page at `[locale]/settings/users`:
  - Table: full name, email, role, status, created date
  - "Add Staff" button → modal/drawer form
  - Toggle Active/Inactive
- [ ] Add Staff form: full name, email, role (CASHIER only from this screen), temp password
- [ ] Server action: create Supabase Auth user + insert into `users` table
- [ ] Owner cannot delete their own account

### Phase 2 Done When
- [x] Owner can log in and see the dashboard shell (placeholder pages OK)
- [ ] Cashier can log in and sees only POS — **verify** with a `CASHIER` test account (seed script only creates OWNER today)
- [ ] Owner can create a cashier account and that cashier can log in (blocked on §2.3)
- [x] Wrong-role navigation redirects correctly for existing owner routes (`/dashboard`, `/products`, `/settings`)

### Phase 2 — Developer setup (auth)
| Step | Command / location |
|------|-------------------|
| Env | Copy `.env.example` → `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (seed only) |
| First owner | `npm run db:seed-owner` (or `--email=… --password=…`) |
| Supabase Auth URLs | Dashboard → Auth → URL configuration: allow `{SITE_URL}/{en\|km}/auth/callback` |
| Dev app | `npm run dev` → `/km/login` or `/en/login` |

---

## Phase 3 — Core Data (Categories, Suppliers, Products)

**Goal:** Owner can set up the product catalog. All CRUD for the three core data types.

**Assignment — §3.1–§3.3:** Contributor tasks for these subsections live in **`docs/developer-onboarding.md`** (section **§5 · Your tasks**).  
**Parallel work:** Until pages and actions ship, the lead may **insert or tweak values** directly in Supabase (**Table Editor** or SQL)—e.g. `categories`, `suppliers`, and fields on **`system_settings`**—so other features under development stay unblocked.

### 3.1 Settings & Lookups
- [ ] Settings page at `[locale]/settings`:
  - Business name, phone
  - Default locale (shop-wide fallback)
  - Global low stock threshold (`global_low_stock`)
  - Telegram bot token + chat ID (masked input, test-send button)
- [ ] Server actions to read/write `system_settings`

### 3.2 Categories
- [ ] Categories list at `[locale]/categories`:
  - Table: name, description, status, actions
  - Create / Edit inline or modal (React Hook Form + Zod)
  - Soft delete (set `status = INACTIVE`)
- [ ] Server actions: `createCategory`, `updateCategory`, `toggleCategoryStatus`

### 3.3 Suppliers
- [ ] Suppliers list at `[locale]/suppliers`:
  - Table: name, phone, address, status, actions
  - Create / Edit modal
  - Soft delete
- [ ] Server actions: `createSupplier`, `updateSupplier`, `toggleSupplierStatus`

### 3.4 Products
- [ ] Products list at `[locale]/products`:
  - Table: image, name, SKU, category, size, color, cost, selling price, stock, status
  - Search bar (name, SKU) + category filter + status filter
  - Low-stock badge when `current_stock <= minimum_stock`
- [ ] Add Product page at `[locale]/products/new`:
  - All product fields (React Hook Form + Zod)
  - Image upload to Supabase Storage → store `image_url`
  - SKU auto-suggestion (editable)
  - Category and Supplier dropdowns from DB
- [ ] Edit Product page at `[locale]/products/[id]/edit`
- [ ] Server actions: `createProduct`, `updateProduct`, `toggleProductStatus`
- [ ] Rule: cashier cannot see cost price column (role check before rendering)
- [ ] i18n: all labels, validation errors, empty states in both locales

### Phase 3 Done When
- Owner can create categories, suppliers, and products
- Product list shows correct stock and low-stock badge
- Image uploads and displays
- Cashier cannot navigate to products pages (redirected to POS)

---

## Phase 4 — Stock Management

**Goal:** Owner can receive stock from suppliers, make adjustments, and see full movement history.

### 4.1 Stock Receive
- [ ] Receive Stock page at `[locale]/stock/receive`:
  - Header: supplier, receive date, note, receive number (auto `REC-0001`)
  - Line items: search product, quantity, cost price per item
  - Add multiple products to one receive
  - Submit → creates `stock_receives` + `stock_receive_items` + updates `products.current_stock` + inserts `stock_movements` (type `STOCK_IN`)
- [ ] Receive History list at `[locale]/stock/receives`:
  - Table: receive number, supplier, date, items count, received by
  - View detail (expandable or detail page)
- [ ] Server actions: `createStockReceive` (transaction: receive + items + stock update + movements)

### 4.2 Stock Adjustment
- [ ] Adjustment page at `[locale]/stock/adjust`:
  - Select product, enter new quantity, enter reason (required)
  - System calculates diff → creates `stock_adjustments` + `stock_movements` (type `ADJUSTMENT`) + updates `current_stock`
- [ ] Server action: `createStockAdjustment`

### 4.3 Stock Movements History
- [ ] Movements page at `[locale]/stock/movements`:
  - Table: date, product, type, qty (+/-), old stock, new stock, user
  - Filters: date range, movement type, product search
- [ ] Powered by `stock_movements` table query

### Phase 4 Done When
- Owner can receive stock and see `current_stock` increase on the product
- Owner can adjust stock with a reason
- All changes appear in the movements table with correct before/after values

---

## Phase 5 — POS & Sales

**Goal:** Cashier can search products, build a cart, complete a sale, get a receipt, and the system automatically deducts stock and sends a Telegram alert.

### 5.1 POS Screen
- [ ] POS page at `[locale]/pos`:
  - Search bar: search by name, SKU, size, color, category (debounced query)
  - Product grid / list results with image, name, price, stock badge
  - Cart panel: line items, qty controls, item-level discount
  - Cart summary: subtotal, discount, total
  - Payment method selector: Cash, Bank Transfer, ABA, Other
  - "Complete Sale" button
- [ ] Stock check before completing: if any item qty > `current_stock`, block and show error
- [ ] "Cancel Sale" clears cart (no stock change)

### 5.2 Complete Sale Flow
- [ ] Server action `completeSale` (single DB transaction):
  1. Validate stock for all items
  2. Create `sales` row (auto `INV-0001`, `locale_at_sale` from cashier's current locale)
  3. Create `sale_items` rows with snapshot fields (`product_name_snapshot`, `sku_snapshot`, `unit_price`, `cost_price_snapshot`)
  4. Deduct `products.current_stock` for each item
  5. Insert `stock_movements` rows (type `SALE`) for each item
  6. Send Telegram alert (async, non-blocking — if fails, `telegram_sent = false`, sale still completes)
  7. Return sale ID for receipt

### 5.3 Receipt Screen
- [ ] Receipt page / modal after sale:
  - Business name, logo
  - Receipt number (`INV-XXXX`)
  - Cashier name, date
  - Line items: product name, qty, unit price, item total
  - Subtotal, discount, total, payment method
  - "Print" button (browser print / `@media print` styles)
  - "New Sale" button → back to POS

### 5.4 Telegram Sale Alert
- [ ] Send alert using Telegram Bot API after successful sale
- [ ] Alert content (in `locale_at_sale`):
  - Receipt number
  - Cashier name
  - Total amount
  - Payment method
  - Sale date/time
- [ ] Alert text from `messages/en.json` and `messages/km.json` (telegram key group)
- [ ] If send fails: log error server-side, set `telegram_sent = false`, do NOT break sale

### 5.5 Sales History (Cashier view)
- [ ] "My Sales" page at `[locale]/pos/history`:
  - Table: receipt no., date, total, payment method, status
  - Filter: today, this week, this month, custom date range
  - View receipt detail

### Phase 5 Done When
- Cashier completes a full sale: search → cart → pay → receipt
- `current_stock` is deducted correctly after sale
- Telegram message arrives (or gracefully fails without breaking the sale)
- Receipt can be printed
- Low-stock badge appears on products at or below threshold

---

## Phase 6 — Dashboard & Reports

**Goal:** Owner has a clear overview dashboard and can run all business reports.

### 6.1 Owner Dashboard
- [ ] Dashboard at `[locale]/dashboard`:
  - Stat cards: Today's Sales (amount + count), This Month's Sales, Total Products, Low-Stock Products count
  - Recent Sales table (last 5–10)
  - Recent Stock Movements table (last 5–10)
  - Low-Stock Products list (quick view)
- [ ] All data via server components querying Supabase directly

### 6.2 Sales History (Owner view)
- [ ] Page at `[locale]/sales`:
  - Full sales table: date, receipt no., cashier, total, payment method, status
  - Filters: date range, cashier, payment method
  - Click row → view full receipt/sale detail
  - Export CSV (optional for v1)

### 6.3 Stock Balance Report
- [ ] Page at `[locale]/reports/stock`:
  - Table: product, purchased total, sold total, current stock, selling price, total sales amount
  - Search by SKU or product name
  - Reflects all-time purchase vs sale aggregates from `stock_movements`

### 6.4 Best-Selling Products
- [ ] Section on dashboard or page at `[locale]/reports/best-sellers`:
  - Table: product, quantity sold, sales amount
  - Filter: date range (this month default)

### 6.5 Low-Stock Report
- [ ] Page at `[locale]/reports/low-stock`:
  - Table: product, current stock, minimum stock, status badge
  - Only shows products where `current_stock <= minimum_stock`

### 6.6 Profit Report (Owner only)
- [ ] Page at `[locale]/reports/profit`:
  - Summary: qty sold, total sales amount, total cost amount, profit
  - Filter: date range
  - Powered by `sale_items` + `cost_price_snapshot`
  - **Cashier cannot access this route**

### 6.7 Stock Movements Report
- [ ] Already covered in Phase 4.3 — verify filters and date range work correctly here

### Phase 6 Done When
- Dashboard loads with real data
- All 5 report pages work with correct numbers
- Profit report is inaccessible to cashier role

---

## Phase 7 — Polish & Deploy

**Goal:** All strings translated, all error states handled, app is responsive, and deployed to Vercel.

### 7.1 i18n Completion
- [ ] Audit every user-facing string — ensure all keys exist in both `en.json` and `km.json`
- [ ] Verify date/number formatting per locale (Khmer digits for `km`)
- [ ] Test Telegram alert in both `en` and `km` locales

### 7.2 Error Handling & User Feedback
- [ ] All server action errors return translated error codes (never raw DB errors)
- [ ] Toast/notification system for success and error feedback
- [ ] Form validation errors display in active locale
- [ ] 404 and error pages (`not-found.tsx`, `error.tsx`) in both locales

### 7.3 Responsive & Accessibility
- [ ] Owner dashboard: test on desktop and tablet
- [ ] POS screen: test on tablet (primary cashier device) — touch-friendly tap targets
- [ ] Language switcher accessible from all primary layouts (dashboard header, POS header)
- [ ] Keyboard navigation for POS search and cart actions
- [ ] Basic ARIA attributes on interactive components

### 7.4 Security Hardening
- [ ] RLS policies reviewed — each role can only read/write rows they are allowed to
- [ ] Server actions re-check role on every sensitive operation (never trust client)
- [ ] Supabase Storage: product images readable publicly; no other buckets public
- [ ] Environment variables confirmed not exposed to client

### 7.5 Vercel Deployment
- [ ] Add all env vars to Vercel project settings (Supabase URL, anon key, Telegram bot token)
- [ ] Set `NEXTAUTH_URL` / verify `next-intl` works in production environment
- [ ] Run production build locally (`next build`) — fix any build errors
- [ ] Deploy to Vercel
- [ ] Smoke test all critical flows on production URL:
  - Login as owner and cashier
  - Create product
  - Receive stock
  - Complete a sale
  - Check Telegram alert
  - View dashboard and reports

### Phase 7 Done When
- All pages render in both `en` and `km` with no missing keys
- App is live on Vercel
- Smoke tests pass for both roles

---

## Iteration Notes

- **Doc sync:** Phase checkboxes above reflect the repo as of the auth milestone (password login, middleware, seed-owner). Re-audit when merging Phase 3 work.
- Each phase ends with a **working, testable state** — do not move forward if previous phase is broken.
- Database migrations are cumulative — never drop and recreate in production after Phase 1; track every DDL change with Supabase CLI migrations in `supabase/migrations/` and commit them with the app.
- i18n keys should be added **as each screen is built** (Phases 2–6), not deferred to Phase 7.
- Telegram integration can be mocked (console.log) in Phases 1–4 and wired for real in Phase 5.
- Snapshot fields in `sale_items` (`product_name_snapshot`, `cost_price_snapshot`, etc.) must never be skipped — they are critical for correct profit reports on historical data.
