// === API Response Wrappers ===
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
}

// === Products ===
export interface Product {
  id: string;
  name: string;
  price: number;
  variant: string | null;
  inventory: number;
  is_active: boolean;
  original_image_url: string;
  qr_image_url: string | null;
  qr_payload: string | null;
  fallback_product_id: string;
}

export interface ProductCreateRequest {
  name: string;
  price: number;
  variant?: string;
  inventory?: number;
  original_image_url: string;
}

export interface ProductUpdateRequest {
  name?: string;
  price?: number;
  variant?: string | null;
  inventory?: number;
  is_active?: boolean;
  original_image_url?: string;
}

export interface UploadSignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export interface GenerateQRResponse {
  id: string;
  qr_image_url: string;
  qr_payload: string;
}

// === Customers ===
export interface DeliveryAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  phone: string;
}

export interface Customer {
  id: string;
  whatsapp_number: string;
  name: string | null;
  delivery_address: Record<string, string> | null;
}

export interface CustomerUpdateRequest {
  name?: string;
  delivery_address?: DeliveryAddress;
}

// === Orders ===
export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  customer?: Customer | null;
  total_amount: number;
  status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderStatusUpdateRequest {
  status: string;
}
