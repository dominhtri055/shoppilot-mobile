import { supabaseRestRequest } from "../lib/supabaseRest";
import { Product, ProductStatus } from "../types/commerce";

type ProductRow = {
  id: string;
  merchant_id: string;
  title: string;
  vendor: string;
  price: number | string;
  inventory: number;
  status: ProductStatus;
  tags: string[] | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateProductInput = {
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  imagePath?: string | null;
  status?: ProductStatus;
  tags?: string[];
};

export type UpdateProductInput = {
  title: string;
  vendor: string;
  price: number;
  inventory: number;
  imagePath: string | null;
  tags: string[];
};

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    vendor: row.vendor,
    price: Number(row.price),
    imagePath: row.image_path,
    inventory: row.inventory,
    status: row.status,
    tags: row.tags ?? [],
    updatedAt: row.updated_at,
  };
}

export async function getProducts(accessToken: string): Promise<Product[]> {
  const rows = await supabaseRestRequest<ProductRow[]>(
    "/products?select=*&order=updated_at.desc",
    accessToken,
  );

  return rows.map(toProduct);
}

export async function getProductById(
  id: string,
  accessToken: string,
): Promise<Product> {
  const rows = await supabaseRestRequest<ProductRow[]>(
    `/products?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    accessToken,
  );

  const product = rows[0];

  if (!product) {
    throw new Error("Product not found.");
  }

  return toProduct(product);
}

export async function createProduct(
  input: CreateProductInput,
  merchantId: string,
  accessToken: string,
): Promise<Product> {
  const rows = await supabaseRestRequest<ProductRow[]>(
    "/products?select=*",
    accessToken,
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        title: input.title.trim(),
        vendor: input.vendor.trim(),
        price: input.price,
        inventory: Math.max(0, input.inventory),
        status: input.status ?? "active",
        tags: input.tags ?? [],
        image_path: input.imagePath ?? null,
      }),
    },
  );

  const product = rows[0];

  if (!product) {
    throw new Error("Product was created but no data was returned.");
  }

  return toProduct(product);
}

export async function updateProductDetails(
  id: string,
  input: UpdateProductInput,
  accessToken: string,
): Promise<Product> {
  return updateProduct(
    id,
    {
      title: input.title.trim(),
      vendor: input.vendor.trim(),
      price: input.price,
      inventory: Math.max(0, input.inventory),
      tags: input.tags,
      image_path: input.imagePath,
    },
    accessToken,
  );
}

export async function updateProductInventory(
  id: string,
  inventory: number,
  accessToken: string,
): Promise<Product> {
  return updateProduct(id, { inventory: Math.max(0, inventory) }, accessToken);
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
  accessToken: string,
): Promise<Product> {
  return updateProduct(id, { status }, accessToken);
}

async function updateProduct(
  id: string,
  changes: Partial<
    Pick<
      ProductRow,
      | "title"
      | "vendor"
      | "price"
      | "inventory"
      | "status"
      | "tags"
      | "image_path"
    >
  >,
  accessToken: string,
): Promise<Product> {
  const rows = await supabaseRestRequest<ProductRow[]>(
    `/products?id=eq.${encodeURIComponent(id)}&select=*`,
    accessToken,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(changes),
    },
  );

  const product = rows[0];

  if (!product) {
    throw new Error("Product could not be updated.");
  }

  return toProduct(product);
}

export async function deleteProduct(id: string, accessToken: string) {
  await supabaseRestRequest<unknown>(
    `/products?id=eq.${encodeURIComponent(id)}`,
    accessToken,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal",
      },
    },
  );
}
