import { requireOwnerOnly } from "@/features/auth/services/module-access";
import { SettingsFormPanel } from "@/features/settings/components/settings-form-panel";
import { SettingsHubPanel } from "@/features/settings/components/settings-hub-panel";
import { getSystemSettings } from "@/features/settings/services/get-system-settings";
import { getTranslations } from "next-intl/server";

export async function generateMetadata () {
  const t = await getTranslations("settingsHub");
  return { title: t("title") };
}

export default async function SettingsPage () {
  await requireOwnerOnly();
  const initial = await getSystemSettings();

  return (
    <div className="flex w-full flex-col gap-6">
      <SettingsHubPanel />
      <SettingsFormPanel initial={initial} />
    </div>
  );
}
