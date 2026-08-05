import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";

const STORE_LOGOS_BUCKET = "store-logos";

type UploadStoreLogoInput = {
  base64: string;
  merchantId: string;
  accessToken: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function getConfig() {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) {
    throw new Error("Supabase Storage is not configured.");
  }

  return { baseUrl, publishableKey };
}

function createStorageClient(accessToken: string) {
  const { baseUrl, publishableKey } = getConfig();

  return createClient(baseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

function getExtension(
  mimeType?: string | null,
  fileName?: string | null
) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";

  const extension = fileName?.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return "jpg";
}

export async function uploadStoreLogo({
  base64,
  merchantId,
  accessToken,
  mimeType,
  fileName,
}: UploadStoreLogoInput): Promise<string> {
  const extension = getExtension(mimeType, fileName);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `${merchantId}/${uniqueName}`;
  const client = createStorageClient(accessToken);

  const { error } = await client.storage
    .from(STORE_LOGOS_BUCKET)
    .upload(path, decode(base64), {
      contentType: mimeType ?? "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function deleteStoreLogo(
  path: string,
  accessToken: string
): Promise<void> {
  const client = createStorageClient(accessToken);
  const { error } = await client.storage.from(STORE_LOGOS_BUCKET).remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export function getStoreLogoUrl(path: string): string {
  const { baseUrl } = getConfig();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  return `${baseUrl}/storage/v1/object/public/${STORE_LOGOS_BUCKET}/${encodedPath}`;
}
