import type { Database } from "@/types/database";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type StaffUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRow["role"];
  accountStatus: UserRow["account_status"];
  createdAt: string;
};
