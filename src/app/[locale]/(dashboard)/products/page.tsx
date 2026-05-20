import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <ModulePlaceholder params={params} titleKey="products" />;
}
