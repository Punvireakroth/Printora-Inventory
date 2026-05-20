import type { AuthError } from "@supabase/supabase-js";

/** Keys under messages `auth.errors.*` */
export type AuthErrorMessageKey =
  | "generic"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "rateLimited"
  | "userNotFound"
  | "samePassword"
  | "weakPassword";

export function mapAuthErrorToMessageKey (
  error: AuthError | null,
): AuthErrorMessageKey {
  if (!error?.message) {
    return "generic";
  }

  const code = error.code ?? "";
  const msg = error.message.toLowerCase();

  if (
    code === "invalid_credentials"
    || msg.includes("invalid login")
    || msg.includes("invalid email or password")
  ) {
    return "invalidCredentials";
  }

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "emailNotConfirmed";
  }

  if (
    code === "over_email_send_rate_limit"
    || msg.includes("rate limit")
    || msg.includes("too many")
  ) {
    return "rateLimited";
  }

  if (code === "user_not_found" || msg.includes("user not found")) {
    return "userNotFound";
  }

  if (msg.includes("same") && msg.includes("password")) {
    return "samePassword";
  }

  if (msg.includes("password") && msg.includes("weak")) {
    return "weakPassword";
  }

  return "generic";
}
