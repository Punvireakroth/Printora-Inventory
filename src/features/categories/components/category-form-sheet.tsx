"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createCategory } from "@/features/categories/actions/create-category";
import type { CreateCategoryErrorCode } from "@/features/categories/actions/create-category";
import { updateCategory } from "@/features/categories/actions/update-category";
import type { UpdateCategoryErrorCode } from "@/features/categories/actions/update-category";
import type { CategoryListItem } from "@/features/categories/types/category";
import {
  CategoryFormSchema,
  type CategoryFormInput,
} from "@/features/categories/validations/category-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type CategoryFormSheetProps = {
  mode: "create" | "edit";
  category?: CategoryListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CategoryFormSheet ({
  mode,
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryFormSheetProps) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [submitError, setSubmitError] = useState<
    CreateCategoryErrorCode | UpdateCategoryErrorCode | null
  >(null);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setSubmitError(null);
    if (mode === "edit" && category) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
      });
    } else {
      form.reset({ name: "", description: "" });
    }
  }, [open, mode, category, form]);

  async function onSubmit (values: CategoryFormInput) {
    await run(async () => {
      setSubmitError(null);

      if (mode === "create") {
        const result = await createCategory(values);
        if (!result.ok) {
          setSubmitError(result.code);
          return;
        }
      } else if (category) {
        const result = await updateCategory({
          ...values,
          categoryId: category.id,
        });
        if (!result.ok) {
          setSubmitError(result.code);
          return;
        }
      }

      router.refresh();
      onSuccess();
    });
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md" side="right">
        <SheetHeader className="px-4 pt-4">
          <SheetTitle>
            {mode === "create" ? t("sheet.createTitle") : t("sheet.editTitle")}
          </SheetTitle>
          <SheetDescription>{t("sheet.description")}</SheetDescription>
        </SheetHeader>

        <form
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="category-name">{t("form.name")}</Label>
            <Input
              disabled={isLoading}
              id="category-name"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">{t("form.description")}</Label>
            <Input
              disabled={isLoading}
              id="category-description"
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.description")}
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {t(`errors.${submitError}`)}
            </p>
          ) : null}

          <div className="mt-auto flex gap-2 pt-2">
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {tCommon("cancel")}
            </Button>
            <Button disabled={isLoading} type="submit">
              {isLoading ? tCommon("loading") : t("form.save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
