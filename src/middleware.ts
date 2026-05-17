import createIntlMiddleware from "next-intl/middleware";
import { LOCALE_COOKIE_NAME } from "@/i18n/constants";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

function isAppLocale(value: string | undefined): value is 'en' | 'km' {
  return value === 'en' || value === 'km'
}

function nextRequestWithLocaleCookie(
  request: NextRequest,
  locale: 'en' | 'km',
): NextRequest {
  const raw = request.headers.get('cookie') ?? ''
  const parts = raw
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !segment.startsWith(`${LOCALE_COOKIE_NAME}=`))
  const serialized = [...parts, `${LOCALE_COOKIE_NAME}=${locale}`].join("; ")
  const headers = new Headers(request.headers)
  headers.set("cookie", serialized);
  return new NextRequest(request.url, { headers, method: request.method });
}

export default async function middleware(request: NextRequest) {
  const cookiesToApply: {
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }[] = []

  let supabase: ReturnType<typeof createSupabaseMiddlewareClient> | null = null
  try {
    supabase = createSupabaseMiddlewareClient(request, (nextCookies) => {
      cookiesToApply.push(...nextCookies)
    })
  } catch {
    // Missing Supabase env — fall back to routing.defaultLocale only.
  }

  const fromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  let negotiated: 'en' | 'km' | null = null

  if (isAppLocale(fromCookie)) {
    negotiated = fromCookie
  } else if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('preferred_locale')
        .eq('id', user.id)
        .maybeSingle()

      if (isAppLocale(profile?.preferred_locale)) {
        negotiated = profile.preferred_locale
      }
    }

    if (!negotiated) {
      const { data: defaultLocale, error } =
        await supabase.rpc('get_public_default_locale')

      if (!error && isAppLocale(defaultLocale)) {
        negotiated = defaultLocale
      }
    }
  }

  const resolved = negotiated ?? routing.defaultLocale

  const shouldInjectCookie = !isAppLocale(fromCookie)
  const intlRequest = shouldInjectCookie
    ? nextRequestWithLocaleCookie(request, resolved)
    : request

  const response = intlMiddleware(intlRequest)

  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
