import "server-only";

import type { StaffUserListItem } from "@/features/users/types/staff-user";
import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

const STAFF_LIST_SELECT =
  "id, email, full_name, role, account_status, created_at" as const;

type StaffListRow = Pick<
  UserRow,
  "id" | "email" | "full_name" | "role" | "account_status" | "created_at"
>;

function mapStaffRow (row: StaffListRow): StaffUserListItem {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    accountStatus: row.account_status,
    createdAt: row.created_at,
  };
}

export async function listStaffUsers (): Promise<StaffUserListItem[]> {
  await requireOwnerOnly();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select(STAFF_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapStaffRow);
}
