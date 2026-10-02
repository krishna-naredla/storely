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
import { db, auth } from '../config/firebase';
import { deleteBusiness } from './firebaseService';
import { BusinessProfile, Order, Booking, Review, Customer, CatalogItem } from '../types';
import {
  PlatformPricingPlan,
  PlatformPricingCMS,
  PlatformPaymentTransaction,
  PlatformAuditLog,
  PlatformSupportTicket,
  PlatformAnnouncement,
  PlatformGlobalSettings,
  PlatformClientBrand,
  PlatformBrandingConfig,
  PlatformSeoConfig,
  PlatformLandingHeroConfig,
  PlatformLandingBrandItem,
  PlatformLandingCMSConfig,
  PlatformCustomDomainMapping,
  PlatformCustomDomainsConfig,
} from '../types/admin';
import {
  DEFAULT_BRANDING_CONFIG,
  setCachedBranding,
} from '../utils/branding';

// Whitelisted default Super Admin emails for secure authorization
export const AUTHORIZED_ADMIN_EMAILS = [
  'localride369@gmail.com',
  'maninaredla218@gmail.com',
  'admin@storelly.com',
  'superadmin@storelly.com',
];

export const DEFAULT_PRICING_CMS: PlatformPricingCMS = {
  badge: 'Transparent Pricing',
  title: 'Start Free. Upgrade When You Grow.',
  subtitle: 'Start free, upgrade as your business grows. No hidden fees.',
  footerNote: 'Same simple pricing for vendors and creators.',
};

export const DEFAULT_PRICING_PLANS: PlatformPricingPlan[] = [
  {
    id: 'plan_free',
    name: 'FREE',
    tagline: 'Get started without upfront cost.',
    currency: '₹',
    monthlyPrice: 0,
    yearlyPrice: 0,
    billingCycle: '',
    badge: '',
    isRecommended: false,
    trialDays: 0,
    isActive: true,
    order: 1,
    ctaText: 'Start Free',
    ctaAction: 'signup',
    features: [
      'Store link',
      'Basic storefront',
      'Limited products',
      'QR code',
      'WhatsApp orders',
      'UPI payments',
    ],
    limits: {
      catalogueItems: 10,
      monthlyOrders: 100,
      customerRecords: 200,
      hasCustomDomain: false,
      hasAiPromotions: false,
      hasDigitalCard: true,
    },
  },
  {
    id: 'plan_pro',
    name: 'PRO',
    tagline: 'Everything you need to grow.',
    currency: '₹',
    monthlyPrice: 199,
    yearlyPrice: 1999,
    billingCycle: '/ month',
    badge: 'Recommended',
    isRecommended: true,
    trialDays: 14,
    isActive: true,
    order: 2,
    ctaText: 'Get Started',
    ctaAction: 'signup',
    features: [
      'More products',
      'Advanced storefront features',
      'Digital products',
      'Booking',
      'Link hub',
      'Analytics',
      'Priority support',
    ],
    limits: {
      catalogueItems: 9999,
      monthlyOrders: 99999,
      customerRecords: 50000,
      hasCustomDomain: true,
      hasAiPromotions: true,
      hasDigitalCard: true,
    },
  },
];

export function isUserAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.includes(normalized);
}

export async function verifyAdminInFirestore(email: string | null | undefined, uid?: string | null): Promise<boolean> {
  if (!email && !uid) return false;
  const normalized = email?.trim().toLowerCase();

  // 1. If user is currently signed in, check Firebase Auth custom claims
  if (auth.currentUser) {
    try {
      const tokenRes = await auth.currentUser.getIdTokenResult();
      if (tokenRes.claims.admin === true || tokenRes.claims.masterAdmin === true) {
        return true;
      }
    } catch (e) {
      console.warn('Could not read user claims:', e);
    }
  }

  // 2. Authoritative check in Firestore /admins/{uid}
  const targetUid = uid || auth.currentUser?.uid;
  if (targetUid) {
    try {
      const snap = await getDoc(doc(db, 'admins', targetUid));
      if (snap.exists() && snap.data()?.isActive !== false) {
        return true;
      }
    } catch (err) {
      // ignore
    }
  }

  // 3. Authoritative check in Firestore /admins/{email}
  if (normalized) {
    try {
      const snap = await getDoc(doc(db, 'admins', normalized));
      if (snap.exists() && snap.data()?.isActive !== false) {
        return true;
      }
    } catch (err) {
      // ignore
    }
  }

  // 4. Fallback check for whitelisted super admin email
  if (normalized && isUserAuthorizedAdmin(normalized)) {
    return true;
  }

  return false;
}

