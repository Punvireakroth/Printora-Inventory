export const APP_MODULES = [
  "pos",
  "dashboard",
  "products",
  "stock",
  "sales",
  "reports",
  "categories",
  "suppliers",
] as const;

export type AppModule = (typeof APP_MODULES)[number];

export const DEFAULT_CASHIER_MODULES: AppModule[] = ["pos"];

/** Routes that cashiers can never access regardless of module grants. */
export const OWNER_ONLY_REST_PREFIXES = [
  "/settings",
] as const;

const MODULE_REST_PREFIXES: { module: AppModule; prefix: string }[] = [
  { module: "dashboard", prefix: "/dashboard" },
  { module: "products", prefix: "/products" },
  { module: "stock", prefix: "/stock" },
  { module: "sales", prefix: "/sales" },
  { module: "reports", prefix: "/reports" },
  { module: "categories", prefix: "/categories" },
  { module: "suppliers", prefix: "/suppliers" },
  { module: "pos", prefix: "/pos" },
];

export function isAppModule (value: string): value is AppModule {
  return (APP_MODULES as readonly string[]).includes(value);
}

export function normalizeCashierModules (
  modules: readonly string[] | null | undefined,
): AppModule[] {
  if (!modules?.length) {
    return [...DEFAULT_CASHIER_MODULES];
  }

  const normalized = APP_MODULES.filter((module) => modules.includes(module));
  if (!normalized.includes("pos")) {
    normalized.unshift("pos");
  }

  return normalized;
}

export function resolveModuleForRestPath (
  restPath: string,
): AppModule | "owner_only" | null {
  const base =
    restPath === "/"
      ? "/"
      : restPath.replace(/\/$/, "") || "/";

  if (base === "/") {
    return "owner_only";
  }

  for (const ownerPrefix of OWNER_ONLY_REST_PREFIXES) {
    if (base === ownerPrefix || base.startsWith(`${ownerPrefix}/`)) {
      return "owner_only";
    }
  }

  const sorted = [...MODULE_REST_PREFIXES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );

  for (const { module, prefix } of sorted) {
    if (base === prefix || base.startsWith(`${prefix}/`)) {
      return module;
    }
  }

  return null;
}

export function moduleToHomeHref (
  allowedModules: readonly AppModule[],
  isOwner: boolean,
): string {
  if (isOwner || allowedModules.includes("dashboard")) {
    return "/dashboard";
  }
  return "/pos";
}
