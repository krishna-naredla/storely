import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BusinessProfile, Order, Booking, Review, Customer, CatalogItem } from '../types';
import {
  PlatformPricingPlan,
  PlatformPaymentTransaction,
  PlatformAuditLog,
  PlatformSupportTicket,
  PlatformAnnouncement,
  PlatformGlobalSettings,
} from '../types/admin';

// Whitelisted default Super Admin emails for secure authorization
export const AUTHORIZED_ADMIN_EMAILS = [
  'maninaredla218@gmail.com',
  'admin@storelly.com',
  'superadmin@storelly.com',
];

export function isUserAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.includes(normalized);
}

// Fetch all businesses across platform
export async function adminGetAllBusinesses(): Promise<BusinessProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses'));
    const list = snap.docs.map((d) => d.data() as BusinessProfile);
    if (list.length > 0) {
      localStorage.setItem('storelly_admin_all_biz', JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Admin fetch businesses error, falling back to cache:', err);
  }
  
  try {
    const cached = localStorage.getItem('storelly_admin_all_biz');
    if (cached) return JSON.parse(cached);
  } catch {}

  // Fallback to cached local businesses
  try {
    const localRaw = localStorage.getItem('storelly_cached_businesses');
    if (localRaw) return JSON.parse(localRaw);
  } catch {}

  return [];
}

// Admin update business status / plan / verification
export async function adminUpdateBusiness(businessId: string, updates: Partial<BusinessProfile>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId);
  await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
}

// Fetch all platform orders across all businesses
export async function adminGetAllOrders(): Promise<{ order: Order; businessName: string }[]> {
  const businesses = await adminGetAllBusinesses();
  const allOrders: { order: Order; businessName: string }[] = [];

  for (const biz of businesses) {
    try {
      const snap = await getDocs(collection(db, 'businesses', biz.id, 'orders'));
      snap.docs.forEach((d) => {
        allOrders.push({ order: d.data() as Order, businessName: biz.name });
      });
    } catch {}
  }
  return allOrders;
}

// Fetch all platform bookings
export async function adminGetAllBookings(): Promise<{ booking: Booking; businessName: string }[]> {
  const businesses = await adminGetAllBusinesses();
  const allBookings: { booking: Booking; businessName: string }[] = [];

  for (const biz of businesses) {
    try {
      const snap = await getDocs(collection(db, 'businesses', biz.id, 'bookings'));
      snap.docs.forEach((d) => {
        allBookings.push({ booking: d.data() as Booking, businessName: biz.name });
      });
    } catch {}
  }
  return allBookings;
}

// Fetch all platform reviews
export async function adminGetAllReviews(): Promise<{ review: Review; businessName: string }[]> {
  const businesses = await adminGetAllBusinesses();
  const allReviews: { review: Review; businessName: string }[] = [];

  for (const biz of businesses) {
    try {
      const snap = await getDocs(collection(db, 'businesses', biz.id, 'reviews'));
      snap.docs.forEach((d) => {
        allReviews.push({ review: d.data() as Review, businessName: biz.name });
      });
    } catch {}
  }
  return allReviews;
}

// Fetch all platform customers
export async function adminGetAllCustomers(): Promise<{ customer: Customer; businessName: string }[]> {
  const businesses = await adminGetAllBusinesses();
  const allCustomers: { customer: Customer; businessName: string }[] = [];

  for (const biz of businesses) {
    try {
      const snap = await getDocs(collection(db, 'businesses', biz.id, 'customers'));
      snap.docs.forEach((d) => {
        allCustomers.push({ customer: d.data() as Customer, businessName: biz.name });
      });
    } catch {}
  }
  return allCustomers;
}