// Fetch all businesses across platform - Firestore is authoritative
export async function adminGetAllBusinesses(): Promise<BusinessProfile[]> {
  const snap = await getDocs(collection(db, 'businesses'));
  const list = snap.docs
    .map((d) => ({ ...d.data(), id: d.id } as BusinessProfile))
    .filter((b) => b.status !== 'deleted');
  localStorage.setItem('storelly_admin_all_biz', JSON.stringify(list));
  return list;
}

// Admin update business status / plan / verification
export async function adminUpdateBusiness(businessId: string, updates: Partial<BusinessProfile>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId);
  const updatedAt = Date.now();
  await updateDoc(docRef, { ...updates, updatedAt });

  // Synchronize admin cache with updated business
  try {
    const cached = localStorage.getItem('storelly_admin_all_biz');
    if (cached) {
      const parsed: BusinessProfile[] = JSON.parse(cached);
      const updatedList = parsed.map((b) => (b.id === businessId ? { ...b, ...updates, updatedAt } : b));
      localStorage.setItem('storelly_admin_all_biz', JSON.stringify(updatedList));
    }
  } catch {}

  // Synchronize local businesses cache
  try {
    const localRaw = localStorage.getItem('storelly_cached_businesses');
    if (localRaw) {
      const parsed: BusinessProfile[] = JSON.parse(localRaw);
      const updatedList = parsed.map((b) => (b.id === businessId ? { ...b, ...updates, updatedAt } : b));
      localStorage.setItem('storelly_cached_businesses', JSON.stringify(updatedList));
    }
  } catch {}
}

