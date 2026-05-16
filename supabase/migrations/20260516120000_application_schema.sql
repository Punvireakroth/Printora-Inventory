-- Printora Inventory — core schema, RLS baseline, product images bucket
-- Locales: en | km (CHECK constraints + domain)
-- Postgres 17+: gen_random_uuid() is built in (no pgcrypto required).
--
-- Cashier completes a sale → stock_moves + products.current_stock should run
-- in a SERVER context (transactional Postgres function or Next.js Supabase client
-- with SERVICE_ROLE_SECRET) because RLS allows only OWNER writes on products
-- and stock_movements for authenticated JWTs.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('OWNER', 'CASHIER');
CREATE TYPE public.active_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE public.stock_movement_type AS ENUM ('STOCK_IN', 'SALE', 'ADJUSTMENT', 'REFUND');
CREATE TYPE public.sale_status AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE public.payment_method AS ENUM ('CASH', 'BANK_TRANSFER', 'ABA', 'OTHER');

CREATE DOMAIN public.locale_code AS text
  CONSTRAINT locale_code_check CHECK (VALUE IN ('en', 'km'));

-- ---------------------------------------------------------------------------
-- Helper: updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  full_name text,
  role public.user_role NOT NULL DEFAULT 'CASHIER',
  account_status public.active_status NOT NULL DEFAULT 'ACTIVE',
  preferred_locale public.locale_code NOT NULL DEFAULT 'km',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_role_idx ON public.users (role);
CREATE INDEX users_account_status_idx ON public.users (account_status);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Role helpers (SECURITY DEFINER avoids RLS recursion on public.users)
CREATE OR REPLACE FUNCTION public.requesting_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.requesting_user_is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'OWNER'
  );
$$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.active_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  status public.active_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER suppliers_set_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES public.suppliers (id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  description text,
  size text,
  color text,
  cost_price numeric(14, 2) NOT NULL DEFAULT 0,
  selling_price numeric(14, 2) NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock integer NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  image_path text,
  status public.active_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_category_id_idx ON public.products (category_id);
CREATE INDEX products_supplier_id_idx ON public.products (supplier_id);
CREATE INDEX products_name_idx ON public.products (name);
CREATE INDEX products_low_stock_idx ON public.products (current_stock, minimum_stock)
  WHERE status = 'ACTIVE';

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.stock_receives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers (id) ON DELETE SET NULL,
  reference_number text,
  received_by uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  notes text,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_receives_supplier_idx ON public.stock_receives (supplier_id);
CREATE INDEX stock_receives_received_at_idx ON public.stock_receives (received_at DESC);

CREATE TABLE public.stock_receive_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_receive_id uuid NOT NULL REFERENCES public.stock_receives (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14, 2) NOT NULL CHECK (unit_cost >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stock_receive_id, product_id)
);

CREATE INDEX stock_receive_items_receive_idx ON public.stock_receive_items (stock_receive_id);

CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity_delta integer NOT NULL,
  reason text,
  adjusted_by uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_adjustments_product_idx ON public.stock_adjustments (product_id, created_at DESC);

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number text NOT NULL UNIQUE,
  cashier_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  status public.sale_status NOT NULL DEFAULT 'COMPLETED',
  subtotal numeric(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method public.payment_method NOT NULL DEFAULT 'CASH',
  locale_at_sale public.locale_code NOT NULL DEFAULT 'km',
  telegram_sent boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_cashier_idx ON public.sales (cashier_id, completed_at DESC);
CREATE INDEX sales_completed_at_idx ON public.sales (completed_at DESC);
CREATE INDEX sales_status_idx ON public.sales (status);

CREATE TRIGGER sales_set_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14, 2) NOT NULL CHECK (unit_price >= 0),
  cost_price numeric(14, 2) NOT NULL CHECK (cost_price >= 0),
  product_name_snapshot text NOT NULL,
  sku_snapshot text NOT NULL,
  line_discount numeric(14, 2) NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
  line_total numeric(14, 2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sale_items_sale_idx ON public.sale_items (sale_id);

CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  movement_type public.stock_movement_type NOT NULL,
  quantity_delta integer NOT NULL,
  stock_receive_id uuid REFERENCES public.stock_receives (id) ON DELETE SET NULL,
  sale_id uuid REFERENCES public.sales (id) ON DELETE SET NULL,
  stock_adjustment_id uuid REFERENCES public.stock_adjustments (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_movements_product_idx ON public.stock_movements (product_id, created_at DESC);
CREATE INDEX stock_movements_sale_idx ON public.stock_movements (sale_id);

CREATE TABLE public.system_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_locale public.locale_code NOT NULL DEFAULT 'km',
  next_receipt_seq integer NOT NULL DEFAULT 1 CHECK (next_receipt_seq >= 1),
  allow_cashier_discount boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.system_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER system_settings_set_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth → public.users sync
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, preferred_locale, account_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'CASHIER',
    'km',
    'ACTIVE'
  )
  ON CONFLICT (id) DO UPDATE SET email = excluded.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_receive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Grants for API roles (policies constrain access)
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

GRANT USAGE ON TYPE public.user_role TO authenticated;
GRANT USAGE ON TYPE public.active_status TO authenticated;
GRANT USAGE ON TYPE public.stock_movement_type TO authenticated;
GRANT USAGE ON TYPE public.sale_status TO authenticated;
GRANT USAGE ON TYPE public.payment_method TO authenticated;
GRANT USAGE ON DOMAIN public.locale_code TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.requesting_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.requesting_user_is_owner() TO authenticated;

-- users
CREATE POLICY users_select_own_or_owner_all
  ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.requesting_user_is_owner());

