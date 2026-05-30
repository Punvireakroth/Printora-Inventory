"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleCategoryStatus } from "@/features/categories/actions/toggle-category-status";
import { CategoryFormSheet } from "@/features/categories/components/category-form-sheet";
import type { CategoryListItem } from "@/features/categories/types/category";
import { LoadingLink } from "@/components/layout/loading-link";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type CategoriesPanelProps = {
  categories: CategoryListItem[];
};

function CategoryRow ({ category }: { category: CategoryListItem }) {
  const t = useTranslations("categories");
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [status, setStatus] = useState(category.status);
  const [editOpen, setEditOpen] = useState(false);
  const isActive = status === "ACTIVE";

  function handleStatusChange (checked: boolean) {
    const nextStatus = checked ? "ACTIVE" : "INACTIVE";
    const previous = status;
    setStatus(nextStatus);

    void run(async () => {
      const result = await toggleCategoryStatus({
        categoryId: category.id,
        status: nextStatus,
      });

      if (!result.ok) {
        setStatus(previous);
        return;
      }

      setStatus(result.status);
      if (result.status === "INACTIVE") {
        toast.warning(
          t("inactiveWarning", { name: category.name }),
        );
      }
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell className="px-4 py-3 font-medium whitespace-normal">
        <span className="line-clamp-2">{category.name}</span>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">
        <span className="line-clamp-2">
          {category.description?.trim() ? category.description : "—"}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <Badge variant={isActive ? "active" : "destructive"}>
          {t(`status.${status}`)}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 whitespace-normal">
        <div className="flex items-center justify-end gap-2">
          <Button
            aria-label={t("editAria", { name: category.name })}
            onClick={() => setEditOpen(true)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden className="size-4" />
          </Button>
          <Switch
            aria-label={t("toggleAria", { name: category.name })}
            checked={isActive}
            disabled={isLoading}
            onCheckedChange={handleStatusChange}
          />
          <CategoryFormSheet
            category={category}
            mode="edit"
            onOpenChange={setEditOpen}
            onSuccess={() => setEditOpen(false)}
            open={editOpen}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CategoriesPanel ({ categories }: CategoriesPanelProps) {
  const t = useTranslations("categories");
  const tNav = useTranslations("navigation");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <nav
            aria-label={t("breadcrumbAria")}
            className="text-base text-primary"
          >
            <LoadingLink
              className="text-primary hover:text-primary/80"
              href="/settings"
            >
              {tNav("settings")}
            </LoadingLink>
            <span aria-hidden className="mx-2 text-primary">
              /
            </span>
            <span className="text-primary">{t("title")}</span>
          </nav>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} type="button">
          <Plus aria-hidden className="size-4" />
          {t("add")}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <Table
            className="table-fixed"
            containerClassName="overflow-x-hidden"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%] px-4 py-3 whitespace-normal">
                  {t("columns.name")}
                </TableHead>
                <TableHead className="w-[37%] px-4 py-3 whitespace-normal">
                  {t("columns.description")}
                </TableHead>
                <TableHead className="w-[15%] px-4 py-3 whitespace-normal">
                  {t("columns.status")}
                </TableHead>
                <TableHead className="w-[20%] px-4 py-3 text-right whitespace-normal">
                  {t("columns.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <CategoryRow category={category} key={category.id} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CategoryFormSheet
        mode="create"
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
        open={createOpen}
      />
    </div>
  );
}
