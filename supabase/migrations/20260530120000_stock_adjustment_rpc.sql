-- Atomic stock adjustment: adjustment record, product stock update, movement (ADJUSTMENT)

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
  IF NOT public.requesting_user_is_owner() THEN
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

GRANT EXECUTE ON FUNCTION public.create_stock_adjustment(uuid, integer, text) TO authenticated;
