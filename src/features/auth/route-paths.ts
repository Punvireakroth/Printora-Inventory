type LocaleCode = "en" | "km";

/** Path after locale segment, normalized to begin with /. */
export function pathWithoutLocale (pathname: string): {
  locale: LocaleCode | null;
  restPath: string;
} {
  const raw = pathname.split("/").filter(Boolean);
  if (raw.length === 0) {
    return { locale: null, restPath: "/" };
  }

  const maybeLocale = raw[0];
  if (maybeLocale !== "en" && maybeLocale !== "km") {
    const normalized =
      pathname.startsWith("/") ? pathname : `/${pathname}`;
    return { locale: null, restPath: normalized };
  }

  const tail = raw.slice(1).join("/");
  return {
    locale: maybeLocale as LocaleCode,
    restPath: tail ? `/${tail}` : "/",
  };
}

function normalizedBase (restPath: string): string {
  if (restPath === "/") {
    return "/";
  }
  return restPath.replace(/\/$/, "") || "/";
}

export function isPublicAuthRoute (restPath: string): boolean {
  const base = normalizedBase(restPath);
  const starts = (route: string) =>
    base === route || base.startsWith(`${route}/`);

  return (
    starts("/login") ||
    starts("/forgot-password") ||
    starts("/auth/callback")
  );
}

/** Cashier reaches dashboard shell only via POS (owner-only areas redirect). */
export function isOwnerOnlyRestPath (restPath: string): boolean {
  const base = normalizedBase(restPath);
  if (base === "/") {
    return true;
  }
  const prefixes = ["/dashboard", "/products", "/settings"];
  return prefixes.some(
    (prefix) =>
      base === prefix || base.startsWith(`${prefix}/`),
  );
}