// Admin permanently delete business from Firestore and all caches
export async function adminDeleteBusiness(businessId: string): Promise<void> {
  // Execute thorough deletion across Firestore documents and subcollections
  await deleteBusiness(businessId);

  // Clean all admin and local caches
  try {
    const cached = localStorage.getItem('storelly_admin_all_biz');
    if (cached) {
      const parsed: BusinessProfile[] = JSON.parse(cached);
      const filtered = parsed.filter((b) => b.id !== businessId);
      localStorage.setItem('storelly_admin_all_biz', JSON.stringify(filtered));
    }
  } catch {}

  try {
    const localRaw = localStorage.getItem('storelly_cached_businesses');
    if (localRaw) {
      const parsed: BusinessProfile[] = JSON.parse(localRaw);
      const filtered = parsed.filter((b) => b.id !== businessId);
      localStorage.setItem('storelly_cached_businesses', JSON.stringify(filtered));
    }
  } catch {}

  // Notify components across window
  window.dispatchEvent(new CustomEvent('storelly_business_deleted', { detail: { businessId } }));
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

  return [];
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

export const DEFAULT_HAPPY_CLIENTS: PlatformClientBrand[] = [
  {
    id: 'client_1',
    name: 'Vogue Loom Threads',
    category: 'Handloom & Fashion Boutique',
    logoUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/vogue-loom',
    tagline: 'Premium sustainable ethnic wear across India',
    rating: 4.9,
    highlightMetric: '₹14.2L Monthly GMV',
    isActive: true,
    order: 1,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'client_2',
    name: 'SpiceCraft Artisan Roasters',
    category: 'Organic Gourmet Spices & Coffee',
    logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/spice-craft',
    tagline: 'Fresh single-origin roasts & masala blends',
    rating: 5.0,
    highlightMetric: '1,800+ WhatsApp Orders',
    isActive: true,
    order: 2,
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: 'client_3',
    name: 'ByteCraft Coding Academy',
    category: 'Tech Coach & Digital Courses',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/bytecraft',
    tagline: 'Full-stack web & AI masterclasses with digital certificates',
    rating: 4.95,
    highlightMetric: '4,200+ Students Enrolled',
    isActive: true,
    order: 3,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'client_4',
    name: 'LuxeLiving Studio Decor',
    category: 'Handcrafted Furniture & Pottery',
    logoUrl: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/luxeliving',
    tagline: 'Modern minimalist home accents made by local artisans',
    rating: 4.85,
    highlightMetric: '₹9.8L Monthly Sales',
    isActive: true,
    order: 4,
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    id: 'client_5',
    name: 'NourishPure Organics',
    category: 'Farm-Fresh Groceries & Cold Press Oils',
    logoUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/nourish-pure',
    tagline: 'Direct from organic farmers to doorstep in 2 hours',
    rating: 4.9,
    highlightMetric: '920+ Weekly Repeat Buyers',
    isActive: true,
    order: 5,
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'client_6',
    name: 'Velvet Crust Bakehouse',
    category: 'Custom Wedding Cakes & Pastries',
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/velvet-crust',
    tagline: 'Artisanal sourdough, croissants and custom birthday cakes',
    rating: 5.0,
    highlightMetric: '650+ WhatsApp Cake Orders',
    isActive: true,
    order: 6,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'client_7',
    name: 'FitPulse Performance Lab',
    category: 'Fitness Coaching & Nutrition Plans',
    logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/fitpulse',
    tagline: '1-on-1 virtual training and customized diet plans',
    rating: 4.95,
    highlightMetric: '850+ Active Clients',
    isActive: true,
    order: 7,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'client_8',
    name: 'Aura Glow Skincare',
    category: 'Ayurvedic Beauty & Wellness',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
    storeUrl: 'https://storelly.com/aura-glow',
    tagline: '100% toxin-free herbal botanical serums and face oils',
    rating: 4.9,
    highlightMetric: '₹18.5L GMV',
    isActive: true,
    order: 8,
    createdAt: Date.now() - 86400000 * 5,
  },
];

// Pricing Plans & CMS Management (Stored in system_settings in Firestore)
export async function adminGetPricingPlans(): Promise<PlatformPricingPlan[]> {
  // First check global system_settings collection in Firestore
  try {
    const sysSnap = await getDoc(doc(db, 'system_settings', 'pricing_tiers'));
    if (sysSnap.exists()) {
      const data = sysSnap.data();
      if (Array.isArray(data?.plans) && data.plans.length > 0) {
        const sorted = data.plans.sort((a: PlatformPricingPlan, b: PlatformPricingPlan) => (a.order ?? 0) - (b.order ?? 0) || a.monthlyPrice - b.monthlyPrice);
        localStorage.setItem('storelly_admin_plans', JSON.stringify(sorted));
        return sorted;
      }
    }
  } catch (err) {
    console.warn('Error reading pricing plans from system_settings:', err);
  }

  // Fallback to platform_pricing_plans collection
  try {
    const snap = await getDocs(collection(db, 'platform_pricing_plans'));
    const plans = snap.docs.map((d) => d.data() as PlatformPricingPlan);
    if (plans.length > 0) {
      plans.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.monthlyPrice - b.monthlyPrice);
      localStorage.setItem('storelly_admin_plans', JSON.stringify(plans));
      return plans;
    }
  } catch (err) {
    console.warn('Error fetching pricing plans from Firestore:', err);
  }

  try {
    const cached = localStorage.getItem('storelly_admin_plans');
    if (cached) {
      const parsed = JSON.parse(cached) as PlatformPricingPlan[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.monthlyPrice - b.monthlyPrice);
        return parsed;
      }
    }
  } catch {}

  // Cache and return defaults
  localStorage.setItem('storelly_admin_plans', JSON.stringify(DEFAULT_PRICING_PLANS));
  return DEFAULT_PRICING_PLANS;
}

