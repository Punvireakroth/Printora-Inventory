export type PosProductSalesSortable = {
  id: string;
  name: string;
};

export function comparePosProductsByQuantitySold<T extends PosProductSalesSortable> (
  left: T,
  right: T,
  quantitySoldByProductId: ReadonlyMap<string, number>,
): number {
  const leftSold = quantitySoldByProductId.get(left.id) ?? 0;
  const rightSold = quantitySoldByProductId.get(right.id) ?? 0;

  if (rightSold !== leftSold) {
    return rightSold - leftSold;
  }

  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

export function sortPosProductsByQuantitySold<T extends PosProductSalesSortable> (
  products: readonly T[],
  quantitySoldByProductId: ReadonlyMap<string, number>,
): T[] {
  return [...products].sort((left, right) =>
    comparePosProductsByQuantitySold(left, right, quantitySoldByProductId),
  );
}
