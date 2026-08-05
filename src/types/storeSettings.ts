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
  updatedAt: string;
};

export type UpdateStoreSettingsInput = {
  storeName: string;
  businessEmail: string;
  description: string;
  currency: StoreCurrency;
  lowStockThreshold: number;
  logoPath: string | null;
};

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
    updatedAt: "",
  };
}
