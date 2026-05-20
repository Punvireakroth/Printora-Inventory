export function getSupabaseProjectUrl (): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Publishable/anon API key — never use service role in browser code.
 * Supports legacy ANON plus newer publishable key env name.
 */
export function getSupabaseAnonKey (): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function assertSupabaseEnv (): { Url: string; AnonKey: string } {
  const Url = getSupabaseProjectUrl();
  const AnonKey = getSupabaseAnonKey();
  if (!Url || !AnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return { Url, AnonKey };
}
