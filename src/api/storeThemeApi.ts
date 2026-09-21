import { supabaseRestRequest, SupabaseRestError } from "../lib/supabaseRest";
import { normalizeTheme, type StoreTheme } from "../types/storeTheme";

export type StoreDesign = { draft: StoreTheme; published: StoreTheme | null };

function designError(error: unknown): never {
  if (
    error instanceof SupabaseRestError &&
    (error.status === 404 ||
      error.code === "PGRST205" ||
      error.code === "42P01")
  ) {
    throw new Error(
      "Website design is not enabled yet. Please contact the platform administrator.",
    );
  }
  throw error;
}

export async function getStoreDesign(
  merchantId: string,
  token: string,
): Promise<StoreDesign> {
  try {
    const rows = await supabaseRestRequest<
      { draft: unknown; published: unknown }[]
    >(
      `/storefront_themes?merchant_id=eq.${encodeURIComponent(merchantId)}&select=draft,published&limit=1`,
      token,
    );
    return {
      draft: normalizeTheme(rows[0]?.draft),
      published: rows[0]?.published ? normalizeTheme(rows[0].published) : null,
    };
  } catch (error) {
    return designError(error);
  }
}

export async function saveStoreDesign(
  merchantId: string,
  token: string,
  theme: StoreTheme,
  publish: boolean,
) {
  const clean = normalizeTheme(theme);
  try {
    await supabaseRestRequest(
      "/storefront_themes?on_conflict=merchant_id",
      token,
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          merchant_id: merchantId,
          draft: clean,
          ...(publish ? { published: clean } : {}),
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return clean;
  } catch (error) {
    return designError(error);
  }
}
