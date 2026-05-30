import { z } from "zod";

export const SupplierFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .refine(
      (value) =>
        !value || value.length === 0 || z.string().email().safeParse(value).success,
      { path: ["email"] },
    ),
  notes: z.string().trim().max(500).optional(),
});

export type SupplierFormInput = z.infer<typeof SupplierFormSchema>;

export const CreateSupplierSchema = SupplierFormSchema;

export const UpdateSupplierSchema = SupplierFormSchema.extend({
  supplierId: z.string().uuid(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