export async function adminSavePricingPlan(plan: PlatformPricingPlan): Promise<void> {
  // Save to platform_pricing_plans collection
  try {
    await setDoc(doc(db, 'platform_pricing_plans', plan.id), plan);
  } catch (err) {
    console.warn('Error writing pricing plan to Firestore:', err);
  }

  try {
    const current = await adminGetPricingPlans();
    const idx = current.findIndex((p) => p.id === plan.id);
    let updated: PlatformPricingPlan[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = plan;
    } else {
      updated = [...current, plan];
    }
    updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.monthlyPrice - b.monthlyPrice);

    // Persist to global system_settings collection in Firestore
    try {
      await setDoc(doc(db, 'system_settings', 'pricing_tiers'), {
        plans: updated,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Error saving pricing tiers to system_settings:', e);
    }

    localStorage.setItem('storelly_admin_plans', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('storelly_pricing_changed', { detail: { plans: updated } }));
  } catch {}
}

export async function adminDeletePricingPlan(planId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'platform_pricing_plans', planId));
  } catch (err) {
    console.warn('Error deleting pricing plan from Firestore:', err);
  }

  try {
    const current = await adminGetPricingPlans();
    const updated = current.filter((p) => p.id !== planId);

    // Persist updated list to system_settings
    try {
      await setDoc(doc(db, 'system_settings', 'pricing_tiers'), {
        plans: updated,
        updatedAt: Date.now(),
      });
    } catch {}

    localStorage.setItem('storelly_admin_plans', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('storelly_pricing_changed', { detail: { plans: updated } }));
  } catch {}
}

export async function adminReorderPricingPlans(orderedPlans: PlatformPricingPlan[]): Promise<void> {
  const updatedPlans = orderedPlans.map((p, idx) => ({ ...p, order: idx + 1 }));
  localStorage.setItem('storelly_admin_plans', JSON.stringify(updatedPlans));
  window.dispatchEvent(new CustomEvent('storelly_pricing_changed', { detail: { plans: updatedPlans } }));

  try {
    // Save to system_settings
    await setDoc(doc(db, 'system_settings', 'pricing_tiers'), {
      plans: updatedPlans,
      updatedAt: Date.now(),
    });

    // Save to platform_pricing_plans
    await Promise.all(
      updatedPlans.map((p) => setDoc(doc(db, 'platform_pricing_plans', p.id), p))
    );
  } catch (err) {
    console.warn('Error saving reordered pricing plans:', err);
  }
}

export async function adminGetPricingCMS(): Promise<PlatformPricingCMS> {
  // Check system_settings first
  try {
    const sysSnap = await getDoc(doc(db, 'system_settings', 'pricing_cms'));
    if (sysSnap.exists()) {
      const data = sysSnap.data() as PlatformPricingCMS;
      localStorage.setItem('storelly_pricing_cms', JSON.stringify(data));
      return data;
    }
  } catch {}

  // Fallback to platform_settings
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'pricing_cms'));
    if (snap.exists()) {
      const data = snap.data() as PlatformPricingCMS;
      localStorage.setItem('storelly_pricing_cms', JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Error fetching pricing CMS from Firestore:', err);
  }

  try {
    const cached = localStorage.getItem('storelly_pricing_cms');
    if (cached) {
      const parsed = JSON.parse(cached) as PlatformPricingCMS;
      if (parsed?.title) return parsed;
    }
  } catch {}

  localStorage.setItem('storelly_pricing_cms', JSON.stringify(DEFAULT_PRICING_CMS));
  return DEFAULT_PRICING_CMS;
}

export async function adminSavePricingCMS(cms: PlatformPricingCMS): Promise<void> {
  const payload: PlatformPricingCMS = {
    ...cms,
    updatedAt: Date.now(),
  };

  try {
    // Persist to system_settings
    await setDoc(doc(db, 'system_settings', 'pricing_cms'), payload);
    // Persist to platform_settings
    await setDoc(doc(db, 'platform_settings', 'pricing_cms'), payload);
  } catch (err) {
    console.warn('Error writing pricing CMS to Firestore:', err);
  }

  localStorage.setItem('storelly_pricing_cms', JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('storelly_pricing_cms_changed', { detail: payload }));
}

