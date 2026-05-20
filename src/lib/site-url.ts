/** Site origin for Auth redirect URLs (`NEXT_PUBLIC_SITE_URL` or `VERCEL_URL`). */
export function getPublicSiteOrigin (): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (configured && configured.length > 0) {
    return configured;
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel?.length) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}

const APP_LOCALES = ["en", "km"] as const;

type AppLocale = (typeof APP_LOCALES)[number];

function isAppLocale (value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

/** Strips `/en` or `/km` prefix; `/km` alone becomes `/`. */
export function stripLocaleFromAppPath (path: string): string {
  const match = path.match(/^\/(en|km)(\/.*)?$/);
  if (!match) {
    return path;
  }
  return match[2] ?? "/";
}

/**
 * Validates an in-app path like `/en/dashboard`. Returns `fallback` if invalid.
 * Use for server redirects that need a full locale-prefixed URL.
 */
export function sanitizeAppPath (next: string | null, fallback: string): string {
  if (!next) {
    return fallback;
  }
  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (decoded.includes("..") || decoded.includes("//")) {
    return fallback;
  }

  if (/^\/(en|km)(\/[\w./-]*)?$/.test(decoded)) {
    return decoded;
  }

  // Locale-less path from middleware `next` param (e.g. `/dashboard`)
  if (/^\/[\w./-]*$/.test(decoded)) {
    const localeFromFallback = fallback.match(/^\/(en|km)/)?.[1];
    const locale = isAppLocale(localeFromFallback ?? "")
      ? localeFromFallback
      : "km";
    if (decoded === "/") {
      return `/${locale}`;
    }
    return `/${locale}${decoded}`;
  }

  return fallback;
}

/**
 * Validates `next` and returns a pathname for `next-intl` navigation (no locale prefix).
 */
export function sanitizeRouterPath (
  next: string | null,
  locale: AppLocale,
  fallback = "/",
): string {
  const fullFallback = `/${locale}${fallback === "/" ? "" : fallback}`;
  const full = sanitizeAppPath(next, fullFallback);
  const stripped = stripLocaleFromAppPath(full);
  if (stripped === "/en" || stripped === "/km") {
    return "/";
  }
  return stripped;
}
