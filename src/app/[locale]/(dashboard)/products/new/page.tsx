import { requireModuleAccess } from "@/features/auth/services/module-access";
import { ProductFormPage } from "@/features/products/components/product-form-page";
import {
  listCategoryOptions,
  listSupplierOptions,
} from "@/features/products/services/list-lookup-options";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("products");
  return { title: t("newTitle") };
}

export default async function NewProductPage () {
  await requireModuleAccess("products");

  const [categories, suppliers] = await Promise.all([
    listCategoryOptions(),
    listSupplierOptions(),
  ]);

  return (
    <ProductFormPage
      categories={categories}
      mode="create"
      suppliers={suppliers}
    />
  );
}
