import { z } from "zod";

export const CreateStaffSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  role: z.literal("CASHIER"),
  tempPassword: z.string().min(8).max(128),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
