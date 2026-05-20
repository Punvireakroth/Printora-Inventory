import { routing } from "@/i18n/routing";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { sanitizeAppPath } from "@/lib/site-url";
import { NextRequest, NextResponse } from "next/server";

export async function GET (
  req: NextRequest,
  segmentData: { params: Promise<{ locale: string }> },
) {
  const { locale } = await segmentData.params;

  const okLocale = (routing.locales as readonly string[]).includes(locale);

  const loginHref = okLocale ? `/${locale}/login` : `/${routing.defaultLocale}/login`;
  const url = req.nextUrl;
  const code = url.searchParams.get("code");

  const nextRaw = url.searchParams.get("next");
  const fallback = okLocale ? `/${locale}/dashboard` : `/${routing.defaultLocale}/dashboard`;

  let nextPath = sanitizeAppPath(nextRaw, fallback);
  if (okLocale && !nextPath.startsWith(`/${locale}`)) {
    nextPath = fallback;
  }

  if (!okLocale || !code) {
    return NextResponse.redirect(new URL(loginHref, req.url));
  }

  const supabase = await createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failLogin = new URL(loginHref, req.url);
    return NextResponse.redirect(failLogin);
  }

  const destination = new URL(nextPath, req.url);
  return NextResponse.redirect(destination);
}
