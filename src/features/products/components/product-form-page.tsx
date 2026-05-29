"use client";

import { ProductForm } from "@/features/products/components/product-form";
import type { LookupOption, ProductDetail } from "@/features/products/types/product";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type ProductFormPageProps = {
  mode: "create" | "edit";
  categories: LookupOption[];
  suppliers: LookupOption[];
  product?: ProductDetail;
};

export function ProductFormPage ({
  mode,
  categories,
  suppliers,
  product,
}: ProductFormPageProps) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="space-y-1">
        <nav aria-label={t("breadcrumbAria")} className="text-base text-muted-foreground">
          <Link className="hover:text-foreground" href="/products">
            {tNav("products")}
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-foreground">
            {mode === "create" ? t("newTitle") : t("editTitle")}
          </span>
        </nav>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {mode === "create" ? t("newTitle") : t("editTitle")}
        </h1>
        <p className="text-base text-muted-foreground">
          {mode === "create" ? t("newSubtitle") : t("editSubtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <ProductForm
          categories={categories}
          mode={mode}
          product={product}
          suppliers={suppliers}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        <Link className="underline-offset-4 hover:underline" href="/products">
          {tCommon("back")}
        </Link>
      </p>
    </div>
  );
}
