"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createStaff } from "@/features/users/actions/create-staff";
import type { CreateStaffErrorCode } from "@/features/users/actions/create-staff";
import {
  CreateStaffSchema,
  type CreateStaffInput,
} from "@/features/users/validations/create-staff-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type AddStaffFormProps = {
  onCancel: () => void;
  onSuccess: () => void;
};

export function AddStaffForm ({ onCancel, onSuccess }: AddStaffFormProps) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [submitError, setSubmitError] = useState<CreateStaffErrorCode | null>(
    null,
  );

  const form = useForm<CreateStaffInput>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "CASHIER",
      tempPassword: "",
    },
  });

  async function onSubmit (values: CreateStaffInput) {
    setSubmitError(null);

    const result = await createStaff({
      ...values,
      email: values.email.trim().toLowerCase(),
      role: "CASHIER",
    });

    if (!result.ok) {
      setSubmitError(result.code);
      return;
    }

    form.reset();
    router.refresh();
    onSuccess();
  }

  const fieldError = (field: keyof CreateStaffInput) => {
    const err = form.formState.errors[field];
    if (!err) {
      return null;
    }
    if (field === "email") {
      return t("validation.email");
    }
    if (field === "fullName") {
      return t("validation.fullName");
    }
    if (field === "tempPassword") {
      return t("validation.tempPassword");
    }
    return t("validation.generic");
  };

  return (
    <form
      className="flex flex-1 flex-col gap-4 px-4 pb-6"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {submitError ? (
        <p className="text-sm text-destructive" role="alert">
          {t(`errors.${submitError}`)}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="staff-full-name">{t("form.fullName")}</Label>
        <Input
          autoComplete="name"
          id="staff-full-name"
          {...form.register("fullName")}
        />
        {fieldError("fullName") ? (
          <p className="text-xs text-destructive">{fieldError("fullName")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-email">{t("form.email")}</Label>
        <Input
          autoComplete="off"
          id="staff-email"
          type="email"
          {...form.register("email")}
        />
        {fieldError("email") ? (
          <p className="text-xs text-destructive">{fieldError("email")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-role">{t("form.role")}</Label>
        <Input
          disabled
          id="staff-role"
          readOnly
          value={t("role.CASHIER")}
        />
        <p className="text-xs text-muted-foreground">{t("form.roleHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staff-temp-password">{t("form.tempPassword")}</Label>
        <Input
          autoComplete="new-password"
          id="staff-temp-password"
          type="password"
          {...form.register("tempPassword")}
        />
        {fieldError("tempPassword") ? (
          <p className="text-xs text-destructive">
            {fieldError("tempPassword")}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("form.tempPasswordHint")}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} type="button" variant="outline">
          {tCommon("cancel")}
        </Button>
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? tCommon("loading") : t("form.submit")}
        </Button>
      </div>
    </form>
  );
}
