"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createProduct } from "@/features/products/actions/create-product";
import type { CreateProductErrorCode } from "@/features/products/actions/create-product";
import { updateProduct } from "@/features/products/actions/update-product";
import type { UpdateProductErrorCode } from "@/features/products/actions/update-product";
import { suggestProductSku } from "@/features/products/lib/suggest-product-sku";
import { uploadProductImage } from "@/features/products/lib/upload-product-image-client";
import type { LookupOption, ProductDetail } from "@/features/products/types/product";
import {
  ProductFormSchema,
  type ProductFormInput,
} from "@/features/products/validations/product-schema";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { LoadingLink } from "@/components/layout/loading-link";
import { useCurrentUser } from "@/features/auth/components/current-user-provider";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

const textareaClassName =
  "flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:ring-ring/35 focus-visible:ring-[3px] focus-visible:outline-none";

type ProductFormProps = {
  mode: "create" | "edit";
  categories: LookupOption[];
  suppliers: LookupOption[];
  product?: ProductDetail;
};

type SubmitErrorCode = CreateProductErrorCode | UpdateProductErrorCode | "image_invalid_type" | "image_too_large" | "image_upload_failed";

function toDefaultValues (
  product: ProductDetail | undefined,
): ProductFormInput {
  if (!product) {
    return {
      name: "",
      sku: "",
      description: "",
      categoryId: "",
      supplierId: null,
      size: "",
      color: "",
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      imagePath: null,
    };
  }

  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    size: product.size ?? "",
    color: product.color ?? "",
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    currentStock: product.currentStock,
    minimumStock: product.minimumStock,
    imagePath: product.imagePath,
  };
}

