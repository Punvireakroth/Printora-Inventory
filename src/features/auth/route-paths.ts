import {
  resolveModuleForRestPath,
  type AppModule,
} from "@/features/auth/constants/app-modules";

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

export function isPublicAuthRoute (restPath: string): boolean {
  const base =
    restPath === "/"
      ? "/"
      : restPath.replace(/\/$/, "") || "/";
  const starts = (route: string) =>
    base === route || base.startsWith(`${route}/`);

  return (
    starts("/login") ||
    starts("/forgot-password") ||
    starts("/auth/callback")
  );
}

export { resolveModuleForRestPath };

export type ResolvedRestPathModule = AppModule | "owner_only" | null;

/** @deprecated Use resolveModuleForRestPath + allowed-modules check */
export function isOwnerOnlyRestPath (restPath: string): boolean {
  const resolved = resolveModuleForRestPath(restPath);
  return resolved === "owner_only" || resolved !== null;
}
