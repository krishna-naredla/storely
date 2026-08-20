export type BusinessType =
  | 'retail'
  | 'restaurant'
  | 'grocery'
  | 'bakery'
  | 'salon'
  | 'clinic'
  | 'hotel'
  | 'rental'
  | 'real_estate'
  | 'fashion'
  | 'jewellery'
  | 'electronics'
  | 'furniture'
  | 'education'
  | 'services'
  | 'agency'
  | 'custom';

export type ModuleKey =
  | 'products'
  | 'services'
  | 'menu'
  | 'rooms'
  | 'vehicles'
  | 'cart_ordering'
  | 'table_delivery'
  | 'booking_appointments'
  | 'stay_booking'
  | 'rental_booking'
  | 'inquiries'
  | 'reviews'
  | 'offers'
  | 'digital_card'
  | 'inventory_tracking';

export interface BusinessModuleConfig {
  products?: boolean;
  services?: boolean;
  menu?: boolean;
  rooms?: boolean;
  vehicles?: boolean;
  cart_ordering?: boolean;
  table_delivery?: boolean;
  booking_appointments?: boolean;
  stay_booking?: boolean;
  rental_booking?: boolean;
  inquiries?: boolean;
  reviews?: boolean;
  offers?: boolean;
  digital_card?: boolean;
  inventory_tracking?: boolean;
  
  // Alternative key aliases for backward/cross-module compatibility
  catalog_products?: boolean;
  catalog_services?: boolean;
  catalog_menu?: boolean;
  catalog_rooms?: boolean;
  catalog_vehicles?: boolean;
  cart_orders?: boolean;
  dine_in_ordering?: boolean;
  whatsapp_ordering?: boolean;
  customer_reviews?: boolean;
  offers_promotions?: boolean;
  [key: string]: boolean | undefined;
}

export type BusinessModules = BusinessModuleConfig;

export interface BusinessProfile {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  type: BusinessType;
  tagline?: string;
  description?: string;
  logo?: string;
  banner?: string;
  coverImage?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  pincode?: string;
  city?: string;
  state?: string;
  locationUrl?: string;
  businessHours?: {
    openTime: string;
    closeTime: string;
    days: string[];
    isAlwaysOpen?: boolean;
  };
  currency: string;
  currencySymbol: string;
  deliveryAvailable: boolean;
  deliveryFee?: number;
  minOrderAmount?: number;
  minOrderValue?: number;
  taxPercent?: number;
  taxRate?: number;
  enableCod?: boolean;
  enableOnlinePayment?: boolean;
  upiId?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    youtube?: string;
  };
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    youtube?: string;
  };
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  modules: BusinessModuleConfig;
  status: 'active' | 'inactive' | 'draft' | 'suspended' | 'maintenance';
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceImage?: string;
  themeColor?: string;
  shareCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type CatalogItemType =
  | 'product'
  | 'service'
  | 'menu_item'
  | 'room'
  | 'vehicle'
  | 'package'
  | 'property'
  | 'course'
  | 'custom';

export interface CatalogItemVariant {
  id: string;
  name: string; // e.g. "Size: L" or "500g"
  price: number;
  stock?: number;
  sku?: string;
}

export interface CatalogItemAddon {
  id: string;
  name: string;
  price: number;
  isRequired?: boolean;
}

export interface CatalogItem {
  id: string;
  businessId: string;
  type: CatalogItemType;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription?: string;
  detailedDescription?: string;
  price: number;
  salePrice?: number;
  unit?: string; // "kg", "pcs", "night", "hour", "day", "session", "plate"
  sku?: string;
  images: string[];
  inStock: boolean;
  stockQuantity?: number;
  minStockAlert?: number;
  isFeatured?: boolean;
  isOffer?: boolean;
  offerText?: string;
  
  // Specific vertical extensions
  durationMinutes?: number; // for salon/services/appointments
  prepTimeMinutes?: number; // for restaurant
  isVeg?: boolean; // for food
  spiceLevel?: 'mild' | 'medium' | 'spicy';
  
  // Hotel / Stay extensions
  roomCapacity?: number;
  bedType?: string;
  amenities?: string[];
  
  // Vehicle rental extensions
  vehicleModel?: string;
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'cng';
  transmission?: 'manual' | 'automatic';
  seatingCapacity?: number;
  
  // Variations and Addons
  variants?: CatalogItemVariant[];
  addons?: CatalogItemAddon[];
  
  sortOrder?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type OrderStatus =
  | 'pending'
  | 'pending-verification'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantName?: string;
  addons?: { name: string; price: number }[];
  image?: string;
  unit?: string;
}

export interface Order {
  id: string;
  businessId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerWhatsApp?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  customerPincode?: string;
  orderType: 'delivery' | 'pickup' | 'dine_in' | 'digital';
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'upi_on_delivery' | 'online' | 'cash_at_counter';
  paymentStatus: 'pending' | 'paid' | 'failed';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  businessId: string;
  bookingNumber: string;
  bookingType: 'appointment' | 'room_stay' | 'vehicle_rental' | 'consultation';
  itemId: string;
  itemName: string;
  itemImage?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  
  // Date & Time details
  bookingDate: string; // YYYY-MM-DD
  bookingTimeSlot?: string; // e.g. "10:00 AM - 11:00 AM"
  checkInDate?: string;
  checkOutDate?: string;
  startDate?: string;
  endDate?: string;
  
  guestsCount?: number;
  vehicleQuantity?: number;
  duration?: string;
  
  totalAmount: number;
  status: BookingStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  totalOrders: number;
  totalBookings: number;
  totalSpent: number;
  firstInteractionAt: number;
  lastInteractionAt: number;
  notes?: string;
}

export interface Review {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone?: string;
  rating: number; // 1 to 5
  comment: string;
  reply?: string;
  replyAt?: number;
  isVerifiedPurchase?: boolean;
  status: 'published' | 'hidden';
  createdAt: number;
}

export interface Offer {
  id: string;
  businessId: string;
  title: string;
  code?: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  totalBookings: number;
  totalCustomers: number;
  totalProducts: number;
  storeViews: number;
  whatsappClicks: number;
  conversionRate: number;
  recentOrders: Order[];
  recentBookings: Booking[];
}

export interface CartItem {
  id: string; // unique item key combining itemId + variantId
  catalogItem: CatalogItem;
  quantity: number;
  selectedVariant?: CatalogItemVariant;
  selectedAddons?: CatalogItemAddon[];
}
