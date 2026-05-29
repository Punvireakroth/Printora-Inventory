"use client";

import {
  buildProductImageStoragePath,
  PRODUCT_IMAGES_BUCKET,
  validateProductImageFile,
} from "@/features/products/lib/product-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type UploadProductImageErrorCode =
  | "invalid_type"
  | "too_large"
  | "upload_failed";

export type UploadProductImageResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; code: UploadProductImageErrorCode };

export async function uploadProductImage (
  file: File,
  storagePrefix: string,
): Promise<UploadProductImageResult> {
  const validation = validateProductImageFile(file);
  if (validation !== "ok") {
    return { ok: false, code: validation };
  }

  const path = buildProductImageStoragePath(storagePrefix, file.name);
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { ok: false, code: "upload_failed" };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { ok: true, path, publicUrl: data.publicUrl };
}
