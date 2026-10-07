/**
 * Pricing resolution helper for Storelly items.
 * Universally resolves Selling Price, Original MRP (Strike Price), Savings, and Discount percentage.
 * Handles both conventions:
 * - Case A: `price` is original MRP (e.g. 300) and `salePrice` is selling price (e.g. 199)
 * - Case B: `price` is selling price (e.g. 199) and `salePrice` is original MRP (e.g. 300)
 */
export interface ProductPricingResult {
  sellingPrice: number;
  originalPrice: number | null;
  hasDiscount: boolean;
  discountPercent: number;
  savingsAmount: number;
  isFree: boolean;
}

export function resolveProductPricing(
  item: { price?: number; salePrice?: number; isFree?: boolean } | null | undefined
): ProductPricingResult {
  if (!item) {
    return {
      sellingPrice: 0,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      savingsAmount: 0,
      isFree: false,
    };
  }

  if (item.isFree || item.price === 0) {
    return {
      sellingPrice: 0,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      savingsAmount: 0,
      isFree: true,
    };
  }

  const p1 = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
  const rawP2 = item.salePrice !== undefined && item.salePrice !== null ? Number(item.salePrice) : null;
  const p2 = rawP2 !== null && !isNaN(rawP2) && rawP2 > 0 ? rawP2 : null;

  if (p2 !== null && p2 !== p1) {
    const sellingPrice = Math.min(p1, p2);
    const originalPrice = Math.max(p1, p2);
    const savingsAmount = originalPrice - sellingPrice;
    const discountPercent = Math.round((savingsAmount / originalPrice) * 100);

    return {
      sellingPrice,
      originalPrice: savingsAmount > 0 ? originalPrice : null,
      hasDiscount: savingsAmount > 0,
      discountPercent: savingsAmount > 0 ? discountPercent : 0,
      savingsAmount: Math.max(0, savingsAmount),
      isFree: false,
    };
  }

  return {
    sellingPrice: p1,
    originalPrice: null,
    hasDiscount: false,
    discountPercent: 0,
    savingsAmount: 0,
    isFree: false,
  };
}
