import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { ProductFormPage } from "@/features/products/components/product-form-page";
import { getProductById } from "@/features/products/services/get-product";
import {
  listCategoryOptions,
  listSupplierOptions,
} from "@/features/products/services/list-lookup-options";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata () {
  const t = await getTranslations("products");
  return { title: t("editTitle") };
}

export default async function EditProductPage ({ params }: EditProductPageProps) {
  await requireOwnerUser();
  const { id } = await params;

  const [product, categories, suppliers] = await Promise.all([
    getProductById(id),
    listCategoryOptions(),
    listSupplierOptions(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductFormPage
      categories={categories}
      mode="edit"
      product={product}
      suppliers={suppliers}
    />
  );
}
