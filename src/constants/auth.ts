/** Cookie storing whether sessions should persist until explicit logout (~1yr) vs browser session only. Read by middleware when applying Supabase auth cookies. */
export const AUTH_SESSION_PERSIST_COOKIE = "printora_auth_persist";
