export const STORE_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD"] as const;

export type StoreCurrency = (typeof STORE_CURRENCIES)[number];

export type StoreSettings = {
  id: string;
  storeName: string;
  businessEmail: string;
  description: string;
  currency: StoreCurrency;
  lowStockThreshold: number;
  logoPath: string | null;
  storeSlug: string;
  isPublished: boolean;
  updatedAt: string;
};

export type UpdateStoreSettingsInput = {
  storeName: string;
  businessEmail: string;
  description: string;
  currency: StoreCurrency;
  lowStockThreshold: number;
  logoPath: string | null;
  storeSlug?: string;
  isPublished?: boolean;
};

function createFallbackSlug(email: string, fullName: string) {
  const source = fullName.trim() || email.split("@")[0]?.trim() || "store";
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return normalized.length >= 3 ? normalized : "store";
}

export function createDefaultStoreSettings(
  id = "",
  email = "",
  fullName = ""
): StoreSettings {
  const emailName = email.split("@")[0]?.trim();

  return {
    id,
    storeName: fullName.trim() || emailName || "My Store",
    businessEmail: email,
    description: "",
    currency: "CAD",
    lowStockThreshold: 5,
    logoPath: null,
    storeSlug: createFallbackSlug(email, fullName),
    isPublished: false,
    updatedAt: "",
  };
}