export function ProductForm ({
  mode,
  categories,
  suppliers,
  product,
}: ProductFormProps) {
  const t = useTranslations("products");
  const { isCashier } = useCurrentUser();
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { run, isLoading } = useLoadingAction();
  const fileInputId = useId();
  const storagePrefixRef = useRef(product?.id ?? crypto.randomUUID());
  const skuTouchedRef = useRef(Boolean(product?.sku));
  const [submitError, setSubmitError] = useState<SubmitErrorCode | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    product?.imageUrl ?? null,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: toDefaultValues(product),
  });

  const fieldError = (field: keyof ProductFormInput) => {
    if (!form.formState.errors[field]) {
      return null;
    }
    if (field === "name") {
      return t("validation.name");
    }
    if (field === "sku") {
      return t("validation.sku");
    }
    if (field === "categoryId") {
      return t("validation.categoryId");
    }
    if (field === "costPrice") {
      return t("validation.costPrice");
    }
    if (field === "sellingPrice") {
      return t("validation.sellingPrice");
    }
    if (field === "currentStock") {
      return t("validation.currentStock");
    }
    if (field === "minimumStock") {
      return t("validation.minimumStock");
    }
    return t("validation.generic");
  };

  function handleNameChange (value: string) {
    form.setValue("name", value, { shouldValidate: true });
    if (!skuTouchedRef.current) {
      const suggested = suggestProductSku(value);
      if (suggested) {
        form.setValue("sku", suggested, { shouldValidate: true });
      }
    }
  }

  async function onSubmit (values: ProductFormInput) {
    await run(async () => {
      setSubmitError(null);

      let imagePath = values.imagePath ?? null;

      if (pendingFile) {
        const upload = await uploadProductImage(
          pendingFile,
          storagePrefixRef.current,
        );

        if (!upload.ok) {
          if (upload.code === "invalid_type") {
            setSubmitError("image_invalid_type");
          } else if (upload.code === "too_large") {
            setSubmitError("image_too_large");
          } else {
            setSubmitError("image_upload_failed");
          }
          return;
        }

        imagePath = upload.path;
        setImagePreviewUrl(upload.publicUrl);
      }

      const payload = {
        ...values,
        imagePath,
      };

      if (mode === "create") {
        const result = await createProduct(payload);
        if (!result.ok) {
          setSubmitError(result.code);
          return;
        }
        router.push("/products");
        router.refresh();
        return;
      }

      if (!product) {
        return;
      }

      const result = await updateProduct({
        ...payload,
        productId: product.id,
      });

      if (!result.ok) {
        setSubmitError(result.code);
        return;
      }

      router.push("/products");
      router.refresh();
    });
  }

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${submitError}`)}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-name">{t("form.name")}</Label>
          <Input
            id="product-name"
            {...form.register("name", {
              onChange: (event) => handleNameChange(event.target.value),
            })}
          />
          {fieldError("name") ? (
            <p className="text-xs text-destructive">{fieldError("name")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-sku">{t("form.sku")}</Label>
          <Input
            id="product-sku"
            {...form.register("sku")}
            onChange={(event) => {
              skuTouchedRef.current = true;
              form.setValue("sku", event.target.value.toUpperCase(), {
                shouldValidate: true,
              });
            }}
          />
          <p className="text-xs text-muted-foreground">{t("form.skuHint")}</p>
          {fieldError("sku") ? (
            <p className="text-xs text-destructive">{fieldError("sku")}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category">{t("form.category")}</Label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <FieldSelect
                aria-invalid={fieldState.invalid}
                id="product-category"
                onValueChange={field.onChange}
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                placeholder={t("form.selectCategory")}
                value={field.value}
              />
            )}
          />
          {fieldError("categoryId") ? (
            <p className="text-xs text-destructive">{fieldError("categoryId")}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="product-description">{t("form.description")}</Label>
          <textarea
            className={textareaClassName}
            id="product-description"
            {...form.register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-supplier">{t("form.supplier")}</Label>
          <Controller
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FieldSelect
                id="product-supplier"
                onValueChange={(value) => {
                  field.onChange(value === "" ? null : value);
                }}
                options={[
                  { value: "", label: t("form.noSupplier") },
                  ...suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                  })),
                ]}
                placeholder={t("form.noSupplier")}
                value={field.value ?? ""}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-size">{t("form.size")}</Label>
          <Input id="product-size" {...form.register("size")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-color">{t("form.color")}</Label>
          <Input id="product-color" {...form.register("color")} />
        </div>

        {!isCashier ? (
          <div className="space-y-2">
            <Label htmlFor="product-cost">{t("form.costPrice")}</Label>
            <Input
              id="product-cost"
              min={0}
              step="0.01"
              type="number"
              {...form.register("costPrice", { valueAsNumber: true })}
            />
            {fieldError("costPrice") ? (
              <p className="text-xs text-destructive">{fieldError("costPrice")}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="product-price">{t("form.sellingPrice")}</Label>
          <Input
            id="product-price"
            min={0}
            step="0.01"
            type="number"
            {...form.register("sellingPrice", { valueAsNumber: true })}
          />
          {fieldError("sellingPrice") ? (
            <p className="text-xs text-destructive">{fieldError("sellingPrice")}</p>
          ) : null}
        </div>

        {mode === "create" ? (
          <div className="space-y-2">
            <Label htmlFor="product-current-stock">{t("form.currentStock")}</Label>
            <Input
              id="product-current-stock"
              min={0}
              step={1}
              type="number"
              {...form.register("currentStock", { valueAsNumber: true })}
            />
            {fieldError("currentStock") ? (
              <p className="text-xs text-destructive">{fieldError("currentStock")}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>{t("form.currentStock")}</Label>
            <Input disabled readOnly value={product?.currentStock ?? 0} />
            <p className="text-xs text-muted-foreground">{t("form.stockReadOnlyHint")}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="product-min-stock">{t("form.minimumStock")}</Label>
          <Input
            id="product-min-stock"
            min={0}
            step={1}
            type="number"
            {...form.register("minimumStock", { valueAsNumber: true })}
          />
          {fieldError("minimumStock") ? (
            <p className="text-xs text-destructive">{fieldError("minimumStock")}</p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={fileInputId}>{t("form.image")}</Label>
          <Input
            accept="image/jpeg,image/png,image/webp,image/gif"
            id={fileInputId}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setPendingFile(file);
              if (file) {
                setImagePreviewUrl(URL.createObjectURL(file));
              } else {
                setImagePreviewUrl(product?.imageUrl ?? null);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">{t("form.imageHint")}</p>
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="mt-2 size-24 rounded-md border border-border object-cover"
              height={96}
              src={imagePreviewUrl}
              width={96}
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <LoadingLink
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-base font-medium hover:bg-muted"
          href="/products"
        >
          {tCommon("cancel")}
        </LoadingLink>
        <Button disabled={form.formState.isSubmitting || isLoading} type="submit">
          {form.formState.isSubmitting || isLoading
            ? tCommon("loading")
            : mode === "create"
              ? t("form.createSubmit")
              : t("form.saveSubmit")}
        </Button>
      </div>
    </form>
  );
}
