-- Dev seed: system_settings, categories, suppliers (Phase 3 lookups)
--
-- Safe to run in Supabase SQL Editor in one shot (schema + data).
-- CLI: npm run db:seed-lookups  (linked project) or npm run db:reset (local).
--
-- Stable UUIDs let product/stock seeds reference rows by id later.
-- Edit values below for your shop before running on production.

-- ---------------------------------------------------------------------------
-- Schema (idempotent — same as migration 20260529170000_system_settings_shop_fields)
-- ---------------------------------------------------------------------------
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS global_low_stock integer NOT NULL DEFAULT 5
    CHECK (global_low_stock >= 0),
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS is_telegram_notify boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- system_settings (singleton row id = 1)
-- ---------------------------------------------------------------------------
UPDATE public.system_settings
SET
  business_name = COALESCE(business_name, 'Printora'),
  business_phone = COALESCE(business_phone, '+855 12 345 678'),
  default_locale = 'km',
  global_low_stock = 5,
  allow_cashier_discount = false,
  is_telegram_notify = false
  -- Uncomment and set when Telegram is ready:
  -- , telegram_bot_token = 'YOUR_BOT_TOKEN'
  -- , telegram_chat_id = 'YOUR_CHAT_ID'
  -- , is_telegram_notify = true
WHERE id = 1;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (id, name, description, sort_order, status)
VALUES
  (
    'a1000001-0001-4001-8001-000000000001',
    'T-Shirts & Apparel',
    'Printed tees, hoodies, and wearable merchandise',
    10,
    'ACTIVE'
  ),
  (
    'a1000001-0001-4001-8001-000000000002',
    'Mugs & Drinkware',
    'Sublimation and printed cups, bottles, tumblers',
    20,
    'ACTIVE'
  ),
  (
    'a1000001-0001-4001-8001-000000000003',
    'Posters & Prints',
    'Posters, art prints, and large-format output',
    30,
    'ACTIVE'
  ),
  (
    'a1000001-0001-4001-8001-000000000004',
    'Stickers & Labels',
    'Die-cut stickers, vinyl decals, product labels',
    40,
    'ACTIVE'
  ),
  (
    'a1000001-0001-4001-8001-000000000005',
    'Bags & Totes',
    'Tote bags, pouches, and fabric carry items',
    50,
    'ACTIVE'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  status = EXCLUDED.status;

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
INSERT INTO public.suppliers (id, name, phone, email, address, notes, status)
VALUES
  (
    'b2000002-0002-4002-8002-000000000001',
    'Cambodian Garment Supply Co.',
    '+855 23 111 222',
    'orders@garmentsupply.example',
    'Phnom Penh, Cambodia',
    'Blank apparel and bulk tees',
    'ACTIVE'
  ),
  (
    'b2000002-0002-4002-8002-000000000002',
    'Phnom Penh Promo Wholesale',
    '+855 23 333 444',
    'sales@promowholesale.example',
    'Sen Sok, Phnom Penh',
    'Mugs, drinkware, promo items',
    'ACTIVE'
  ),
  (
    'b2000002-0002-4002-8002-000000000003',
    'Paper & Print Materials Ltd.',
    '+855 23 555 666',
    NULL,
    'Toul Kork, Phnom Penh',
    'Paper stock, vinyl, sticker sheets',
    'ACTIVE'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status;
