import { z } from "zod";

export const ProductFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9-]+$/),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid().nullable().optional(),
  size: z.string().trim().max(64).optional(),
  color: z.string().trim().max(64).optional(),
  costPrice: z.number().min(0).max(999_999_999),
  sellingPrice: z.number().min(0).max(999_999_999),
  currentStock: z.number().int().min(0),
  minimumStock: z.number().int().min(0),
  imagePath: z.string().trim().max(500).nullable().optional(),
});

export const CreateProductSchema = ProductFormSchema;

export const UpdateProductSchema = ProductFormSchema.extend({
  productId: z.string().uuid(),
});

export type ProductFormInput = z.infer<typeof ProductFormSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
