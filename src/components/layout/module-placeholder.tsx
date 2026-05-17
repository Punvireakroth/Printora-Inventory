import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type ModuleNavKey =
  | "dashboard"
  | "products"
  | "pos"
  | "settings";

export async function ModulePlaceholder({
  params,
  titleKey,
}: {
  params: Promise<{ locale: string }>;
  titleKey: ModuleNavKey;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  const t = await getTranslations("navigation");
  const tPh = await getTranslations("placeholders");

  return (
    <div className="space-y-2">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        {t(titleKey)}
      </h1>
      <p className="text-muted-foreground">{tPh("moduleSoon")}</p>
    </div>
  );
}
