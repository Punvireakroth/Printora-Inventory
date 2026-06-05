"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { testTelegramAlert } from "@/features/settings/actions/test-telegram-alert";
import type { TestTelegramAlertErrorCode } from "@/features/settings/actions/test-telegram-alert";
import { updateSystemSettings } from "@/features/settings/actions/update-system-settings";
import type { UpdateSystemSettingsErrorCode } from "@/features/settings/actions/update-system-settings";
import type { SystemSettingsFormInitial } from "@/features/settings/types/system-settings";
import {
  UpdateSystemSettingsSchema,
  type UpdateSystemSettingsInput,
} from "@/features/settings/validations/system-settings-schema";
import { CashierModulesPanel } from "@/features/settings/components/cashier-modules-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLoadingAction } from "@/hooks/use-loading-action";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type SettingsFormPanelProps = {
  initial: SystemSettingsFormInitial;
};

export function SettingsFormPanel ({ initial }: SettingsFormPanelProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { run: runSave, isLoading: isSaving } = useLoadingAction();
  const { run: runTest, isLoading: isTesting } = useLoadingAction();
  const [saveError, setSaveError] =
    useState<UpdateSystemSettingsErrorCode | null>(null);
  const [testError, setTestError] =
    useState<TestTelegramAlertErrorCode | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  const form = useForm<UpdateSystemSettingsInput>({
    resolver: zodResolver(UpdateSystemSettingsSchema),
    defaultValues: {
      globalLowStock: initial.globalLowStock,
      isTelegramNotify: initial.isTelegramNotify,
      telegramBotToken: "",
      telegramChatId: initial.telegramChatId ?? "",
      cashierAllowedModules: initial.cashierAllowedModules,
    },
  });

  const isTelegramNotify = form.watch("isTelegramNotify");
  const isBusy = isSaving || isTesting;

  function fieldError (field: keyof UpdateSystemSettingsInput) {
    if (!form.formState.errors[field]) {
      return null;
    }
    if (field === "globalLowStock") {
      return t("validation.globalLowStock");
    }
    if (field === "telegramBotToken") {
      return t("validation.telegramToken");
    }
    if (field === "telegramChatId") {
      return t("validation.telegramChatId");
    }
    return t("errors.invalid_input");
  }

  async function onSubmit (values: UpdateSystemSettingsInput) {
    await runSave(async () => {
      setSaveError(null);
      setTestSuccess(false);

      const result = await updateSystemSettings(values);

      if (!result.ok) {
        setSaveError(result.code);
        return;
      }

      toast.success(t("saveSuccess"));
      form.setValue("telegramBotToken", "");
      router.refresh();
    });
  }

  async function handleTestSend () {
    await runTest(async () => {
      setTestError(null);
      setTestSuccess(false);

      const result = await testTelegramAlert();

      if (!result.ok) {
        setTestError(result.code);
        return;
      }

      setTestSuccess(true);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="space-y-1 pb-4">
        <h2 className="font-heading text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="globalLowStock">{t("globalLowStock")}</Label>
          <Input
            disabled={isBusy}
            id="globalLowStock"
            min={0}
            step={1}
            type="number"
            {...form.register("globalLowStock", { valueAsNumber: true })}
          />
          <p className="text-sm text-muted-foreground">
            {t("globalLowStockHelp")}
          </p>
          {fieldError("globalLowStock") ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError("globalLowStock")}
            </p>
          ) : null}
        </div>

        <CashierModulesPanel
          disabled={isBusy}
          onChange={(modules) =>
            form.setValue("cashierAllowedModules", modules, {
              shouldDirty: true,
            })
          }
          value={form.watch("cashierAllowedModules")}
        />

        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-3">
            <h3 className="font-heading text-base font-bold tracking-tight">
              {t("telegramSection")}
            </h3>
            <div className="flex items-center gap-3">
              <Switch
                aria-labelledby="telegram-notify-label"
                checked={isTelegramNotify}
                className="data-[state=checked]:bg-primary"
                disabled={isBusy}
                id="isTelegramNotify"
                onCheckedChange={(checked) =>
                  form.setValue("isTelegramNotify", checked)
                }
              />
              <Label
                className="cursor-pointer text-sm font-semibold text-foreground"
                htmlFor="isTelegramNotify"
                id="telegram-notify-label"
              >
                {t("isTelegramNotify")}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramBotToken">{t("telegramToken")}</Label>
            <Input
              autoComplete="off"
              disabled={isBusy}
              id="telegramBotToken"
              placeholder={
                initial.hasTelegramToken
                  ? t("telegramTokenPlaceholder")
                  : undefined
              }
              type="password"
              {...form.register("telegramBotToken")}
            />
            {fieldError("telegramBotToken") ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldError("telegramBotToken")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegramChatId">{t("telegramChatId")}</Label>
            <Input
              disabled={isBusy}
              id="telegramChatId"
              {...form.register("telegramChatId")}
            />
            {fieldError("telegramChatId") ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldError("telegramChatId")}
              </p>
            ) : null}
          </div>

          <Button
            disabled={isBusy}
            onClick={() => void handleTestSend()}
            type="button"
            variant="outline"
          >
            {isTesting ? tCommon("loading") : t("testTelegram")}
          </Button>
          {testError ? (
            <p className="text-sm text-destructive" role="alert">
              {t(`errors.${testError}`)}
            </p>
          ) : null}
          {testSuccess ? (
            <p className="text-sm text-muted-foreground">{t("testSuccess")}</p>
          ) : null}
        </div>

        {saveError ? (
          <p className="text-sm text-destructive" role="alert">
            {t(`errors.${saveError}`)}
          </p>
        ) : null}

        <Button disabled={isBusy} type="submit">
          {isSaving ? tCommon("loading") : t("save")}
        </Button>
      </form>
    </section>
  );
}
