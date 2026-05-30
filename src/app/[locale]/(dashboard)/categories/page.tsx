import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { CategoriesPanel } from "@/features/categories/components/categories-panel";
import { listCategories } from "@/features/categories/services/list-categories";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("categories");
  return { title: t("title") };
}

export default async function CategoriesPage () {
  await requireOwnerUser();
  const categories = await listCategories();

  return <CategoriesPanel categories={categories} />;
}
