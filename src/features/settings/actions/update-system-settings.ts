"use server";

import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { updateSystemSettingsRecord } from "@/features/settings/services/update-system-settings";
import {
  UpdateSystemSettingsSchema,
  type UpdateSystemSettingsInput,
} from "@/features/settings/validations/system-settings-schema";

export type UpdateSystemSettingsErrorCode =
  | "invalid_input"
  | "update_failed";

export type UpdateSystemSettingsActionResult =
  | { ok: true }
  | { ok: false; code: UpdateSystemSettingsErrorCode };

export async function updateSystemSettings (
  input: unknown,
): Promise<UpdateSystemSettingsActionResult> {
  await requireOwnerOnly();

  const parsed = UpdateSystemSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "invalid_input" };
  }

  const payload: UpdateSystemSettingsInput = parsed.data;

  const result = await updateSystemSettingsRecord(payload);

  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true };
}
