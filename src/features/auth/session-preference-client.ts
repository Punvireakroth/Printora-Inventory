"use client";

import { AUTH_SESSION_PERSIST_COOKIE } from "@/constants/auth";

/** Sets a short-lived preference cookie read by middleware when writing Supabase session cookies (before sign-in completes). */
export function setAuthPersistPreferenceCookie (persist: boolean) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  const value = persist ? "1" : "0";
  const maxAgeYears = 60 * 60 * 24 * 365;
  document.cookie = `${AUTH_SESSION_PERSIST_COOKIE}=${value}; Path=/; Max-Age=${maxAgeYears}; SameSite=Lax${secure}`;
}

export function clearAuthPersistPreferenceCookie () {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${AUTH_SESSION_PERSIST_COOKIE}=; Path=/; Max-Age=0${secure}`;
}
