"use server";

import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { createStaffUser } from "@/features/users/services/create-staff-user";
import {
  CreateStaffSchema,
  type CreateStaffInput,
} from "@/features/users/validations/create-staff-schema";

export type CreateStaffErrorCode =
  | "invalid_input"
  | "email_taken"
  | "auth_create_failed"
  | "profile_sync_failed"
  | "service_role_unconfigured";

export type CreateStaffResult =
  | { ok: true; userId: string }
  | { ok: false; code: CreateStaffErrorCode };

export async function createStaff (
  input: unknown,
): Promise<CreateStaffResult> {
  await requireOwnerUser();

  const parsed = CreateStaffSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: CreateStaffInput = {
    ...parsed.data,
    role: "CASHIER",
  };

  const result = await createStaffUser(payload);
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, userId: result.userId };
}
