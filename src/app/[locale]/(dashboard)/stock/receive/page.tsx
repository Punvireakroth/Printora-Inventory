import { requireOwnerUser } from "@/features/auth/services/get-current-user";
import { listSupplierOptions } from "@/features/products/services/list-lookup-options";
import { StockReceiveForm } from "@/features/stock/components/stock-receive-form";
import { getNextReceiveReference } from "@/features/stock/services/get-next-receive-reference";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("stock.receive");
  return { title: t("title") };
}

export default async function StockReceivePage () {
  await requireOwnerUser();
  const t = await getTranslations("stock.receive");
  const tNav = await getTranslations("navigation");

  const [suppliers, nextReference] = await Promise.all([
    listSupplierOptions(),
    getNextReceiveReference(),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <nav
          aria-label={t("breadcrumbAria")}
          className="text-base text-muted-foreground"
        >
          <Link className="hover:text-foreground" href="/dashboard">
            {tNav("dashboard")}
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <Link className="hover:text-foreground" href="/stock/receives">
            {t("historyLink")}
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-foreground">{t("title")}</span>
        </nav>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
      </div>

      <StockReceiveForm
        nextReference={nextReference}
        suppliers={suppliers}
      />
    </div>
  );
}
