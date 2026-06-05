import { requireModuleAccess } from "@/features/auth/services/module-access";
import { SuppliersPanel } from "@/features/suppliers/components/suppliers-panel";
import { listSuppliers } from "@/features/suppliers/services/list-suppliers";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("suppliers");
  return { title: t("title") };
}

export default async function SuppliersPage () {
  await requireModuleAccess("suppliers");
  const suppliers = await listSuppliers();

  return <SuppliersPanel suppliers={suppliers} />;
}
