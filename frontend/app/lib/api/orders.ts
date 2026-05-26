import { apiFetch } from "../api";
import type { Order, OrderStatusUpdateRequest } from "../types";

export async function listOrders(status?: string): Promise<Order[]> {
  const query = status ? `?status=${status}` : "";
  return apiFetch<Order[]>(`/orders${query}`);
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

export async function updateOrderStatus(
  id: string,
  data: OrderStatusUpdateRequest
): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
