"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createSupplier } from "@/features/suppliers/actions/create-supplier";
import type { CreateSupplierErrorCode } from "@/features/suppliers/actions/create-supplier";
import { updateSupplier } from "@/features/suppliers/actions/update-supplier";
import type { UpdateSupplierErrorCode } from "@/features/suppliers/actions/update-supplier";
import type { SupplierListItem } from "@/features/suppliers/types/supplier";
import {
  SupplierFormSchema,
  type SupplierFormInput,
} from "@/features/suppliers/validations/supplier-schema";
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

type SupplierFormSheetProps = {
  mode: "create" | "edit";
  supplier?: SupplierListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function SupplierFormSheet ({
  mode,
  supplier,
  open,
  onOpenChange,
  onSuccess,
}: SupplierFormSheetProps) {
  const t = useTranslations("suppliers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const [submitError, setSubmitError] = useState<
    CreateSupplierErrorCode | UpdateSupplierErrorCode | null
  >(null);

  const form = useForm<SupplierFormInput>({
    resolver: zodResolver(SupplierFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      email: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setSubmitError(null);
    if (mode === "edit" && supplier) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        email: supplier.email ?? "",
        notes: supplier.notes ?? "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        address: "",
        email: "",
        notes: "",
      });
    }
  }, [open, mode, supplier, form]);

  async function onSubmit (values: SupplierFormInput) {
    await run(async () => {
      setSubmitError(null);

      if (mode === "create") {
        const result = await createSupplier(values);
        if (!result.ok) {
          setSubmitError(result.code);
          return;
        }
      } else if (supplier) {
        const result = await updateSupplier({
          ...values,
          supplierId: supplier.id,
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
            <Label htmlFor="supplier-name">{t("form.name")}</Label>
            <Input
              disabled={isLoading}
              id="supplier-name"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.name")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-phone">{t("form.phone")}</Label>
            <Input
              disabled={isLoading}
              id="supplier-phone"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.phone")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-address">{t("form.address")}</Label>
            <Input
              disabled={isLoading}
              id="supplier-address"
              {...form.register("address")}
            />
            {form.formState.errors.address ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.address")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-email">{t("form.email")}</Label>
            <Input
              disabled={isLoading}
              id="supplier-email"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.email")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-notes">{t("form.notes")}</Label>
            <Input
              disabled={isLoading}
              id="supplier-notes"
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? (
              <p className="text-sm text-destructive" role="alert">
                {t("validation.notes")}
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
