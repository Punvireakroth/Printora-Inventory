import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { SaleReceiptView } from "@/features/sales/components/sale-receipt-view";
import { getSaleReceipt } from "@/features/sales/services/get-sale-receipt";
import { requireCurrentUser } from "@/features/auth/services/get-current-user";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("pos.receipt");
  return { title: t("title") };
}

export default async function PosReceiptPage ({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCurrentUser();
  const { id } = await params;
  const t = await getTranslations("pos.receipt");
  const tNav = await getTranslations("navigation");

  const receipt = await getSaleReceipt(id);
  if (!receipt) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1 print:hidden">
        <PageBreadcrumb
          ariaLabel={t("breadcrumbAria")}
          items={[
            { label: tNav("pos"), href: "/pos" },
            { label: receipt.receiptNumber },
          ]}
        />
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">
          {receipt.receiptNumber}
        </p>
      </div>

      <SaleReceiptView receipt={receipt} />
    </div>
  );
}