export async function adminResetPricingToDefaults(): Promise<{ plans: PlatformPricingPlan[]; cms: PlatformPricingCMS }> {
  localStorage.setItem('storelly_admin_plans', JSON.stringify(DEFAULT_PRICING_PLANS));
  localStorage.setItem('storelly_pricing_cms', JSON.stringify(DEFAULT_PRICING_CMS));

  try {
    // Delete existing plans in Firestore
    const snap = await getDocs(collection(db, 'platform_pricing_plans'));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    // Set default plans
    for (const p of DEFAULT_PRICING_PLANS) {
      await setDoc(doc(db, 'platform_pricing_plans', p.id), p);
    }
    // Set system_settings
    await setDoc(doc(db, 'system_settings', 'pricing_tiers'), {
      plans: DEFAULT_PRICING_PLANS,
      updatedAt: Date.now(),
    });
    await setDoc(doc(db, 'system_settings', 'pricing_cms'), DEFAULT_PRICING_CMS);
    await setDoc(doc(db, 'platform_settings', 'pricing_cms'), DEFAULT_PRICING_CMS);
  } catch (err) {
    console.warn('Error resetting pricing in Firestore:', err);
  }

  window.dispatchEvent(new CustomEvent('storelly_pricing_changed', { detail: { plans: DEFAULT_PRICING_PLANS } }));
  window.dispatchEvent(new CustomEvent('storelly_pricing_cms_changed', { detail: DEFAULT_PRICING_CMS }));

  return { plans: DEFAULT_PRICING_PLANS, cms: DEFAULT_PRICING_CMS };
}

// HAPPY CLIENTS & BRANDS CAROUSEL (Stored in system_settings in Firestore)
export async function adminGetHappyClients(): Promise<PlatformClientBrand[]> {
  // Check system_settings/clients_carousel first
  try {
    const sysSnap = await getDoc(doc(db, 'system_settings', 'clients_carousel'));
    if (sysSnap.exists()) {
      const data = sysSnap.data();
      if (Array.isArray(data?.clients) && data.clients.length > 0) {
        const sorted = data.clients.sort((a: PlatformClientBrand, b: PlatformClientBrand) => (a.order ?? 0) - (b.order ?? 0));
        localStorage.setItem('storelly_happy_clients', JSON.stringify(sorted));
        return sorted;
      }
    }
  } catch (err) {
    console.warn('Error reading clients from system_settings:', err);
  }

  // Fallback to platform_clients collection
  try {
    const snap = await getDocs(collection(db, 'platform_clients'));
    const list = snap.docs.map((d) => d.data() as PlatformClientBrand);
    if (list.length > 0) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      localStorage.setItem('storelly_happy_clients', JSON.stringify(list));
      return list;
    }
  } catch (err) {
    console.warn('Error fetching clients from platform_clients collection:', err);
  }

  try {
    const cached = localStorage.getItem('storelly_happy_clients');
    if (cached) {
      const parsed = JSON.parse(cached) as PlatformClientBrand[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return parsed;
      }
    }
  } catch {}

  localStorage.setItem('storelly_happy_clients', JSON.stringify(DEFAULT_HAPPY_CLIENTS));
  return DEFAULT_HAPPY_CLIENTS;
}

export async function adminSaveHappyClient(client: PlatformClientBrand): Promise<void> {
  try {
    await setDoc(doc(db, 'platform_clients', client.id), client);
  } catch (err) {
    console.warn('Error saving client to Firestore:', err);
  }

  try {
    const current = await adminGetHappyClients();
    const idx = current.findIndex((c) => c.id === client.id);
    let updated: PlatformClientBrand[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = client;
    } else {
      updated = [...current, client];
    }
    updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Save to system_settings
    try {
      await setDoc(doc(db, 'system_settings', 'clients_carousel'), {
        clients: updated,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Error saving clients to system_settings:', e);
    }

    localStorage.setItem('storelly_happy_clients', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('storelly_clients_changed', { detail: { clients: updated } }));
  } catch {}
}

export async function adminDeleteHappyClient(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'platform_clients', clientId));
  } catch (err) {
    console.warn('Error deleting client from Firestore:', err);
  }

  try {
    const current = await adminGetHappyClients();
    const updated = current.filter((c) => c.id !== clientId);

    try {
      await setDoc(doc(db, 'system_settings', 'clients_carousel'), {
        clients: updated,
        updatedAt: Date.now(),
      });
    } catch {}

    localStorage.setItem('storelly_happy_clients', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('storelly_clients_changed', { detail: { clients: updated } }));
  } catch {}
}

export async function adminReorderHappyClients(orderedClients: PlatformClientBrand[]): Promise<void> {
  const updated = orderedClients.map((c, idx) => ({ ...c, order: idx + 1 }));
  localStorage.setItem('storelly_happy_clients', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('storelly_clients_changed', { detail: { clients: updated } }));

  try {
    await setDoc(doc(db, 'system_settings', 'clients_carousel'), {
      clients: updated,
      updatedAt: Date.now(),
    });
    await Promise.all(updated.map((c) => setDoc(doc(db, 'platform_clients', c.id), c)));
  } catch (err) {
    console.warn('Error saving reordered clients:', err);
  }
}

