# Developer onboarding — Printora Inventory

Welcome. This repo is a **Next.js 15 + TypeScript + Supabase** stock and POS-style app (`en` / `km`). Product direction and scope live in [.cursor/rules/project-rules.mdc](.cursor/rules/project-rules.mdc) and the phased plan in [implementation-phases.md](implementation-phases.md).

---

## 1. Prerequisites

| Tool | Notes |
|------|------|
| **Git** | Branch from `main` (or your team’s default). |
| **Node.js** | **20 LTS** recommended (aligned with `@types/node` ^20). |
| **npm** | Default package manager for this repo. |
| **Supabase account** | Check email I already sent you an invitation |
 
---

## 2. First-time setup

### 2.1 Clone and install

```bash
git clone <repo-url>
cd Printora-Inventory
npm install
```

### 2.2 Environment variables

1. Copy [`.env.example`](../.env.example) → **`.env.local`** in the repo root.
2. Fill **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** from Supabase (**Settings → API**). Keys stay local only — never commit or paste into docs.

### 2.3 Run the app

```bash
npm run dev
```

Open **http://localhost:3000** — routing may move to **`/[locale]`** once Phase **1.3** i18n is merged; until then expect the root layout under `src/app/`.

---

## 3. What to read before coding

1. **[implementation-phases.md](implementation-phases.md)** — your backlog is **Phase 3 §3.1–§3.3** (below); skim **Phase 1–2** for routing, auth, and project conventions.
2. **Project rules** — [.cursor/rules/project-rules.mdc](../.cursor/rules/project-rules.mdc) (roles, stock rules, i18n, no overengineering).
3. **Brand** — [.cursor/rules/printora-brand.mdc](../.cursor/rules/printora-brand.mdc) — palette and typography for owner-facing UI.
4. **DB schema** — [supabase/migrations/20260516120000_application_schema.sql](../supabase/migrations/20260516120000_application_schema.sql) (Database Schema - No need to understand it all, think of it like laravel migration).

---

## 4. Repo map (quick)

| Path | Purpose |
|------|--------|
| `src/app/` | App Router pages and layouts |
| `src/components/ui/` | shadcn-style UI primitives |
| `src/components/layout/` | Shell / layout pieces |
| `src/features/` | Feature modules (keep business logic here, not only in components) |
| `src/messages/en.json`, `km.json` | User-facing **app** strings (**Phase 1 §1.3** — keep locales in sync) |
| `supabase/migrations/` | Versioned SQL (**Phase 1 §1.2**) |

---

## 5. Your tasks (assigned)

You own **[implementation-phases.md](implementation-phases.md) Phase 3 — §3.1, §3.2, and §3.3.** I will develop other phases in parallel and may **seed or tweak** **`categories`**, **`suppliers`**, and **`system_settings`** manually in Supabase until your work get merged.

### §3.1 Settings & lookups

| # | Deliverable | Notes |
|---|-------------|-------|
| 1 | **`system_settings` migration** | Current Phase 1 table only has `default_locale`, `next_receipt_seq`, `allow_cashier_discount`. Add columns or a keyed settings shape for **business name**, **phone**, **`global_low_stock`**, **Telegram** fields; is_notify (Enable Telegram notifications)  |
| 2 | **Page `[locale]/settings`** | Shop info, default locale, global low-stock threshold, Telegram (masked inputs + optional test-send button). **React Hook Form + Zod**; copy from **`src/messages/*.json`** (add keys if missing). |
| 3 | **Server actions** | Read/write settings with OWNER-only |

### §3.2 Categories

| # | Deliverable | Notes |
|---|-------------|-------|
| 1 | **`[locale]/categories`** | Table: name, description, status, actions—**Create / Edit** (inline or modal). |
| 2 | **Soft deactivate** | Set **`status = INACTIVE`** (no hard delete). |
| 3 | **Server actions** | `createCategory`, `updateCategory`, `toggleCategoryStatus` under **`src/features/categories/`** with Zod. |

### §3.3 Suppliers

| # | Deliverable | Notes |
|---|-------------|-------|
| 1 | **`[locale]/suppliers`** | Table: name, phone, address, status, actions—**Create / Edit** modal. |
| 2 | **Soft deactivate** | **`status = INACTIVE`**. |
| 3 | **Server actions** | `createSupplier`, `updateSupplier`, `toggleSupplierStatus` under **`src/features/suppliers/`**. |

---