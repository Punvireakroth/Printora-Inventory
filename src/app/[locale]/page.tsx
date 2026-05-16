import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";
import { hasLocale, type Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations("HomePage");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md space-y-2 text-center">
        <p className="font-mono text-sm text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <p className="text-sm" lang="km">
          {t("khmerSample")}
        </p>
      </div>
      <Button type="button">{t("ctaSample")}</Button>
    </div>
  );
}
