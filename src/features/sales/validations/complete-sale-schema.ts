import { z } from "zod";

const PaymentMethodSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "ABA",
  "OTHER",
]);

const CompleteSaleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().min(0).default(0),
});

export const CompleteSaleSchema = z.object({
  paymentMethod: PaymentMethodSchema,
  items: z.array(CompleteSaleItemSchema).min(1),
});

export type CompleteSaleInput = z.infer<typeof CompleteSaleSchema>;