export async function adminResetHappyClientsToDefaults(): Promise<PlatformClientBrand[]> {
  localStorage.setItem('storelly_happy_clients', JSON.stringify(DEFAULT_HAPPY_CLIENTS));

  try {
    const snap = await getDocs(collection(db, 'platform_clients'));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    for (const c of DEFAULT_HAPPY_CLIENTS) {
      await setDoc(doc(db, 'platform_clients', c.id), c);
    }
    await setDoc(doc(db, 'system_settings', 'clients_carousel'), {
      clients: DEFAULT_HAPPY_CLIENTS,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Error resetting clients in Firestore:', err);
  }

  window.dispatchEvent(new CustomEvent('storelly_clients_changed', { detail: { clients: DEFAULT_HAPPY_CLIENTS } }));
  return DEFAULT_HAPPY_CLIENTS;
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storelly_global_settings_changed', { detail: settings }));
  }
}

export const DEFAULT_SEO_CONFIG: PlatformSeoConfig = {
  googleVerification: '',
  metaTitle: 'Storelly — Digital Business OS & Instant Public Storefront',
  metaDescription: 'Turn your local business into a digital storefront in minutes with WhatsApp checkout and instant catalog.',
  keywords: 'digital store, whatsapp store, business os, storelly, local business online',
};

export const DEFAULT_LANDING_HERO: PlatformLandingHeroConfig = {
  badge: "India's #1 Digital Business Operating System",
  headline: "Launch Your Online Store & Grow With Storelly",
  subtitle: "Empower your local shop, boutique, homemade brand, or service business with a professional storefront, product catalog, instant orders, and custom digital cards — in minutes, no coding needed.",
  heroImageUrl: "/landingpage.jpeg",
};

export const DEFAULT_LANDING_BRANDS: PlatformLandingBrandItem[] = [
  { name: 'Organic Store', icon: 'Store' },
  { name: 'Fashion Hub', icon: 'ShoppingBag' },
  { name: 'Tech World', icon: 'Cpu' },
  { name: 'Home Decor', icon: 'Home' },
  { name: 'Fresh Basket', icon: 'PackageCheck' },
  { name: 'Beauty Bliss', icon: 'Sparkles' },
  { name: 'Krishna Pickles', icon: 'Store' },
  { name: 'Artisan Crafts', icon: 'ShoppingBag' },
];

/**
 * 1. Branding (platform_settings/branding)
 */
export async function adminGetBranding(): Promise<PlatformBrandingConfig> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'branding'));
    if (snap.exists()) {
      const data = snap.data() as PlatformBrandingConfig;
      if (typeof window !== 'undefined') {
        localStorage.setItem('storelly_branding_name', data.siteName || DEFAULT_BRANDING_CONFIG.siteName);
        localStorage.setItem('storelly_branding_logo', data.logoUrl || DEFAULT_BRANDING_CONFIG.logoUrl);
        localStorage.setItem('storelly_branding_favicon', data.faviconUrl || DEFAULT_BRANDING_CONFIG.faviconUrl);
      }
      applyPlatformBranding(data);
      return data;
    }
  } catch (err) {
    console.warn('Error fetching branding from Firestore:', err);
  }

  // Fallback to localStorage or default
  const fallback = { ...DEFAULT_BRANDING_CONFIG };
  if (typeof window !== 'undefined') {
    try {
      const savedName = localStorage.getItem('storelly_branding_name');
      const savedLogo = localStorage.getItem('storelly_branding_logo');
      const savedFavicon = localStorage.getItem('storelly_branding_favicon');
      if (savedName) fallback.siteName = savedName;
      if (savedLogo) fallback.logoUrl = savedLogo;
      if (savedFavicon) fallback.faviconUrl = savedFavicon;
    } catch {}
  }
  applyPlatformBranding(fallback);
  return fallback;
}

export async function adminSaveBranding(branding: PlatformBrandingConfig): Promise<void> {
  const payload: PlatformBrandingConfig = {
    ...branding,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'platform_settings', 'branding'), payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem('storelly_branding_name', payload.siteName);
    localStorage.setItem('storelly_branding_logo', payload.logoUrl);
    localStorage.setItem('storelly_branding_favicon', payload.faviconUrl);
    window.dispatchEvent(new CustomEvent('storelly_branding_changed', { detail: payload }));
  }

  applyPlatformBranding(payload);
}

