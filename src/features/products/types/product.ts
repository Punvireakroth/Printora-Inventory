export type ProductStatus = "ACTIVE" | "INACTIVE";

export type LookupOption = {
  id: string;
  name: string;
};

export type ProductListItem = {
  id: string;
  name: string;
  sku: string;
  size: string | null;
  color: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  imagePath: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  categoryId: string;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  size: string | null;
  color: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  imagePath: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  categoryId: string;
  supplierId: string | null;
};

export function productIsLowStock (product: {
  currentStock: number;
  minimumStock: number;
}): boolean {
  return product.currentStock <= product.minimumStock;
}
