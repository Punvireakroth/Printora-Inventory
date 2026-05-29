export type StaffSelfTargetErrorCode = "cannot_modify_self" | "cannot_delete_self";

export function isSelfStaffTarget (
  ownerUserId: string,
  targetUserId: string,
): boolean {
  return ownerUserId === targetUserId;
}

export function getSelfStaffTargetError (
  ownerUserId: string,
  targetUserId: string,
  mode: "modify" | "delete",
): StaffSelfTargetErrorCode | null {
  if (!isSelfStaffTarget(ownerUserId, targetUserId)) {
    return null;
  }
  return mode === "delete" ? "cannot_delete_self" : "cannot_modify_self";
}
