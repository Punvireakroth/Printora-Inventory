import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { StaffUsersPanel } from "@/features/users/components/staff-users-panel";
import { listStaffUsers } from "@/features/users/services/list-staff-users";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("staff");
  return { title: t("title") };
}

export default async function StaffUsersPage () {
  const owner = await requireOwnerOnly();
  const staff = await listStaffUsers();

  return <StaffUsersPanel currentUserId={owner.id} staff={staff} />;
}
