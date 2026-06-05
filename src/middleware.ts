import createIntlMiddleware from "next-intl/middleware";
import { LOCALE_COOKIE_NAME } from "@/i18n/constants";
import {
  type AppModule,
  moduleToHomeHref,
  normalizeCashierModules,
  resolveModuleForRestPath,
} from "@/features/auth/constants/app-modules";
import {
  isPublicAuthRoute,
  pathWithoutLocale,
} from "@/features/auth/route-paths";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

type AppUserRole = "OWNER" | "CASHIER";

function isAppLocale (value: string | undefined): value is "en" | "km" {
  return value === "en" || value === "km";
}

function applyPendingCookies (
  response: NextResponse,
  cookies: {
    name: string;
    value: string;
    options?: Partial<NonNullable<
      Parameters<typeof response.cookies.set>[2]
    >>;
  }[],
) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

function nextRequestWithLocaleCookie (
  request: NextRequest,
  locale: "en" | "km",
): NextRequest {
  const raw = request.headers.get("cookie") ?? "";
  const parts = raw
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !segment.startsWith(`${LOCALE_COOKIE_NAME}=`));
  const serialized = [...parts, `${LOCALE_COOKIE_NAME}=${locale}`].join("; ");
  const headers = new Headers(request.headers);
  headers.set("cookie", serialized);
  return new NextRequest(request.url, { headers, method: request.method });
}

function cashierCanAccessRestPath (
  restPath: string,
  allowedModules: readonly AppModule[],
): boolean {
  const resolved = resolveModuleForRestPath(restPath);

  if (resolved === "owner_only") {
    return false;
  }

  if (resolved === null) {
    return true;
  }

  return allowedModules.includes(resolved);
}

export default async function middleware (request: NextRequest) {
  const cookiesToApply: {
    name: string;
    value: string;
    options?: Partial<NonNullable<
      Parameters<typeof NextResponse.prototype.cookies.set>[2]
    >>;
  }[] = [];

  let supabase: ReturnType<typeof createSupabaseMiddlewareClient> | null =
    null;
  try {
    supabase = createSupabaseMiddlewareClient(request, (nextCookies) => {
      cookiesToApply.push(...nextCookies);
    });
  } catch {
    // Missing Supabase env — routing only (dev without env).
  }

  const fromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  let negotiated: "en" | "km" | null =
    fromCookie === "en" || fromCookie === "km" ? fromCookie : null;

  let userRole: AppUserRole | null = null;
  let authenticatedUserId: string | null = null;
  let cashierAllowedModules: AppModule[] = normalizeCashierModules(["pos"]);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authenticatedUserId = user.id;
      const { data: profile } = await supabase
        .from("users")
        .select("preferred_locale, role")
        .eq("id", user.id)
        .maybeSingle();

      userRole =
        profile?.role !== undefined && profile?.role !== null
          ? profile.role
          : "CASHIER";

      if (!negotiated && isAppLocale(profile?.preferred_locale)) {
        negotiated = profile.preferred_locale;
      }

      if (userRole === "CASHIER") {
        const { data: settings } = await supabase
          .from("system_settings")
          .select("cashier_allowed_modules")
          .eq("id", 1)
          .maybeSingle();

        cashierAllowedModules = normalizeCashierModules(
          settings?.cashier_allowed_modules,
        );
      }
    }

    if (!negotiated) {
      const { data: defaultLocale, error } =
        await supabase.rpc("get_public_default_locale");

      if (!error && isAppLocale(defaultLocale)) {
        negotiated = defaultLocale;
      }
    }
  }

  const resolved = negotiated ?? routing.defaultLocale;
  const shouldInjectCookie = !isAppLocale(fromCookie);
  const intlRequest = shouldInjectCookie
    ? nextRequestWithLocaleCookie(request, resolved)
    : request;

  const pathname = request.nextUrl.pathname;
  const { locale: pathLocaleSegment, restPath } = pathWithoutLocale(pathname);

  if (
    pathLocaleSegment
    && (pathLocaleSegment === "en" || pathLocaleSegment === "km")
  ) {
    const publicRoute = isPublicAuthRoute(restPath);

    const hasUser =
      Boolean(authenticatedUserId)
      && Boolean(supabase);

    /** Supabase-less dev: bypass auth redirects */
    const guestBlocks = supabase !== null ? !hasUser : false;

    if (guestBlocks && !publicRoute) {
      const loginUrl = new URL(request.url);
      loginUrl.pathname = `/${pathLocaleSegment}/login`;
      const nextPath =
        restPath === "/"
          ? "/"
          : `${restPath}${request.nextUrl.search}`;
      loginUrl.searchParams.set("next", nextPath);
      const res = NextResponse.redirect(loginUrl);
      applyPendingCookies(res, cookiesToApply);
      return res;
    }

    const cashierHome = moduleToHomeHref(cashierAllowedModules, false);

    if (hasUser && (restPath === "/login" || restPath.startsWith("/login"))) {
      const target =
        userRole === "OWNER"
          ? `/${pathLocaleSegment}/dashboard`
          : `/${pathLocaleSegment}${cashierHome}`;
      const res = NextResponse.redirect(new URL(target, request.url));
      applyPendingCookies(res, cookiesToApply);
      return res;
    }

    if (hasUser && restPath === "/") {
      if (userRole === "OWNER") {
        const res = NextResponse.redirect(
          new URL(`/${pathLocaleSegment}/dashboard`, request.url),
        );
        applyPendingCookies(res, cookiesToApply);
        return res;
      }
      const res = NextResponse.redirect(
        new URL(`/${pathLocaleSegment}${cashierHome}`, request.url),
      );
      applyPendingCookies(res, cookiesToApply);
      return res;
    }

    if (
      hasUser
      && userRole === "CASHIER"
      && !cashierCanAccessRestPath(restPath, cashierAllowedModules)
    ) {
      const res = NextResponse.redirect(
        new URL(`/${pathLocaleSegment}${cashierHome}`, request.url),
      );
      applyPendingCookies(res, cookiesToApply);
      return res;
    }
  }

  const response = intlMiddleware(intlRequest);
  applyPendingCookies(response, cookiesToApply);

  if (shouldInjectCookie) {
    response.cookies.set(LOCALE_COOKIE_NAME, resolved, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
