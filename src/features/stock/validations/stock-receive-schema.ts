import { z } from "zod";

const StockReceiveLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().min(0),
});

export const StockReceiveSchema = z.object({
  supplierId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .transform((value) => (value === "" || value === null ? null : value)),
  receivedAt: z.string().min(1),
  notes: z.string().max(2000).optional().default(""),
  items: z.array(StockReceiveLineSchema).min(1),
});

export type StockReceiveInput = z.infer<typeof StockReceiveSchema>;
