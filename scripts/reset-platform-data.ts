/**
 * Reset operational data (products, stock, sales, lookups, cashier accounts,
 * product images) while keeping OWNER auth + public.users profiles.
 *
 * Requires the service role key (never use in the browser).
 *
 * Usage:
 *   npm run db:reset-data -- --confirm
 *   npm run db:reset-data -- --confirm --dry-run
 *   npm run db:reset-data -- --confirm --reset-settings
 *
 * Environment (.env.local recommended):
 *   NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Flags:
 *   --confirm          Required. Without it the script exits (safety).
 *   --dry-run          Print row counts only; no deletes.
 *   --reset-settings   Clear shop/Telegram fields on system_settings and reset
 *                      next_receipt_seq to 1. Default: only reset receipt sequence.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ws from "ws";

const PRODUCT_IMAGES_BUCKET = "product-images";

type AdminClient = SupabaseClient<Database, "public">;

type PublicTable =
  | "stock_movements"
  | "sale_items"
  | "sales"
  | "stock_receive_items"
  | "stock_receives"
  | "stock_adjustments"
  | "products"
  | "categories"
  | "suppliers";

const TABLES_DELETE_ORDER: PublicTable[] = [
  "stock_movements",
  "sale_items",
  "sales",
  "stock_receive_items",
  "stock_receives",
  "stock_adjustments",
  "products",
  "categories",
  "suppliers",
];

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

function hasFlag (name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
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
    realtime: { transport: ws },
  });
}

async function countTable (
  supabase: AdminClient,
  table: PublicTable,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Count ${table} failed: ${error.message}`);
  }

  return count ?? 0;
}

async function deleteAllRows (
  supabase: AdminClient,
  table: PublicTable,
): Promise<number> {
  const { count: before } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  const { error } = await supabase
    .from(table)
    .delete()
    .gte("created_at", "1970-01-01T00:00:00Z");

  if (error) {
    throw new Error(`Delete ${table} failed: ${error.message}`);
  }

  return before ?? 0;
}

async function listOwnerIds (supabase: AdminClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "OWNER");

  if (error) {
    throw new Error(`List owners failed: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id);
}

async function listCashierIds (supabase: AdminClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "CASHIER");

  if (error) {
    throw new Error(`List cashiers failed: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id);
}

async function emptyStoragePrefix (
  supabase: AdminClient,
  prefix: string,
): Promise<number> {
  let removed = 0;
  const { data: entries, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error) {
    throw new Error(
      `Storage list "${prefix || "/"}" failed: ${error.message}`,
    );
  }

  const filePaths: string[] = [];

  for (const entry of entries ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) {
      filePaths.push(path);
    } else {
      removed += await emptyStoragePrefix(supabase, path);
    }
  }

  if (filePaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(filePaths);

    if (removeError) {
      throw new Error(
        `Storage remove failed: ${removeError.message}`,
      );
    }
    removed += filePaths.length;
  }

  return removed;
}

async function resetReceiptSequence (supabase: AdminClient) {
  const { error } = await supabase
    .from("system_settings")
    .update({ next_receipt_seq: 1 })
    .eq("id", 1);

  if (error) {
    throw new Error(`Reset receipt sequence failed: ${error.message}`);
  }
}

async function resetShopSettings (supabase: AdminClient) {
  const { error } = await supabase
    .from("system_settings")
    .update({
      business_name: null,
      business_phone: null,
      global_low_stock: 5,
      telegram_bot_token: null,
      telegram_chat_id: null,
      is_telegram_notify: false,
      allow_cashier_discount: false,
      next_receipt_seq: 1,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(`Reset system_settings failed: ${error.message}`);
  }
}

async function deleteCashierAuthUsers (
  supabase: AdminClient,
  cashierIds: string[],
) {
  for (const userId of cashierIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(
        `Auth delete cashier ${userId} failed: ${error.message}`,
      );
    }
  }
}

async function resetPlatformData () {
  loadEnvFiles();

  const Confirm = hasFlag("confirm");
  const DryRun = hasFlag("dry-run");
  const ResetSettings = hasFlag("reset-settings");

  if (!Confirm) {
    console.error(
      "Refusing to run without --confirm.\n"
      + "Example: npm run db:reset-data -- --confirm\n"
      + "Preview:  npm run db:reset-data -- --confirm --dry-run",
    );
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  const ownerIds = await listOwnerIds(supabase);
  const cashierIds = await listCashierIds(supabase);

  if (ownerIds.length === 0) {
    throw new Error(
      "No OWNER user found in public.users. Run npm run db:seed-owner first.",
    );
  }

  console.log("Printora data reset");
  console.log(`  Owners kept: ${ownerIds.length}`);
  console.log(`  Cashiers to remove: ${cashierIds.length}`);
  console.log(`  Mode: ${DryRun ? "dry-run" : "live"}`);
  console.log(
    `  Settings: ${ResetSettings ? "full reset (shop + receipt seq)" : "receipt sequence only"}`,
  );

  for (const table of TABLES_DELETE_ORDER) {
    const rowCount = await countTable(supabase, table);
    console.log(`  ${table}: ${rowCount} row(s)`);
  }

  console.log(`  ${PRODUCT_IMAGES_BUCKET} bucket: will be emptied`);

  if (DryRun) {
    console.log("\nDry-run complete. No changes made.");
    return;
  }

  console.log("\nDeleting business data…");
  for (const table of TABLES_DELETE_ORDER) {
    const deleted = await deleteAllRows(supabase, table);
    console.log(`  cleared ${table} (${deleted} row(s))`);
  }

  console.log("Clearing product images…");
  const imagesRemoved = await emptyStoragePrefix(supabase, "");
  console.log(`  removed ${imagesRemoved} file(s) from ${PRODUCT_IMAGES_BUCKET}`);

  if (ResetSettings) {
    console.log("Resetting system_settings (shop + Telegram + receipt seq)…");
    await resetShopSettings(supabase);
  } else {
    console.log("Resetting receipt sequence (next_receipt_seq → 1)…");
    await resetReceiptSequence(supabase);
  }

  if (cashierIds.length > 0) {
    console.log("Deleting cashier auth accounts…");
    await deleteCashierAuthUsers(supabase, cashierIds);
    console.log(`  removed ${cashierIds.length} cashier account(s)`);
  }

  const ownersAfter = await listOwnerIds(supabase);
  if (ownersAfter.length !== ownerIds.length) {
    throw new Error(
      "Owner count changed unexpectedly after reset. Aborting follow-up.",
    );
  }

  console.log("\nDone. OWNER account(s) preserved.");
  console.log(
    "Optional: npm run db:seed-lookups  — restore dev categories/suppliers",
  );
}

resetPlatformData().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`reset-platform-data failed: ${message}`);
  process.exit(1);
});