export function applyPlatformBranding(branding: PlatformBrandingConfig) {
  setCachedBranding(branding);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('storelly_branding_changed', { detail: branding }));
  }
  if (typeof document === 'undefined') return;
  if (branding.faviconUrl) {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
    } catch {}
  }
}

let inMemorySeoConfig: PlatformSeoConfig = (() => {
  if (typeof window !== 'undefined') {
    try {
      const gsc = localStorage.getItem('storelly_seo_gsc');
      const title = localStorage.getItem('storelly_seo_title');
      const desc = localStorage.getItem('storelly_seo_desc');
      const keywords = localStorage.getItem('storelly_seo_keywords');
      return {
        googleVerification: gsc || DEFAULT_SEO_CONFIG.googleVerification,
        metaTitle: title || DEFAULT_SEO_CONFIG.metaTitle,
        metaDescription: desc || DEFAULT_SEO_CONFIG.metaDescription,
        keywords: keywords || DEFAULT_SEO_CONFIG.keywords,
      };
    } catch {}
  }
  return { ...DEFAULT_SEO_CONFIG };
})();

export function getCachedSeoConfig(): PlatformSeoConfig {
  return inMemorySeoConfig;
}

export function setCachedSeoConfig(seo: Partial<PlatformSeoConfig>) {
  inMemorySeoConfig = { ...inMemorySeoConfig, ...seo };
}

/**
 * 2. SEO Config (platform_settings/seo)
 */
export async function adminGetSeoConfig(): Promise<PlatformSeoConfig> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'seo'));
    if (snap.exists()) {
      const data = snap.data() as PlatformSeoConfig;
      setCachedSeoConfig(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('storelly_seo_gsc', data.googleVerification || '');
        localStorage.setItem('storelly_seo_title', data.metaTitle || '');
        localStorage.setItem('storelly_seo_desc', data.metaDescription || '');
        localStorage.setItem('storelly_seo_keywords', data.keywords || '');
      }
      applyPlatformSeo(data);
      return data;
    }
  } catch (err) {
    console.warn('Error fetching SEO config from Firestore:', err);
  }

  // Fallback to localStorage or default
  const fallback = { ...DEFAULT_SEO_CONFIG };
  if (typeof window !== 'undefined') {
    try {
      const gsc = localStorage.getItem('storelly_seo_gsc');
      const title = localStorage.getItem('storelly_seo_title');
      const desc = localStorage.getItem('storelly_seo_desc');
      const keywords = localStorage.getItem('storelly_seo_keywords');
      if (gsc !== null) fallback.googleVerification = gsc;
      if (title) fallback.metaTitle = title;
      if (desc) fallback.metaDescription = desc;
      if (keywords) fallback.keywords = keywords;
    } catch {}
  }
  setCachedSeoConfig(fallback);
  applyPlatformSeo(fallback);
  return fallback;
}

export async function adminSaveSeoConfig(seo: PlatformSeoConfig): Promise<void> {
  const payload: PlatformSeoConfig = {
    ...seo,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'platform_settings', 'seo'), payload);
  setCachedSeoConfig(payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem('storelly_seo_gsc', payload.googleVerification || '');
    localStorage.setItem('storelly_seo_title', payload.metaTitle || '');
    localStorage.setItem('storelly_seo_desc', payload.metaDescription || '');
    localStorage.setItem('storelly_seo_keywords', payload.keywords || '');
    window.dispatchEvent(new CustomEvent('storelly_seo_changed', { detail: payload }));
  }

  applyPlatformSeo(payload);
}

