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
  | 'digital_creator'
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
  | 'inventory_tracking'
  | 'digital_products'
  | 'universal_links'
  | 'work_portfolio'
  | 'events_ticketing'
  | 'custom_quotes'
  | 'analytics';

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
  digital_products?: boolean;
  universal_links?: boolean;
  work_portfolio?: boolean;
  portfolio?: boolean;
  events_ticketing?: boolean;
  custom_quotes?: boolean;
  analytics?: boolean;

  
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
  username?: string; // For @username URLs
  type: BusinessType;
  category?: string;
  tagline?: string;
  description?: string;
  bio?: string; // Specific for creators
  logo?: string;
  banner?: string;
  coverImage?: string;
  profileImage?: string; // Specific for creators
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
    twitter?: string;
    telegram?: string;
    linkedin?: string;
  };
  socials?: {
    instagram?: string;
    facebook?: string;
    website?: string;
    youtube?: string;
    twitter?: string;
    telegram?: string;
    linkedin?: string;
  };
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoMetaKeywords?: string;
  seoMetaImage?: string;
  modules: BusinessModuleConfig;
  status: 'active' | 'inactive' | 'draft' | 'suspended' | 'maintenance' | 'deleted';
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceImage?: string;
  themeColor?: string;
  accentColor?: string; // Specific for creators
  publicProfileStatus?: 'published' | 'draft'; // Specific for creators
  shareCount?: number;
  bioRouting?: 'standalone' | 'storefront' | 'both';
  bioTheme?: any;
  portfolioSettings?: PortfolioSettings;
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

  // Digital Creator extensions
  productType?: 'physical' | 'digital_file' | 'consultation_slot';
  isFree?: boolean;
  digitalFileType?: 'pdf' | 'zip' | 'video' | 'audio' | 'document' | 'template' | 'course' | 'images' | 'other';
  digitalFileUrl?: string; // Secure Cloudinary URL or Signed URL
  digitalFileId?: string; // Cloudinary Public ID
  fileName?: string;
  fileSize?: string;
  downloadLimit?: number;
  salesCount?: number;
  digitalFiles?: {
    id: string;
    title: string;
    url: string;
    fileId?: string;
    fileType?: string;
    fileSize?: string;
  }[];
  
  // Booking/Consultation extensions
  consultationDuration?: number; // minutes
  consultationDays?: string[]; // e.g. ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
  consultationTimeSlots?: string[]; // e.g. ["17:00", "18:00"]
  timezone?: string;
  bufferTime?: number; // minutes
  
  // Variations and Addons
  variants?: CatalogItemVariant[];
  addons?: CatalogItemAddon[];
  
  sortOrder?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityLink {
  id: string;
  linkId: string;
  businessId: string;
  type: 'whatsapp' | 'telegram' | 'youtube' | 'instagram' | 'google_form' | 'google_sheet' | 'google_doc' | 'gdrive' | 'custom';
  title: string;
  description?: string;
  url: string;
  clickCount: number;
  order: number;
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
  downloadStatus?: 'not_started' | 'completed';
  digitalAccessUrl?: string; // Temporary signed URL
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
  paymentStatus?: 'pending' | 'paid' | 'failed';
  meetingUrl?: string; // Google Meet or Zoom
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
  bioLinkViews?: number;
  bioLinkClicks?: number;
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

export interface BioLink {
  id: string;
  businessId: string;
  type: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
  enabled: boolean;
  clickCount?: number;
  createdAt: number;
  updatedAt: number;
}


// ==========================================
// MODULE 3: WORK PORTFOLIO & SHOWCASE TYPES
// ==========================================

export type PortfolioCategory =
  | 'Photography'
  | 'Video/Motion'
  | 'Design'
  | 'Development'
  | 'Writing'
  | 'Coaching'
  | 'Events'
  | 'Beauty'
  | 'Handmade/Art'
  | 'Other';

export type PortfolioMediaType =
  | 'image'
  | 'gallery'
  | 'video_file'
  | 'external_video'
  | 'external_link';

export interface PortfolioItem {
  id: string;
  businessId: string;
  title: string;
  category: PortfolioCategory;
  coverImage: string; // Required cover thumbnail
  mediaType: PortfolioMediaType;
  mediaUrls?: string[]; // For single image, gallery images, or uploaded video file
  externalUrl?: string; // For YouTube/Vimeo embed, Figma, GitHub, live site, article
  description: string;
  tags?: string[];
  order: number;
  isActive: boolean;
  clientName?: string;
  projectOutcome?: string;
  cloudinaryPublicIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlatformStat {
  id: string;
  platform: string; // e.g., 'Instagram', 'YouTube', 'TikTok', 'Twitter / X', 'LinkedIn', 'Spotify', 'Other'
  count: string; // e.g., '120K', '45.2K', '1.5M'
  engagementRate?: string; // e.g., '4.8%'
  label?: string; // e.g., 'Followers', 'Subscribers', 'Monthly Readers'
  profileUrl?: string;
}

export interface BrandCollab {
  id: string;
  brandName: string;
  description: string;
  logoUrl?: string;
  collabYear?: string;
  linkUrl?: string;
}

export interface Testimonial {
  id: string;
  businessId: string;
  clientName: string;
  clientPhoto?: string;
  clientRole?: string; // e.g. "Bride & Groom", "Founder at Acme Corp"
  quote: string;
  rating?: number; // 1 to 5
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
}

export interface PortfolioSettings {
  template?: 'default' | 'developer' | 'designer' | 'photographer';
  ctaMode: 'whatsapp' | 'booking' | 'custom_quote'; // Enquiry mode
  customCtaText?: string;
  whatsappMessage?: string;
  bookingItemId?: string; // Optional link to specific consultation service item
  headline?: string;
  subheadline?: string;
  enableCustomQuotes?: boolean;
  customQuoteTitle?: string;
  customQuoteDescription?: string;
  mediaKit?: {
    enabled?: boolean;
    heading?: string;
    subheading?: string;
    platformStats?: PlatformStat[];
    brandCollabs?: BrandCollab[];
  };
}

// ==========================================
// MODULE 4: EVENT & WEBINAR TICKETING TYPES
// ==========================================

export type EventFormat = 'online' | 'offline';
export type EventStatus = 'upcoming' | 'past' | 'sold_out' | 'cancelled';
export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'youtube_live' | 'other';

export interface EventItem {
  id: string;
  businessId: string;
  title: string;
  description: string;
  coverImage: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // e.g. "18:00" or "06:00 PM"
  eventDurationMinutes?: number;
  format: EventFormat;
  meetingUrl?: string; // Google Meet / Zoom link (private, sent only on ticket delivery)
  meetingPlatform?: MeetingPlatform;
  venueAddress?: string;
  venueCity?: string;
  price: number; // 0 = Free
  isFree?: boolean;
  capacity: number; // e.g. 50
  seatsRemaining: number; // Atomic tracking
  ticketsSold: number;
  status: EventStatus;
  cancellationReason?: string;
  sendMeetingLinkTiming?: 'immediately' | 'closer_to_event';
  sortOrder?: number;
  isActive?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EventTicket {
  id: string;
  ticketId: string; // Short readable code like "TKT-8X92-A1B4"
  eventId: string;
  eventTitle: string;
  businessId: string;
  customerName: string;
  customerPhone: string; // WhatsApp number
  customerEmail?: string;
  format: EventFormat;
  eventDate: string;
  eventTime: string;
  price: number;
  paymentStatus: 'paid' | 'free' | 'refunded';
  paymentId?: string;
  razorpayOrderId?: string;
  checkedIn: boolean;
  checkedInAt?: number;
  meetingUrl?: string; // Private link stored upon confirmed ticket
  venueAddress?: string;
  venueCity?: string;
  qrCodeUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

// ==========================================
// MODULE 5: CUSTOM ORDER / QUOTE REQUEST TYPES
// ==========================================

export type QuoteRequestStatus =
  | 'new'
  | 'quoted'
  | 'accepted'
  | 'completed'
  | 'rejected'
  | 'archived';

export interface CustomQuoteRequest {
  id: string;
  businessId: string;
  requestNumber: string; // e.g. "REQ-1042"
  customerName: string;
  customerPhone: string; // WhatsApp number
  customerEmail?: string;
  description: string;
  budgetRange?: string; // e.g. "₹2,000 - ₹5,000", "Under ₹1,000", "Not sure / Open to quote"
  referenceImages?: string[]; // Cloudinary image URLs
  
  // Creator Quote details
  quotedPrice?: number;
  quoteNotes?: string;
  estimatedDeliveryDays?: number;
  quotedAt?: number;
  
  // Payment & Link details
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentStatus?: 'pending' | 'paid';
  paymentId?: string;
  paidAt?: number;
  
  status: QuoteRequestStatus;
  isArchived?: boolean;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}



