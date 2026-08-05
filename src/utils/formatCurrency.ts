import type { StoreCurrency } from "../types/storeSettings";

export function formatCurrency(
  value: number,
  currency: StoreCurrency = "CAD"
): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(value);
}
