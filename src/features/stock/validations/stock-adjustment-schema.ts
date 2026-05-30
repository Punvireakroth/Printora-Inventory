import { z } from "zod";

export const StockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  newQuantity: z.coerce.number().int().min(0),
  reason: z.string().trim().min(1).max(2000),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
