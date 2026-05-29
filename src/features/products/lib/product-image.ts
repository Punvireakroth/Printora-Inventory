export const PRODUCT_IMAGES_BUCKET = "product-images";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function getProductImagePublicUrl (
  getPublicUrl: (path: string) => { data: { publicUrl: string } },
  imagePath: string | null,
): string | null {
  if (!imagePath) {
    return null;
  }
  return getPublicUrl(imagePath).data.publicUrl;
}

export function buildProductImageStoragePath (
  storagePrefix: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `${storagePrefix}/${Date.now()}-${safeName}`;
}

export function validateProductImageFile (file: File): "ok" | "invalid_type" | "too_large" {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "invalid_type";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "too_large";
  }
  return "ok";
}
