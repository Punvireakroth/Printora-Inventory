import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
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
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <p className="font-mono text-sm text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("subtitle")}
        </p>
        <p className="text-foreground text-sm leading-relaxed" lang="km">
          {t("khmerSample")}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button">{t("ctaSample")}</Button>
        </div>
      </div>
    </div>
  );
}
