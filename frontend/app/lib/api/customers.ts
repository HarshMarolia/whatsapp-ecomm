import { apiFetch } from "../api";
import type { Customer, CustomerUpdateRequest } from "../types";

export async function listCustomers(): Promise<Customer[]> {
  return apiFetch<Customer[]>("/customers");
}

export async function getCustomer(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`);
}

export async function updateCustomer(
  id: string,
  data: CustomerUpdateRequest
): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
