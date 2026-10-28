export type UserRole = 'ADMIN' | 'ACCOUNTANT' | 'SALES_STAFF' | 'DELIVERY_COORDINATOR' | string;

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state_division?: string;
  tax_number?: string;
  currency?: string;
  is_active?: boolean;
  user_count?: number;
  created_at?: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  type: 'MENU' | 'BUTTON';
  module: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system?: boolean;
  permission_codes?: string[];
  permissions?: Permission[];
  user_count?: number;
  created_at?: string;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  name_mm?: string;
  type: 'MOBILE_WALLET' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'CARD' | 'OTHER' | string;
  account_name?: string;
  account_number?: string;
  qr_code_url?: string;
  logo_url?: string;
  instruction?: string;
  is_active: boolean;
  sort_order?: number;
}

export interface DeliveryProviderItem {
  id: string;
  name: string;
  provider_type: 'INTERNAL' | 'THIRD_PARTY';
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tracking_url_template?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  role_id?: string;
  role_display_name?: string;
  organization_id?: string;
  organization?: Organization | null;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  permissions?: string[];
  is_active?: boolean;
  created_at?: string;
  last_login_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  name_mm?: string;
  description?: string;
  subcategories?: Subcategory[];
  product_count?: number;
}

export interface Subcategory {
  id: string;
  name: string;
  name_mm?: string;
}

export interface ProductVariant {
  id: string;
  product_id?: string;
  variant_name: string;
  sku: string;
  additional_price: number | string;
  stock_quantity: number;
}

export interface Product {
  id: string;
  name: string;
  name_mm?: string;
  sku: string;
  barcode?: string;
  description?: string;
  cost_price: number | string;
  sale_price: number | string;
  image_url?: string;
  is_active: boolean;
  low_stock_threshold: number;
  category_id?: string;
  subcategory_id?: string;
  category_name?: string;
  category_name_mm?: string;
  subcategory_name?: string;
  total_stock?: number;
  variants?: ProductVariant[];
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  address: string;
  township_id?: string;
  township_name?: string;
  city: string;
  state_division: string;
  fb_profile?: string;
  viber_number?: string;
  telegram_handle?: string;
  loyalty_tier: 'REGULAR' | 'SILVER' | 'GOLD' | 'PLATINUM';
  total_orders: number;
  total_spent: number | string;
  notes?: string;
  created_at: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'KBZPAY' | 'WAVEMONEY' | 'AYAPAY' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';

export interface OrderItem {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  subtotal: number;
  image_url?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  loyalty_tier?: string;
  sales_staff_name?: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string;
  subtotal_amount: number | string;
  discount_amount: number | string;
  delivery_fee: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  township_id?: string;
  township_name: string;
  customer_notes?: string;
  internal_notes?: string;
  items?: OrderItem[];
  total_items_count?: number;
  delivery_id?: string;
  rider_name?: string;
  rider_phone?: string;
  delivery_status?: DeliveryStatus;
  tracking_number?: string;
  cod_amount_expected?: number | string;
  cod_amount_collected?: number | string;
  cod_reconciled?: boolean;
  delivery_provider_name?: string;
  created_at: string;
}

export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface Delivery {
  id: string;
  order_id: string;
  order_number: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  township_name: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  total_amount: number | string;
  delivery_fee: number | string;
  provider_id?: string;
  provider_name?: string;
  provider_type?: 'INTERNAL' | 'THIRD_PARTY';
  rider_name?: string;
  rider_phone?: string;
  tracking_number?: string;
  delivery_status: DeliveryStatus;
  cod_amount_expected: number | string;
  cod_amount_collected: number | string;
  cod_reconciled: boolean;
  delivery_notes?: string;
  created_at: string;
}

export interface Township {
  id: string;
  state_division: string;
  city: string;
  name_en: string;
  name_mm: string;
  standard_delivery_fee: number | string;
  estimated_days: number;
  is_cod_available: boolean;
}

export interface FinancialAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_name_mm?: string;
  account_type: 'CASH' | 'BANK' | 'MOBILE_WALLET' | 'RECEIVABLE' | 'REVENUE' | 'EXPENSE';
  current_balance: number | string;
  account_number?: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  source_account_id?: string;
  source_account_name?: string;
  source_account_code?: string;
  destination_account_id?: string;
  dest_account_name?: string;
  dest_account_code?: string;
  amount: number | string;
  related_order_id?: string;
  order_number?: string;
  reference_number?: string;
  category?: string;
  description?: string;
  created_by_name?: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  title: string;
  amount: number | string;
  payment_method: string;
  account_id?: string;
  account_name?: string;
  paid_to?: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export interface DashboardStats {
  today_orders: number;
  today_revenue: number;
  total_revenue: number;
  low_stock_count: number;
  pending_deliveries: number;
  pending_cod_amount: number;
  total_customers: number;
  pipeline_counts: Record<OrderStatus, number>;
  recent_orders: Order[];
  top_products: Array<{ product_name: string; total_sold: number; total_revenue: number }>;
  accounts: FinancialAccount[];
}
