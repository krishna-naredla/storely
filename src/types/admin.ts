export type MasterAdminTab =
  | 'overview'
  | 'vendors'
  | 'live_stores'
  | 'urls'
  | 'customers'
  | 'subscriptions'
  | 'pricing'
  | 'payments'
  | 'clients'
  | 'reviews'
  | 'landing_cms'
  | 'branding'
  | 'seo'
  | 'faqs'
  | 'features'
  | 'business_types'
  | 'support'
  | 'announcements'
  | 'activity_log'
  | 'system_logs'
  | 'system_health'
  | 'settings';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'finance_admin' | 'support_admin' | 'moderator';
  createdAt: number;
}

export interface PlatformPricingCMS {
  badge: string;
  title: string;
  subtitle: string;
  footerNote: string;
  updatedAt?: number;
}

export interface PlatformPricingPlan {
  id: string;
  name: string;
  tagline: string;
  currency?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  billingCycle?: string;
  badge?: string;
  isRecommended?: boolean;
  trialDays?: number;
  isActive: boolean;
  order?: number;
  ctaText?: string;
  ctaAction?: 'signup' | 'login' | 'contact' | 'custom_url';
  ctaUrl?: string;
  features: string[];
  limits?: {
    catalogueItems?: number;
    monthlyOrders?: number;
    customerRecords?: number;
    hasCustomDomain?: boolean;
    hasAiPromotions?: boolean;
    hasDigitalCard?: boolean;
  };
}

export interface PlatformPaymentTransaction {
  id: string;
  businessId: string;
  businessName: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  gateway: 'razorpay' | 'stripe' | 'upi' | 'manual';
  createdAt: number;
  receiptUrl?: string;
}

export interface PlatformAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  timestamp: number;
}

export interface PlatformSupportTicket {
  id: string;
  businessId?: string;
  businessName?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: number;
  adminNotes?: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all_vendors' | 'active_vendors' | 'trial_vendors' | 'expired_vendors';
  isActive: boolean;
  createdAt: number;
}

export interface PlatformGlobalSettings {
  siteTitle: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultCurrency: string;
  taxRatePercent: number;
}

export interface PlatformClientBrand {
  id: string;
  name: string;
  category: string; // e.g., 'Fashion Boutique', 'Food & Bakery', 'Tech Coach', 'Handmade & Crafts', 'Fitness & Wellness'
  logoUrl: string;
  storeUrl?: string;
  tagline?: string;
  rating?: number;
  highlightMetric?: string; // e.g., '₹15L+ Monthly GMV', '500+ WhatsApp Orders'
  reviewText?: string;
  reviewAuthor?: string;
  isActive: boolean;
  order: number;
  createdAt: number;
  updatedAt?: number;
}

export interface PlatformRazorpayConfig {
  keyId: string;
  keySecret?: string;
  isEnabled: boolean;
  isTestMode: boolean;
  merchantName: string;
  merchantThemeColor: string;
  autoUpgradePlan: boolean;
  currency: string;
  webhookSecret?: string;
  updatedAt?: number;
}

