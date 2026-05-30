-- Deploy complete_sale RPC (20260530150000 was consumed by fix_stock_movements_list_balances on remote).
-- Use text for locale param so PostgREST can resolve the function signature.

CREATE OR REPLACE FUNCTION public.next_receipt_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq integer;
BEGIN
  SELECT next_receipt_seq
  INTO v_seq
  FROM public.system_settings
  WHERE id = 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settings_not_found';
  END IF;

  UPDATE public.system_settings
  SET next_receipt_seq = next_receipt_seq + 1
  WHERE id = 1;

  RETURN 'INV-' || lpad(v_seq::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_payment_method public.payment_method,
  p_locale_at_sale text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_receipt text;
  v_user_id uuid;
  v_role public.user_role;
  v_allow_discount boolean;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_line_discount numeric(14, 2);
  v_unit_price numeric(14, 2);
  v_cost_price numeric(14, 2);
  v_product_name text;
  v_sku text;
  v_old_stock integer;
  v_new_stock integer;
  v_line_subtotal numeric(14, 2);
  v_line_total numeric(14, 2);
  v_subtotal numeric(14, 2) := 0;
  v_discount_amount numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_seen uuid[] := ARRAY[]::uuid[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  v_role := public.requesting_user_role();
  IF v_role IS NULL OR v_role NOT IN ('OWNER', 'CASHIER') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_locale_at_sale IS NULL OR p_locale_at_sale NOT IN ('en', 'km') THEN
    RAISE EXCEPTION 'invalid_locale';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'no_items';
  END IF;

  SELECT allow_cashier_discount
  INTO v_allow_discount
  FROM public.system_settings
  WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'settings_not_found';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'invalid_product';
    END IF;
    IF v_product_id = ANY(v_seen) THEN
      RAISE EXCEPTION 'duplicate_product';
    END IF;
    v_seen := array_append(v_seen, v_product_id);
  END LOOP;

  v_receipt := public.next_receipt_number();

  INSERT INTO public.sales (
    receipt_number,
    cashier_id,
    status,
    subtotal,
    discount_amount,
    total,
    payment_method,
    locale_at_sale,
    telegram_sent,
    completed_at
  )
  VALUES (
    v_receipt,
    v_user_id,
    'COMPLETED',
    0,
    0,
    0,
    p_payment_method,
    p_locale_at_sale::public.locale_code,
    false,
    now()
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_line_discount := COALESCE((v_item->>'line_discount')::numeric(14, 2), 0);

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity';
    END IF;

    IF v_line_discount IS NULL OR v_line_discount < 0 THEN
      RAISE EXCEPTION 'invalid_discount';
    END IF;

    IF v_line_discount > 0 AND v_role = 'CASHIER' AND NOT v_allow_discount THEN
      RAISE EXCEPTION 'discount_not_allowed';
    END IF;

    SELECT
      p.selling_price,
      p.cost_price,
      p.name,
      p.sku,
      p.current_stock
    INTO
      v_unit_price,
      v_cost_price,
      v_product_name,
      v_sku,
      v_old_stock
    FROM public.products p
    WHERE p.id = v_product_id AND p.status = 'ACTIVE'
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found';
    END IF;

    IF v_old_stock < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;

    v_line_subtotal := v_quantity * v_unit_price;
    IF v_line_discount > v_line_subtotal THEN
      RAISE EXCEPTION 'invalid_discount';
    END IF;

    v_line_total := v_line_subtotal - v_line_discount;
    v_subtotal := v_subtotal + v_line_subtotal;
    v_discount_amount := v_discount_amount + v_line_discount;
    v_total := v_total + v_line_total;
    v_new_stock := v_old_stock - v_quantity;

    INSERT INTO public.sale_items (
      sale_id,
      product_id,
      quantity,
      unit_price,
      cost_price,
      product_name_snapshot,
      sku_snapshot,
      line_discount,
      line_total
    )
    VALUES (
      v_sale_id,
      v_product_id,
      v_quantity,
      v_unit_price,
      v_cost_price,
      v_product_name,
      v_sku,
      v_line_discount,
      v_line_total
    );

    UPDATE public.products
    SET current_stock = v_new_stock
    WHERE id = v_product_id;

    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity_delta,
      sale_id,
      created_by,
      notes
    )
    VALUES (
      v_product_id,
      'SALE',
      -v_quantity,
      v_sale_id,
      v_user_id,
      v_receipt
    );
  END LOOP;

  UPDATE public.sales
  SET
    subtotal = v_subtotal,
    discount_amount = v_discount_amount,
    total = v_total
  WHERE id = v_sale_id;

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_sale(public.payment_method, text, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
