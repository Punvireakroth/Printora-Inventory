import { userIsOwner } from "@/features/auth/types/current-user";
import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { ProductsPanel } from "@/features/products/components/products-panel";
import {
  listCategoryOptions,
} from "@/features/products/services/list-lookup-options";
import { listProducts } from "@/features/products/services/list-products";
import { getTranslations } from "next-intl/server";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
  }>;
};

export async function generateMetadata () {
  const t = await getTranslations("products");
  return { title: t("title") };
}

export default async function ProductsPage ({ searchParams }: ProductsPageProps) {
  const owner = await requireOwnerUser();
  const params = await searchParams;

  const statusParam = params.status;
  const statusFilter =
    statusParam === "ACTIVE" || statusParam === "INACTIVE"
      ? statusParam
      : "ALL";

  const [products, categories] = await Promise.all([
    listProducts({
      query: params.q,
      categoryId: params.category,
      status: statusFilter,
    }),
    listCategoryOptions(),
  ]);

  return (
    <ProductsPanel
      categories={categories}
      products={products}
      showCostPrice={userIsOwner(owner)}
    />
  );
}
