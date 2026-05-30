import { getRootFontVariableClassNames } from "@/app/fonts";
import { PlatformLoadingShell } from "@/components/layout/platform-loading-shell";
import {
  BRAND_THEME_COLOR,
  siteIcons,
  siteManifestPath,
} from "@/constants/brand";
import { routing } from "@/i18n/routing";
import { hasLocale, NextIntlClientProvider, type Locale } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "LocaleLayout",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    icons: siteIcons,
    manifest: siteManifestPath,
    appleWebApp: {
      title: t("metaTitle"),
    },
    themeColor: BRAND_THEME_COLOR,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={getRootFontVariableClassNames()}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PlatformLoadingShell>{children}</PlatformLoadingShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
