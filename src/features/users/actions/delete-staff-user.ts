"use server";

import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { getSelfStaffTargetError } from "@/features/users/lib/staff-target-guards";
import { deleteStaffUser } from "@/features/users/services/delete-staff-user";
import { z } from "zod";

const DeleteStaffInputSchema = z.object({
  userId: z.string().uuid(),
});

export type DeleteStaffErrorCode =
  | "invalid_input"
  | "cannot_delete_self"
  | "not_found"
  | "cannot_delete_owner"
  | "auth_delete_failed"
  | "service_role_unconfigured";

export type DeleteStaffResult =
  | { ok: true }
  | { ok: false; code: DeleteStaffErrorCode };

export async function deleteStaff (
  input: unknown,
): Promise<DeleteStaffResult> {
  const owner = await requireOwnerOnly();

  const parsed = DeleteStaffInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const selfError = getSelfStaffTargetError(
    owner.id,
    parsed.data.userId,
    "delete",
  );
  if (selfError) {
    return { ok: false, code: "cannot_delete_self" };
  }

  const result = await deleteStaffUser(parsed.data.userId);
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true };
}
