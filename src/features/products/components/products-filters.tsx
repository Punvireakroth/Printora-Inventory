"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { LookupOption } from "@/features/products/types/product";
import { FieldSelect } from "@/components/ui/field-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadingContext } from "@/components/layout/loading-provider";
import { useNavigationLoading } from "@/hooks/use-loading-action";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useTransition } from "react";

type ProductsFiltersProps = {
  categories: LookupOption[];
};

export function ProductsFilters ({ categories }: ProductsFiltersProps) {
  const t = useTranslations("products");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startNavigation = useNavigationLoading();
  const { navigationPending } = useLoadingContext();
  const [pending, startTransition] = useTransition();
  const isFilterPending = pending || navigationPending;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "ALL";

  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("filters.allCategories") },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories, t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: t("filters.allStatuses") },
      { value: "ACTIVE", label: t("status.ACTIVE") },
      { value: "INACTIVE", label: t("status.INACTIVE") },
    ],
    [t],
  );

  function pushFilters (next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      startNavigation();
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="products-search">{t("filters.search")}</Label>
        <Input
          defaultValue={query}
          disabled={isFilterPending}
          id="products-search"
          onChange={(event) => {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
              pushFilters({ q: event.target.value });
            }, 300);
          }}
          placeholder={t("filters.searchPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="products-category">{t("filters.category")}</Label>
        <FieldSelect
          disabled={isFilterPending}
          id="products-category"
          onValueChange={(value) => {
            pushFilters({ category: value });
          }}
          options={categoryOptions}
          placeholder={t("filters.allCategories")}
          value={categoryId}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="products-status">{t("filters.status")}</Label>
        <FieldSelect
          disabled={isFilterPending}
          id="products-status"
          onValueChange={(value) => {
            pushFilters({ status: value });
          }}
          options={statusOptions}
          placeholder={t("filters.allStatuses")}
          value={status}
        />
      </div>
    </div>
  );
}
