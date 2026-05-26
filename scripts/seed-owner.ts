/**
 * Create (or promote) a business-owner account in Supabase Auth + public.users.
 *
 * Requires the service role key (never use in the browser).
 *
 * Usage:
 *   npm run db:seed-owner
 *   npm run db:seed-owner -- --email=owner@printora.local --password='YourSecurePass1!'
 *
 * Environment (.env.local recommended):
 *   NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_OWNER_EMAIL
 *   SEED_OWNER_PASSWORD
 *   SEED_OWNER_FULL_NAME   (optional)
 *   SEED_OWNER_LOCALE      (optional: en | km, default km)
 *
 * Local Supabase: run `npx supabase status` for API URL and service_role key.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ws from "ws";

type AdminClient = SupabaseClient<Database, "public">;

type SeedConfig = {
  Email: string;
  Password: string;
  FullName: string | null;
  PreferredLocale: "en" | "km";
};

function loadEnvFiles () {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) {
      continue;
    }
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function readCliArg (name: string): string | undefined {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length);
    }
  }
  return undefined;
}

function parseConfig (): SeedConfig {
  const Email = (
    readCliArg("email")
    ?? process.env.SEED_OWNER_EMAIL
    ?? ""
  ).trim().toLowerCase();

  const Password =
    readCliArg("password")
    ?? process.env.SEED_OWNER_PASSWORD
    ?? "";

  const FullNameRaw =
    readCliArg("full-name")
    ?? readCliArg("name")
    ?? process.env.SEED_OWNER_FULL_NAME
    ?? "";
  const FullName = FullNameRaw.trim() || null;

  const LocaleRaw = (
    readCliArg("locale")
    ?? process.env.SEED_OWNER_LOCALE
    ?? "km"
  ).trim();
  const PreferredLocale = LocaleRaw === "en" ? "en" : "km";

  if (!Email || !Email.includes("@")) {
    throw new Error(
      "Set SEED_OWNER_EMAIL or pass --email=owner@example.com",
    );
  }
  if (!Password || Password.length < 8) {
    throw new Error(
      "Set SEED_OWNER_PASSWORD or pass --password=... (min 8 characters)",
    );
  }

  return { Email, Password, FullName, PreferredLocale };
}

function getSupabaseAdmin (): AdminClient {
  const Url =
    process.env.SUPABASE_URL
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!Url || !ServiceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY. "
      + "Add them to .env.local (local: `npx supabase status`).",
    );
  }

  return createClient<Database>(Url, ServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Node < 22 has no built-in WebSocket; required by @supabase/realtime-js.
    realtime: { transport: ws },
  });
}

async function promoteOwnerProfile (
  supabase: AdminClient,
  UserId: string,
  config: SeedConfig,
) {
  const { error } = await supabase
    .from("users")
    .update({
      role: "OWNER",
      email: config.Email,
      full_name: config.FullName,
      preferred_locale: config.PreferredLocale,
      account_status: "ACTIVE",
    })
    .eq("id", UserId);

  if (error) {
    throw new Error(`Failed to set OWNER on public.users: ${error.message}`);
  }
}

async function findUserIdByEmail (
  supabase: AdminClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Lookup failed: ${error.message}`);
  }

  return data?.id ?? null;
}

async function seedOwner () {
  loadEnvFiles();
  const config = parseConfig();
  const supabase = getSupabaseAdmin();

  let UserId = await findUserIdByEmail(supabase, config.Email);

  if (UserId) {
    console.log(`User already exists (${config.Email}), updating auth + profile…`);

    const { error: authError } = await supabase.auth.admin.updateUserById(
      UserId,
      {
        email: config.Email,
        password: config.Password,
        email_confirm: true,
      },
    );

    if (authError) {
      throw new Error(`Auth update failed: ${authError.message}`);
    }
  } else {
    console.log(`Creating auth user ${config.Email}…`);

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: config.Email,
      password: config.Password,
      email_confirm: true,
    });

    if (createError || !data.user) {
      throw new Error(
        createError?.message ?? "createUser returned no user",
      );
    }

    UserId = data.user.id;

    // Trigger may lag slightly on remote; ensure public.users row exists.
    await new Promise((r) => setTimeout(r, 500));
    const existing = await findUserIdByEmail(supabase, config.Email);
    if (!existing) {
      const { error: insertError } = await supabase.from("users").insert({
        id: UserId,
        email: config.Email,
        role: "OWNER",
        full_name: config.FullName,
        preferred_locale: config.PreferredLocale,
        account_status: "ACTIVE",
      });
      if (insertError) {
        throw new Error(
          `public.users insert failed: ${insertError.message}`,
        );
      }
      console.log("Created public.users row (trigger did not run yet).");
      return;
    }
  }

  await promoteOwnerProfile(supabase, UserId, config);
  console.log(`Done. OWNER ready: ${config.Email} (id: ${UserId})`);
}

seedOwner().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`seed-owner failed: ${message}`);
  process.exit(1);
});