CREATE POLICY users_update_self_locale_or_owner
  ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.requesting_user_is_owner())
  WITH CHECK (id = auth.uid() OR public.requesting_user_is_owner());

-- Trigger creates rows; prohibit client inserts (profiles come from Auth)
CREATE POLICY users_insert_none_for_authenticated
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (false);

-- categories & suppliers — read for authenticated POS/UI; mutate owner only
CREATE POLICY categories_select_authenticated
  ON public.categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY categories_owner_all
  ON public.categories FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

CREATE POLICY suppliers_select_authenticated
  ON public.suppliers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY suppliers_owner_all
  ON public.suppliers FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

-- products — cashier sees ACTIVE for POS and needs cost blind for cashier on read (app hides in UI); DB still exposes columns; Phase 2 can refine with view
CREATE POLICY products_select_owner_all
  ON public.products FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR (public.requesting_user_role() = 'CASHIER' AND status = 'ACTIVE')
  );

CREATE POLICY products_owner_all
  ON public.products FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

-- Inventory admin tables — OWNER only (cashier mutations go through backend/service_role or RPC in later phases)
CREATE POLICY stock_receives_owner_all
  ON public.stock_receives FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

CREATE POLICY stock_receive_items_owner_all
  ON public.stock_receive_items FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

CREATE POLICY stock_adjustments_owner_all
  ON public.stock_adjustments FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

CREATE POLICY stock_movements_owner_all
  ON public.stock_movements FOR ALL TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

-- sales
CREATE POLICY sales_select_owner_or_own_cashier
  ON public.sales FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR (public.requesting_user_role() = 'CASHIER' AND cashier_id = auth.uid())
  );

CREATE POLICY sales_insert_own_cashier_or_owner
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (
    public.requesting_user_is_owner()
    OR (public.requesting_user_role() = 'CASHIER' AND cashier_id = auth.uid())
  );

CREATE POLICY sales_update_owner
  ON public.sales FOR UPDATE TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

-- Updating telegram_sent (and other totals) stays on the server/service_role RPC.

CREATE POLICY sales_delete_owner
  ON public.sales FOR DELETE TO authenticated
  USING (public.requesting_user_is_owner());

-- sale_items
CREATE POLICY sale_items_select_via_sale_rule
  ON public.sale_items FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR (
      public.requesting_user_role() = 'CASHIER'
      AND EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_items.sale_id AND s.cashier_id = auth.uid()
      )
    )
  );

CREATE POLICY sale_items_insert_owner_or_own_cashier
  ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (
    public.requesting_user_is_owner()
    OR EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id AND s.cashier_id = auth.uid()
        AND public.requesting_user_role() = 'CASHIER'
    )
  );

CREATE POLICY sale_items_update_owner_only
  ON public.sale_items FOR UPDATE TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

CREATE POLICY sale_items_delete_owner_only
  ON public.sale_items FOR DELETE TO authenticated
  USING (public.requesting_user_is_owner());

-- system_settings — read for prefs; write owner only
CREATE POLICY system_settings_select_authenticated
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY system_settings_update_owner_only
  ON public.system_settings FOR UPDATE TO authenticated
  USING (public.requesting_user_is_owner())
  WITH CHECK (public.requesting_user_is_owner());

-- ---------------------------------------------------------------------------
-- Storage: product-images (public read)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;

CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Owner upload product images" ON storage.objects;
CREATE POLICY "Owner upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.requesting_user_is_owner()
);

DROP POLICY IF EXISTS "Owner update product images" ON storage.objects;
CREATE POLICY "Owner update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.requesting_user_is_owner())
WITH CHECK (bucket_id = 'product-images' AND public.requesting_user_is_owner());

DROP POLICY IF EXISTS "Owner delete product images" ON storage.objects;
CREATE POLICY "Owner delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.requesting_user_is_owner());