// Audit Logs
export async function adminGetAuditLogs(): Promise<PlatformAuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'admin_audit_logs'));
    const logs = snap.docs.map((d) => d.data() as PlatformAuditLog);
    if (logs.length > 0) return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch {}

  try {
    const cached = localStorage.getItem('storelly_admin_audit_logs');
    if (cached) return JSON.parse(cached);
  } catch {}

  return [
    {
      id: 'log_1',
      adminEmail: 'maninaredla218@gmail.com',
      action: 'SYSTEM_INIT',
      target: 'Platform',
      details: 'Master Admin Control Center initialized successfully.',
      timestamp: Date.now() - 3600000,
    },
  ];
}

export async function adminRecordAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): Promise<void> {
  const newLog: PlatformAuditLog = {
    ...log,
    id: 'log_' + Date.now(),
    timestamp: Date.now(),
  };
  try {
    await setDoc(doc(db, 'admin_audit_logs', newLog.id), newLog);
  } catch {}

  try {
    const existing = await adminGetAuditLogs();
    existing.unshift(newLog);
    localStorage.setItem('storelly_admin_audit_logs', JSON.stringify(existing));
  } catch {}
}

// Pricing Plans Management
export async function adminGetPricingPlans(): Promise<PlatformPricingPlan[]> {
  try {
    const snap = await getDocs(collection(db, 'platform_pricing_plans'));
    const plans = snap.docs.map((d) => d.data() as PlatformPricingPlan);
    if (plans.length > 0) return plans;
  } catch {}

  try {
    const cached = localStorage.getItem('storelly_admin_plans');
    if (cached) return JSON.parse(cached);
  } catch {}

  return [
    {
      id: 'plan_starter',
      name: 'Starter Plan',
      tagline: 'Ideal for small local shops & boutiques',
      monthlyPrice: 299,
      yearlyPrice: 2999,
      trialDays: 14,
      isActive: true,
      features: ['Digital Storefront', 'Up to 50 Products', 'WhatsApp Orders', 'Basic Analytics'],
      limits: { catalogueItems: 50, monthlyOrders: 500, customerRecords: 1000, hasCustomDomain: false, hasAiPromotions: false, hasDigitalCard: true },
    },
    {
      id: 'plan_pro',
      name: 'Professional Pro',
      tagline: 'For growing brands & high-volume merchants',
      monthlyPrice: 599,
      yearlyPrice: 5999,
      trialDays: 14,
      isActive: true,
      features: ['Unlimited Products & Categories', 'Advanced CRM & Bookings', 'Custom Domain', 'Priority Support', 'AI Product Promos'],
      limits: { catalogueItems: 9999, monthlyOrders: 99999, customerRecords: 50000, hasCustomDomain: true, hasAiPromotions: true, hasDigitalCard: true },
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise Business OS',
      tagline: 'Full multi-branch & multi-staff control',
      monthlyPrice: 1299,
      yearlyPrice: 12999,
      trialDays: 14,
      isActive: true,
      features: ['Multi-branch Support', 'Dedicated Account Manager', 'Custom API & Webhooks', 'Advanced Staff Roles'],
      limits: { catalogueItems: 99999, monthlyOrders: 999999, customerRecords: 999999, hasCustomDomain: true, hasAiPromotions: true, hasDigitalCard: true },
    },
  ];
}

export async function adminSavePricingPlan(plan: PlatformPricingPlan): Promise<void> {
  await setDoc(doc(db, 'platform_pricing_plans', plan.id), plan);
  localStorage.setItem('storelly_admin_plans', JSON.stringify(await adminGetPricingPlans()));
}

// Global Settings
export async function adminGetGlobalSettings(): Promise<PlatformGlobalSettings> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'global'));
    if (snap.exists()) return snap.data() as PlatformGlobalSettings;
  } catch {}

  return {
    siteTitle: 'Storelly - Digital Business Operating System',
    siteDescription: 'Create your online store, manage products, receive orders, and grow your brand.',
    supportEmail: 'support@storelly.com',
    supportPhone: '+91 98765 43210',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultCurrency: 'INR',
    taxRatePercent: 5,
  };
}

export async function adminSaveGlobalSettings(settings: PlatformGlobalSettings): Promise<void> {
  await setDoc(doc(db, 'platform_settings', 'global'), settings);
}
