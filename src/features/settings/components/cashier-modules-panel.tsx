"use client";

import type { AppModule } from "@/features/auth/constants/app-modules";
import { CONFIGURABLE_CASHIER_MODULES } from "@/features/settings/validations/system-settings-schema";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslations } from "next-intl";

type CashierModulesPanelProps = {
  value: AppModule[];
  onChange: (modules: AppModule[]) => void;
  disabled?: boolean;
};

export function CashierModulesPanel ({
  value,
  onChange,
  disabled = false,
}: CashierModulesPanelProps) {
  const t = useTranslations("settings.cashierModules");
  const tNav = useTranslations("navigation");

  function isChecked (module: AppModule) {
    return value.includes(module);
  }

  function toggleModule (module: AppModule, checked: boolean) {
    if (module === "pos") {
      return;
    }

    const next = new Set(value);
    if (checked) {
      next.add(module);
    } else {
      next.delete(module);
    }
    next.add("pos");
    onChange([...next]);
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="space-y-1">
        <h3 className="font-heading text-base font-bold tracking-tight">
          {t("title")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ul className="space-y-4">
        <li className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium text-muted-foreground">
              {tNav("pos")}
            </Label>
            <p className="text-xs text-muted-foreground">{t("posAlwaysOn")}</p>
          </div>
          <Switch checked disabled />
        </li>

        {CONFIGURABLE_CASHIER_MODULES.map((module) => (
          <li className="flex items-center justify-between gap-4" key={module}>
            <div className="space-y-0.5">
              <Label
                className="text-sm font-medium"
                htmlFor={`cashier-module-${module}`}
              >
                {t(`modules.${module}`)}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t(`modules.${module}Description`)}
              </p>
            </div>
            <Switch
              checked={isChecked(module)}
              disabled={disabled}
              id={`cashier-module-${module}`}
              onCheckedChange={(checked) => toggleModule(module, checked)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
