-- Re-anchor movement old/new stock to products.current_stock (see 20260530140000).

CREATE OR REPLACE VIEW public.stock_movements_list
WITH (security_invoker = true)
AS
SELECT
  sm.id,
  sm.product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  sm.movement_type,
  sm.quantity_delta,
  (
    (p.current_stock - pdt.total_delta)
    + SUM(sm.quantity_delta) OVER (
      PARTITION BY sm.product_id
      ORDER BY sm.created_at ASC, sm.id ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )
    - sm.quantity_delta
  )::integer AS old_stock,
  (
    (p.current_stock - pdt.total_delta)
    + SUM(sm.quantity_delta) OVER (
      PARTITION BY sm.product_id
      ORDER BY sm.created_at ASC, sm.id ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )
  )::integer AS new_stock,
  sm.stock_receive_id,
  sm.sale_id,
  sm.stock_adjustment_id,
  sm.created_by,
  COALESCE(NULLIF(trim(u.full_name), ''), u.email, '—') AS created_by_name,
  sm.notes,
  sm.created_at
FROM public.stock_movements sm
INNER JOIN public.products p ON p.id = sm.product_id
INNER JOIN (
  SELECT
    product_id,
    SUM(quantity_delta)::integer AS total_delta
  FROM public.stock_movements
  GROUP BY product_id
) pdt ON pdt.product_id = sm.product_id
INNER JOIN public.users u ON u.id = sm.created_by;

GRANT SELECT ON public.stock_movements_list TO authenticated;
