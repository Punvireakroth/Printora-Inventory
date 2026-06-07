-- Aggregate completed-sale quantities per product for POS best-seller ordering.
-- SECURITY DEFINER so cashiers with only the pos module see store-wide totals.

CREATE OR REPLACE FUNCTION public.get_product_quantity_sold_map()
RETURNS TABLE (
  product_id uuid,
  quantity_sold bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    si.product_id,
    COALESCE(SUM(si.quantity), 0)::bigint AS quantity_sold
  FROM public.sale_items si
  INNER JOIN public.sales s ON s.id = si.sale_id
  WHERE s.status = 'COMPLETED'
  GROUP BY si.product_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_product_quantity_sold_map() TO authenticated;
