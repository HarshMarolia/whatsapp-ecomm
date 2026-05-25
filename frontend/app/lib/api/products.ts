import { apiFetch } from "../api";
import type {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  UploadSignature,
  GenerateQRResponse,
} from "../types";

export async function listProducts(includeInactive = true): Promise<Product[]> {
  return apiFetch<Product[]>(
    `/products?include_inactive=${includeInactive}`
  );
}

export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export async function createProduct(
  data: ProductCreateRequest
): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: string,
  data: ProductUpdateRequest
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<null>(`/products/${id}`, { method: "DELETE" });
}

export async function generateQR(id: string): Promise<GenerateQRResponse> {
  return apiFetch<GenerateQRResponse>(`/products/${id}/generate-qr`, {
    method: "POST",
  });
}

export async function getUploadSignature(): Promise<UploadSignature> {
  return apiFetch<UploadSignature>("/products/upload-signature", {
    method: "POST",
  });
}
