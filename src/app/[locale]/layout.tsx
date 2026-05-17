import { getRootFontVariableClassNames } from "@/app/fonts";
import { LanguageSwitcher } from "@/features/i18n/components/language-switcher";
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
    <html lang={locale}>
      <body className={getRootFontVariableClassNames()}>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <header className="flex justify-end border-b border-border px-4 py-2">
              <LanguageSwitcher />
            </header>
            <div className="flex-1">{children}</div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
