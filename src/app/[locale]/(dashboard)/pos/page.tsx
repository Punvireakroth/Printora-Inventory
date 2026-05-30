import { LoadingLink } from "@/components/layout/loading-link";
import { PosScreen } from "@/features/sales/components/pos-screen";
import {
  listPosCategoryOptions,
  listProductsForPos,
} from "@/features/sales/services/list-products-for-pos";
import { getPosSettings } from "@/features/sales/services/get-pos-settings";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { History } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("pos");
  return { title: t("title") };
}

export default async function PosPage () {
  await requireCurrentUser();
  const t = await getTranslations("pos");

  const [settings, categories, initialCatalog] = await Promise.all([
    getPosSettings(),
    listPosCategoryOptions(),
    listProductsForPos(),
  ]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LoadingLink
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted/50"
          href="/pos/history"
        >
          <History aria-hidden className="size-4" />
          {t("historyLink")}
        </LoadingLink>
      </div>

      <PosScreen
        categories={categories}
        initialProducts={initialCatalog.products}
        initialTotalCount={initialCatalog.totalCount}
        settings={settings}
      />
    </div>
  );
}
