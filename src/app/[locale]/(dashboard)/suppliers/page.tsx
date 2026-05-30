import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { SuppliersPanel } from "@/features/suppliers/components/suppliers-panel";
import { listSuppliers } from "@/features/suppliers/services/list-suppliers";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("suppliers");
  return { title: t("title") };
}

export default async function SuppliersPage () {
  await requireOwnerUser();
  const suppliers = await listSuppliers();

  return <SuppliersPanel suppliers={suppliers} />;
}
