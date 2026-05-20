import type { SerializeOptions } from "cookie";

const LONG_SESSION_SECONDS = 60 * 60 * 24 * 365;

/**
 * Middleware adjusts Supabase auth cookie lifetime:
 * Remember me → longer max-age; otherwise session semantics (omit max-age / expiry).
 */
export function adjustSupabaseCookieOptionsForRememberMe (
  options: SerializeOptions | undefined,
  persist: boolean,
): SerializeOptions {
  const resolved: SerializeOptions = { ...(options ?? {}) };
  if (persist) {
    return {
      ...resolved,
      maxAge: LONG_SESSION_SECONDS,
    };
  }

  Reflect.deleteProperty(resolved, "maxAge");
  Reflect.deleteProperty(resolved, "expires");
  return resolved;
}