export function applyPlatformSeo(seo: PlatformSeoConfig) {
  if (typeof document === 'undefined') return;

  // Always apply Google verification tag regardless of route
  if (seo.googleVerification) {
    let gsc = document.querySelector('meta[name="google-site-verification"]');
    if (!gsc) {
      gsc = document.createElement('meta');
      gsc.setAttribute('name', 'google-site-verification');
      document.head.appendChild(gsc);
    }
    gsc.setAttribute('content', seo.googleVerification);
  }

  // Do not overwrite active public vendor storefront titles if on a public storefront route
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  const isSpecificPublicStore = 
    pathname.startsWith('/store/') || 
    pathname.startsWith('/@') || 
    pathname.startsWith('/portfolio/') || 
    pathname.startsWith('/p/') || 
    pathname.startsWith('/card/');

  if (isSpecificPublicStore) {
    return;
  }

  if (seo.metaTitle) {
    document.title = seo.metaTitle;
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', seo.metaTitle);
  }

  if (seo.metaDescription) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', seo.metaDescription);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', seo.metaDescription);
  }

  if (seo.keywords) {
    let metaKw = document.querySelector('meta[name="keywords"]');
    if (!metaKw) {
      metaKw = document.createElement('meta');
      metaKw.setAttribute('name', 'keywords');
      document.head.appendChild(metaKw);
    }
    metaKw.setAttribute('content', seo.keywords);
  }
}

/**
 * 3. Landing CMS: Hero & Brands (platform_settings/landing_cms)
 */
export async function adminGetLandingHero(): Promise<PlatformLandingHeroConfig> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'landing_cms'));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.hero) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('storelly_landing_hero_config', JSON.stringify(data.hero));
        }
        return data.hero as PlatformLandingHeroConfig;
      }
    }
  } catch (err) {
    console.warn('Error fetching landing hero from Firestore:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('storelly_landing_hero_config');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return DEFAULT_LANDING_HERO;
}

export async function adminSaveLandingHero(hero: PlatformLandingHeroConfig): Promise<void> {
  const existingSnap = await getDoc(doc(db, 'platform_settings', 'landing_cms')).catch(() => null);
  const existingData = existingSnap && existingSnap.exists() ? existingSnap.data() : {};

  const payload = {
    ...existingData,
    hero: {
      ...hero,
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'platform_settings', 'landing_cms'), payload, { merge: true });

  if (typeof window !== 'undefined') {
    localStorage.setItem('storelly_landing_hero_config', JSON.stringify(hero));
    window.dispatchEvent(new CustomEvent('storelly_hero_changed', { detail: hero }));
  }
}

export async function adminGetBrands(): Promise<PlatformLandingBrandItem[]> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'landing_cms'));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (Array.isArray(data.brands) && data.brands.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('storelly_admin_brands', JSON.stringify(data.brands));
        }
        return data.brands as PlatformLandingBrandItem[];
      }
    }
  } catch (err) {
    console.warn('Error fetching brands from Firestore:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('storelly_admin_brands');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return DEFAULT_LANDING_BRANDS;
}

export async function adminSaveBrands(brands: PlatformLandingBrandItem[]): Promise<void> {
  const existingSnap = await getDoc(doc(db, 'platform_settings', 'landing_cms')).catch(() => null);
  const existingData = existingSnap && existingSnap.exists() ? existingSnap.data() : {};

  const payload = {
    ...existingData,
    brands,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'platform_settings', 'landing_cms'), payload, { merge: true });

  if (typeof window !== 'undefined') {
    localStorage.setItem('storelly_admin_brands', JSON.stringify(brands));
    window.dispatchEvent(new CustomEvent('storelly_brands_changed', { detail: brands }));
  }
}

/**
 * 4. Custom Domains (platform_settings/custom_domains)
 */
export async function adminGetCustomDomains(): Promise<PlatformCustomDomainMapping[]> {
  try {
    const snap = await getDoc(doc(db, 'platform_settings', 'custom_domains'));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (Array.isArray(data.domains)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('storelly_admin_custom_domains', JSON.stringify(data.domains));
        }
        return data.domains as PlatformCustomDomainMapping[];
      }
    }
  } catch (err) {
    console.warn('Error fetching custom domains from Firestore:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('storelly_admin_custom_domains');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return [];
}

export async function adminSaveCustomDomains(domains: PlatformCustomDomainMapping[]): Promise<void> {
  const payload: PlatformCustomDomainsConfig = {
    domains,
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, 'platform_settings', 'custom_domains'), payload);

  if (typeof window !== 'undefined') {
    localStorage.setItem('storelly_admin_custom_domains', JSON.stringify(domains));
    window.dispatchEvent(new CustomEvent('storelly_domains_changed', { detail: domains }));
  }
}

