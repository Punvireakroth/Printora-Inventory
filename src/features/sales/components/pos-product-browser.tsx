"use client";

import { listProductsForPosAction } from "@/features/sales/actions/list-products-for-pos";
import { searchProductsForPosAction } from "@/features/sales/actions/search-products-for-pos";
import { PosProductCard } from "@/features/sales/components/pos-product-card";
import { POS_BROWSE_PAGE_SIZE } from "@/features/sales/constants/pos-browse";
import type { PosProductHit } from "@/features/sales/types/pos";
import type { LookupOption } from "@/features/products/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

type PosProductBrowserProps = {
  categories: LookupOption[];
  initialProducts: PosProductHit[];
  initialTotalCount: number;
  cartQuantities: Record<string, number>;
  highlightedProductId: string | null;
  disabled?: boolean;
  onSelectProduct: (product: PosProductHit) => void;
};

export function PosProductBrowser ({
  categories,
  initialProducts,
  initialTotalCount,
  cartQuantities,
  highlightedProductId,
  disabled = false,
  onSelectProduct,
}: PosProductBrowserProps) {
  const t = useTranslations("pos");
  const tCommon = useTranslations("common");
  const searchFieldId = useId();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [browseProducts, setBrowseProducts] = useState(initialProducts);
  const [browseTotalCount, setBrowseTotalCount] = useState(initialTotalCount);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseHasMore, setBrowseHasMore] = useState(
    initialProducts.length < initialTotalCount,
  );
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [searchResults, setSearchResults] = useState<PosProductHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const trimmedSearch = searchQuery.trim();
  const isSearchMode = trimmedSearch.length >= 2;

  const displayedProducts = isSearchMode ? searchResults : browseProducts;

  const statusLabel = useMemo(() => {
    if (isSearchMode) {
      if (searchLoading) {
        return tCommon("loading");
      }
      return t("browse.searchResults", { count: searchResults.length });
    }

    if (browseLoading) {
      return tCommon("loading");
    }

    return t("browse.showing", {
      shown: browseProducts.length,
      total: browseTotalCount,
    });
  }, [
    isSearchMode,
    searchLoading,
    searchResults.length,
    browseLoading,
    browseProducts.length,
    browseTotalCount,
    t,
    tCommon,
  ]);

  const loadBrowsePage = useCallback(
    async (page: number, nextCategoryId: string | null, append: boolean) => {
      if (append) {
        setLoadMoreLoading(true);
      } else {
        setBrowseLoading(true);
      }

      try {
        const result = await listProductsForPosAction({
          categoryId: nextCategoryId,
          page,
          pageSize: POS_BROWSE_PAGE_SIZE,
        });

        setBrowseProducts((prev) =>
          append ? [...prev, ...result.products] : result.products,
        );
        setBrowseTotalCount(result.totalCount);
        setBrowseHasMore(result.hasMore);
        setBrowsePage(page);
      } finally {
        setBrowseLoading(false);
        setLoadMoreLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isSearchMode) {
      setSearchLoading(true);
      const handle = setTimeout(() => {
        void searchProductsForPosAction(trimmedSearch)
          .then((hits) => setSearchResults(hits))
          .finally(() => setSearchLoading(false));
      }, 300);

      return () => clearTimeout(handle);
    }

    setSearchResults([]);
    return undefined;
  }, [isSearchMode, trimmedSearch]);

  function handleCategoryChange (nextCategoryId: string | null) {
    setCategoryId(nextCategoryId);
    void loadBrowsePage(1, nextCategoryId, false);
  }

  function handleClearSearch () {
    setSearchQuery("");
    setSearchResults([]);
  }

  const gridLoading = isSearchMode ? searchLoading : browseLoading;
  const showEmptyState =
    !gridLoading && displayedProducts.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-1 space-y-3 rounded-xl border border-border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            autoComplete="off"
            className="h-11 pr-10 pl-10 text-base"
            disabled={disabled}
            id={searchFieldId}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("search.placeholder")}
            value={searchQuery}
          />
          {searchQuery ? (
            <Button
              aria-label={t("browse.clearSearch")}
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
              disabled={disabled}
              onClick={handleClearSearch}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        {!isSearchMode ? (
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryPill
              active={categoryId === null}
              disabled={disabled || browseLoading}
              label={t("browse.allCategories")}
              onClick={() => handleCategoryChange(null)}
            />
            {categories.map((category) => (
              <CategoryPill
                active={categoryId === category.id}
                disabled={disabled || browseLoading}
                key={category.id}
                label={category.name}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("browse.searchHint")}</p>
        )}

        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {statusLabel}
        </p>
      </div>

      <div className="relative min-h-[12rem] flex-1">
        {gridLoading && displayedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Spinner label={tCommon("loading")} size="md" />
            <p>{tCommon("loading")}</p>
          </div>
        ) : null}

        {displayedProducts.length > 0 ? (
          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              gridLoading && displayedProducts.length > 0 && "opacity-70",
            )}
          >
            {displayedProducts.map((product) => (
              <PosProductCard
                cartQuantity={cartQuantities[product.id] ?? 0}
                disabled={disabled}
                highlighted={highlightedProductId === product.id}
                key={product.id}
                onSelect={() => onSelectProduct(product)}
                product={product}
              />
            ))}
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-16 text-center">
            <p className="text-base font-medium">
              {isSearchMode ? t("search.noResults") : t("browse.empty")}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {isSearchMode ? t("browse.tryDifferentSearch") : t("browse.emptyHint")}
            </p>
          </div>
        ) : null}

        {!isSearchMode && browseHasMore && displayedProducts.length > 0 ? (
          <div className="mt-4 flex justify-center">
            <Button
              disabled={disabled || loadMoreLoading}
              onClick={() => void loadBrowsePage(browsePage + 1, categoryId, true)}
              type="button"
              variant="outline"
            >
              {loadMoreLoading ? (
                <Spinner label={tCommon("loading")} size="sm" />
              ) : null}
              {loadMoreLoading ? tCommon("loading") : t("browse.loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CategoryPill ({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:outline-none",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60",
        disabled && "pointer-events-none opacity-50",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
