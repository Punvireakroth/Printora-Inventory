-- Global cashier module permissions (owner-configurable in system_settings)

ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS cashier_allowed_modules text[] NOT NULL
  DEFAULT ARRAY['pos']::text[];

ALTER TABLE public.system_settings
  DROP CONSTRAINT IF EXISTS system_settings_cashier_allowed_modules_valid;

ALTER TABLE public.system_settings
  ADD CONSTRAINT system_settings_cashier_allowed_modules_valid
  CHECK (
    cashier_allowed_modules <@ ARRAY[
      'pos',
      'dashboard',
      'products',
      'stock',
      'sales',
      'reports',
      'categories',
      'suppliers'
    ]::text[]
    AND 'pos' = ANY (cashier_allowed_modules)
  );

-- Role helper: OWNER always passes; CASHIER checks global module list
CREATE OR REPLACE FUNCTION public.cashier_has_module(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.requesting_user_is_owner()
    OR (
      public.requesting_user_role() = 'CASHIER'
      AND EXISTS (
        SELECT 1
        FROM public.system_settings ss
        WHERE ss.id = 1
          AND p_module = ANY (ss.cashier_allowed_modules)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.cashier_has_module(text) TO authenticated;

-- Stock RPCs: allow cashiers with stock module
CREATE OR REPLACE FUNCTION public.next_stock_receive_reference()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  IF NOT (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('stock')
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(
    MAX(
      NULLIF(regexp_replace(sr.reference_number, '^REC-', ''), '')::integer
    ),
    0
  ) + 1
  INTO v_next
  FROM public.stock_receives sr
  WHERE sr.reference_number ~ '^REC-[0-9]+$';

  RETURN 'REC-' || lpad(v_next::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_stock_receive(
  p_supplier_id uuid,
  p_received_at timestamptz,
  p_notes text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receive_id uuid;
  v_ref text;
  v_user_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_cost numeric(14, 2);
  v_old_stock integer;
  v_new_stock integer;
BEGIN
  IF NOT (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('stock')
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;

  IF p_supplier_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.suppliers s
    WHERE s.id = p_supplier_id AND s.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'supplier_not_found';
  END IF;

  v_ref := public.next_stock_receive_reference();

  INSERT INTO public.stock_receives (
    supplier_id,
    reference_number,
    received_by,
    notes,
    received_at
  )
  VALUES (
    p_supplier_id,
    v_ref,
    v_user_id,
    NULLIF(trim(p_notes), ''),
    COALESCE(p_received_at, now())
  )
  RETURNING id INTO v_receive_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_cost := (v_item->>'unit_cost')::numeric(14, 2);

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'invalid_product';
    END IF;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    IF v_unit_cost IS NULL OR v_unit_cost < 0 THEN
      RAISE EXCEPTION 'invalid_unit_cost';
    END IF;

    SELECT p.current_stock
    INTO v_old_stock
    FROM public.products p
    WHERE p.id = v_product_id AND p.status = 'ACTIVE'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    v_new_stock := v_old_stock + v_quantity;

    INSERT INTO public.stock_receive_items (
      stock_receive_id,
      product_id,
      quantity,
      unit_cost
    )
    VALUES (
      v_receive_id,
      v_product_id,
      v_quantity,
      v_unit_cost
    );

    UPDATE public.products
    SET
      current_stock = v_new_stock,
      cost_price = v_unit_cost
    WHERE id = v_product_id;

    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity_delta,
      stock_receive_id,
      created_by,
      notes
    )
    VALUES (
      v_product_id,
      'STOCK_IN',
      v_quantity,
      v_receive_id,
      v_user_id,
      NULLIF(trim(p_notes), '')
    );
  END LOOP;

  RETURN v_receive_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_stock_adjustment(
  p_product_id uuid,
  p_new_quantity integer,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_adjustment_id uuid;
  v_user_id uuid;
  v_old_stock integer;
  v_delta integer;
  v_reason text;
BEGIN
  IF NOT (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('stock')
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'invalid_product';
  END IF;

  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  v_reason := NULLIF(trim(p_reason), '');
  IF v_reason IS NULL THEN
    RAISE EXCEPTION 'invalid_reason';
  END IF;

  SELECT p.current_stock
  INTO v_old_stock
  FROM public.products p
  WHERE p.id = p_product_id AND p.status = 'ACTIVE'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  v_delta := p_new_quantity - v_old_stock;

  IF v_delta = 0 THEN
    RAISE EXCEPTION 'no_change';
  END IF;

  INSERT INTO public.stock_adjustments (
    product_id,
    quantity_delta,
    reason,
    adjusted_by
  )
  VALUES (
    p_product_id,
    v_delta,
    v_reason,
    v_user_id
  )
  RETURNING id INTO v_adjustment_id;

  UPDATE public.products
  SET current_stock = p_new_quantity
  WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id,
    movement_type,
    quantity_delta,
    stock_adjustment_id,
    created_by,
    notes
  )
  VALUES (
    p_product_id,
    'ADJUSTMENT',
    v_delta,
    v_adjustment_id,
    v_user_id,
    v_reason
  );

  RETURN v_adjustment_id;
END;
$$;

-- RLS: extend mutate/read policies for granted cashier modules
DROP POLICY IF EXISTS categories_owner_all ON public.categories;
CREATE POLICY categories_owner_all
  ON public.categories FOR ALL TO authenticated
  USING (public.cashier_has_module('categories'))
  WITH CHECK (public.cashier_has_module('categories'));

DROP POLICY IF EXISTS suppliers_owner_all ON public.suppliers;
CREATE POLICY suppliers_owner_all
  ON public.suppliers FOR ALL TO authenticated
  USING (public.cashier_has_module('suppliers'))
  WITH CHECK (public.cashier_has_module('suppliers'));

DROP POLICY IF EXISTS products_select_owner_all ON public.products;
CREATE POLICY products_select_owner_all
  ON public.products FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('products')
    OR (public.requesting_user_role() = 'CASHIER' AND status = 'ACTIVE')
  );

DROP POLICY IF EXISTS products_owner_all ON public.products;
CREATE POLICY products_owner_all
  ON public.products FOR ALL TO authenticated
  USING (public.cashier_has_module('products'))
  WITH CHECK (public.cashier_has_module('products'));

DROP POLICY IF EXISTS stock_receives_owner_all ON public.stock_receives;
CREATE POLICY stock_receives_owner_all
  ON public.stock_receives FOR ALL TO authenticated
  USING (public.cashier_has_module('stock'))
  WITH CHECK (public.cashier_has_module('stock'));

DROP POLICY IF EXISTS stock_receive_items_owner_all ON public.stock_receive_items;
CREATE POLICY stock_receive_items_owner_all
  ON public.stock_receive_items FOR ALL TO authenticated
  USING (public.cashier_has_module('stock'))
  WITH CHECK (public.cashier_has_module('stock'));

DROP POLICY IF EXISTS stock_adjustments_owner_all ON public.stock_adjustments;
CREATE POLICY stock_adjustments_owner_all
  ON public.stock_adjustments FOR ALL TO authenticated
  USING (public.cashier_has_module('stock'))
  WITH CHECK (public.cashier_has_module('stock'));

DROP POLICY IF EXISTS stock_movements_owner_all ON public.stock_movements;
CREATE POLICY stock_movements_owner_all
  ON public.stock_movements FOR ALL TO authenticated
  USING (public.cashier_has_module('stock'))
  WITH CHECK (public.cashier_has_module('stock'));

DROP POLICY IF EXISTS sales_select_owner_or_own_cashier ON public.sales;
CREATE POLICY sales_select_owner_or_own_cashier
  ON public.sales FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('sales')
    OR (public.requesting_user_role() = 'CASHIER' AND cashier_id = auth.uid())
  );

DROP POLICY IF EXISTS sale_items_select_via_sale_rule ON public.sale_items;
CREATE POLICY sale_items_select_via_sale_rule
  ON public.sale_items FOR SELECT TO authenticated
  USING (
    public.requesting_user_is_owner()
    OR public.cashier_has_module('sales')
    OR (
      public.requesting_user_role() = 'CASHIER'
      AND EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_items.sale_id AND s.cashier_id = auth.uid()
      )
    )
  );

-- Product image storage for cashiers with products module
DROP POLICY IF EXISTS "Owner upload product images" ON storage.objects;
CREATE POLICY "Owner upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.cashier_has_module('products')
);

DROP POLICY IF EXISTS "Owner update product images" ON storage.objects;
CREATE POLICY "Owner update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.cashier_has_module('products'))
WITH CHECK (bucket_id = 'product-images' AND public.cashier_has_module('products'));

DROP POLICY IF EXISTS "Owner delete product images" ON storage.objects;
CREATE POLICY "Owner delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.cashier_has_module('products'));
