-- Atomic stock receive: receive header, line items, product stock, movements (STOCK_IN)

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
  IF NOT public.requesting_user_is_owner() THEN
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
  IF NOT public.requesting_user_is_owner() THEN
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

GRANT EXECUTE ON FUNCTION public.next_stock_receive_reference() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stock_receive(uuid, timestamptz, text, jsonb) TO authenticated;
