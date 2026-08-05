import { decode } from "base64-arraybuffer";
import { createClient } from "@supabase/supabase-js";

const PRODUCT_IMAGES_BUCKET = "product-images";

type UploadProductImageInput = {
  base64: string;
  merchantId: string;
  accessToken: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function getConfig() {
  const baseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !publishableKey) {
    throw new Error(
      "Supabase Storage is not configured."
    );
  }

  return {
    baseUrl,
    publishableKey,
  };
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
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  const fileExtension = fileName
    ?.split(".")
    .pop()
    ?.toLowerCase();

  if (
    fileExtension === "png" ||
    fileExtension === "webp" ||
    fileExtension === "jpg" ||
    fileExtension === "jpeg"
  ) {
    return fileExtension === "jpeg"
      ? "jpg"
      : fileExtension;
  }

  return "jpg";
}

export async function uploadProductImage({
  base64,
  merchantId,
  accessToken,
  mimeType,
  fileName,
}: UploadProductImageInput): Promise<string> {
  const extension = getExtension(mimeType, fileName);

  const uniqueName =
    `${Date.now()}-` +
    `${Math.random().toString(36).slice(2)}` +
    `.${extension}`;

  const path = `${merchantId}/${uniqueName}`;

  const client = createStorageClient(accessToken);

  const { error } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
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

export async function deleteProductImage(
  path: string,
  accessToken: string
): Promise<void> {
  const client = createStorageClient(accessToken);

  const { error } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(error.message);
  }
}

export function getProductImageUrl(
  path: string
): string {
  const { baseUrl } = getConfig();

  const encodedPath = path
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return (
    `${baseUrl}/storage/v1/object/public/` +
    `${PRODUCT_IMAGES_BUCKET}/${encodedPath}`
  );
}