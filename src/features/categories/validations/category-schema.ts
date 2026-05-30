import { z } from "zod";

export const CategoryFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
});

export type CategoryFormInput = z.infer<typeof CategoryFormSchema>;

export const CreateCategorySchema = CategoryFormSchema;

export const UpdateCategorySchema = CategoryFormSchema.extend({
  categoryId: z.string().uuid(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
