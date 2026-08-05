import { supabaseRestRequest } from "../lib/supabaseRest";
import {
  createDefaultStoreSettings,
  type StoreCurrency,
  type StoreSettings,
  type UpdateStoreSettingsInput,
} from "../types/storeSettings";

type StoreSettingsRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  store_name: string | null;
  business_email: string | null;
  store_description: string | null;
  currency: StoreCurrency | null;
  low_stock_threshold: number | null;
  logo_path: string | null;
  updated_at: string;
};

function toStoreSettings(row: StoreSettingsRow): StoreSettings {
  const fallback = createDefaultStoreSettings(
    row.id,
    row.email ?? "",
    row.full_name ?? ""
  );

  return {
    id: row.id,
    storeName: row.store_name?.trim() || fallback.storeName,
    businessEmail: row.business_email?.trim() || fallback.businessEmail,
    description: row.store_description ?? "",
    currency: row.currency ?? "CAD",
    lowStockThreshold:
      typeof row.low_stock_threshold === "number"
        ? row.low_stock_threshold
        : 5,
    logoPath: row.logo_path,
    updatedAt: row.updated_at,
  };
}

export async function getStoreSettings(
  merchantId: string,
  accessToken: string
): Promise<StoreSettings> {
  const rows = await supabaseRestRequest<StoreSettingsRow[]>(
    `/profiles?id=eq.${encodeURIComponent(merchantId)}&select=*&limit=1`,
    accessToken
  );

  const profile = rows[0];

  if (!profile) {
    throw new Error("Store profile could not be found.");
  }

  return toStoreSettings(profile);
}

export async function updateStoreSettings(
  merchantId: string,
  input: UpdateStoreSettingsInput,
  accessToken: string
): Promise<StoreSettings> {
  const rows = await supabaseRestRequest<StoreSettingsRow[]>(
    `/profiles?id=eq.${encodeURIComponent(merchantId)}&select=*`,
    accessToken,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        store_name: input.storeName.trim(),
        business_email: input.businessEmail.trim().toLowerCase(),
        store_description: input.description.trim(),
        currency: input.currency,
        low_stock_threshold: input.lowStockThreshold,
        logo_path: input.logoPath,
      }),
    }
  );

  const profile = rows[0];

  if (!profile) {
    throw new Error("Store settings could not be updated.");
  }

  return toStoreSettings(profile);
}
