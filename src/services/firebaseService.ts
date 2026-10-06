import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { firestoreSyncManager } from './firestoreSyncService';
import { deleteImageFromStorage, uploadToCloudinary } from './cloudinary';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import {
  BusinessProfile,
  Category,
  CatalogItem,
    Order,
  Booking,
  Customer,
  Review,
  Notification,
  Offer,
  AnalyticsSummary,
  OrderStatus,
  BookingStatus,
  PortfolioItem,
  Testimonial,
  PortfolioSettings,
  EventItem,
  EventTicket,
  CustomQuoteRequest,
  EventStatus,
  EventFormat,
  QuoteRequestStatus,
  AffiliateProductItem,
  CreatorAnalyticsSummary,
  CanonicalAnalyticsEventType,
} from '../types';

/**
 * Sanitize object for Firestore: recursively remove all keys with `undefined` values
 * to prevent Firestore "Function setDoc() called with invalid data. Unsupported field value: undefined" errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

/**
 * Generate URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CANONICAL_APP_DOMAIN =
  (typeof window !== 'undefined' && window.location?.origin) ||
  (typeof process !== 'undefined' && process.env?.APP_BASE_URL) ||
  'http://localhost:3000';

/**
 * Get dynamic, accurate storefront URL for any environment
 */
export function getStorefrontUrl(businessOrSlug: any): string {
  const slug = typeof businessOrSlug === 'object' && businessOrSlug !== null ? businessOrSlug.slug : (businessOrSlug || '');
  return getDigitalStoreUrl(slug);
}

export const CANONICAL_PRODUCTION_URL = 'https://storelly.app';

/**
 * Resolves the authoritative base URL for public links, QR codes, and sharing.
 * Always resolves to window.location.origin in the browser so that links, new tabs, and QR codes
 * immediately load on the current deployment host without ERR_NAME_NOT_RESOLVED DNS errors.
 */
export function getBaseUrl(_allowLocalDev = true): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (typeof process !== 'undefined' && process.env?.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }
  return CANONICAL_PRODUCTION_URL;
}

export function getBioLinkUrl(businessOrSlug: any): string {
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null) {
    if (businessOrSlug.customDomain) {
      return `https://${businessOrSlug.customDomain}`;
    }
    return `${getBaseUrl()}/@${encodeURIComponent(businessOrSlug.slug || '')}`;
  }
  return `${getBaseUrl()}/@${encodeURIComponent(businessOrSlug || '')}`;
}

export function getPortfolioUrl(businessOrSlug: any): string {
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null) {
    if (businessOrSlug.customDomain) {
      return `https://${businessOrSlug.customDomain}`;
    }
    return `${getBaseUrl()}/portfolio/${encodeURIComponent(businessOrSlug.slug || '')}`;
  }
  return `${getBaseUrl()}/portfolio/${encodeURIComponent(businessOrSlug || '')}`;
}

export function getDigitalStoreUrl(businessOrSlug: any): string {
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null) {
    if (businessOrSlug.customDomain) {
      return `https://${businessOrSlug.customDomain}`;
    }
    return `${getBaseUrl()}/store/${encodeURIComponent(businessOrSlug.slug || '')}`;
  }
  return `${getBaseUrl()}/store/${encodeURIComponent(businessOrSlug || '')}`;
}

export function getQuotePayUrl(businessId: string, requestId: string): string {
  return `${getBaseUrl()}/quote-pay/${encodeURIComponent(businessId)}/${encodeURIComponent(requestId)}`;
}

export function getProductDeepUrl(businessOrSlug: any, itemId: string): string {
  const storeUrl = getStorefrontUrl(businessOrSlug);
  const separator = storeUrl.includes('?') ? '&' : '?';
  return `${storeUrl}${separator}item=${encodeURIComponent(itemId)}`;
}

export function getCategoryDeepUrl(businessOrSlug: any, categoryIdOrSlug: string): string {
  const storeUrl = getStorefrontUrl(businessOrSlug);
  const separator = storeUrl.includes('?') ? '&' : '?';
  return `${storeUrl}${separator}category=${encodeURIComponent(categoryIdOrSlug)}`;
}

export function getModuleDeepUrl(
  businessOrSlug: any,
  moduleType:
    | 'catalog'
    | 'digital'
    | 'services'
    | 'portfolio'
    | 'events'
    | 'quotes'
    | 'reviews'
    | 'consultations'
    | 'bookings'
    | 'card'
    | 'biolink'
): string {
  const handle =
    typeof businessOrSlug === 'object' && businessOrSlug !== null
      ? (businessOrSlug.username || businessOrSlug.slug || businessOrSlug.id || '')
      : (businessOrSlug || '');

  if (moduleType === 'biolink') {
    return `${getBaseUrl()}/@${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'portfolio') {
    return `${getBaseUrl()}/portfolio/${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'consultations' || moduleType === 'bookings') {
    return `${getBaseUrl()}/consult/${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'events') {
    return `${getBaseUrl()}/events/${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'quotes') {
    return `${getBaseUrl()}/quote/${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'reviews') {
    return `${getBaseUrl()}/reviews/${encodeURIComponent(handle)}`;
  }
  if (moduleType === 'card') {
    return `${getBaseUrl()}/card/${encodeURIComponent(handle)}`;
  }
  return `${getBaseUrl()}/store/${encodeURIComponent(handle)}`;
}

export function getTrustCardUrl(businessOrSlug: any): string {
  const slug = typeof businessOrSlug === 'object' && businessOrSlug !== null ? businessOrSlug.slug : (businessOrSlug || '');
  return `${getBaseUrl()}/card/${encodeURIComponent(slug)}`;
}

// Local Storage Business Cache Helpers
const LOCAL_BIZ_KEY = 'storelly_cached_businesses';

function getLocalBusinesses(): BusinessProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_BIZ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBusiness(biz: BusinessProfile) {
  try {
    const list = getLocalBusinesses().filter((b) => b.id !== biz.id);
    list.unshift(biz);
    localStorage.setItem(LOCAL_BIZ_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local storage write warning:', e);
  }
}

function removeLocalBusiness(bizId: string) {
  try {
    const list = getLocalBusinesses().filter((b) => b.id !== bizId);
    localStorage.setItem(LOCAL_BIZ_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local storage delete warning:', e);
  }
}

const BLOCKED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'auth',
  'dashboard',
  'master-admin',
  'settings',
  'checkout',
  'cart',
  'support',
  'terms',
  'privacy',
  'static',
  'assets',
  'public',
  'store',
  'sitemap.xml'
]);

export async function isSlugBlocked(slug: string): Promise<boolean> {
  if (!slug) return true;
  const clean = slug.trim().toLowerCase();
  if (BLOCKED_SLUGS.has(clean)) return true;

  try {
    const docRef = doc(db, 'blocked_slugs', clean);
    const snap = await getDoc(docRef);
    if (snap.exists()) return true;
  } catch (e) {
    // ignore
  }
  return false;
}

export async function incrementShareCount(businessId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
      const current = data.shareCount || 0;
      await updateDoc(docRef, sanitizeForFirestore({ shareCount: current + 1, updatedAt: Date.now() }));
    }
  } catch (e) {
    console.warn('Share count increment note:', e);
  }
}

/**
 * Business CRUD & Queries
 */
export async function createBusiness(
  dataOrOwnerId: string | Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'>,
  maybeData?: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<BusinessProfile> {
  const data: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt'> =
    typeof dataOrOwnerId === 'string'
      ? { ...maybeData!, ownerId: dataOrOwnerId }
      : dataOrOwnerId;

  const businessDocRef = doc(collection(db, 'businesses'));
  const businessId = businessDocRef.id;
  const now = Date.now();
  const slug = data.slug || generateSlug(data.name);

  const business: BusinessProfile = {
    subscriptionStatus: 'trial',
    subscriptionPlan: 'trial',
    ...data,
    id: businessId,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  // Cache locally for UI persistence, but Firestore is the authority
  saveLocalBusiness(business);

  try {
    const sanitized = sanitizeForFirestore(business);
    await setDoc(businessDocRef, sanitized);
    return business;
  } catch (err: any) {
    console.warn('Direct Firestore client write note for createBusiness, attempting backend endpoint:', err);

    // Fallback: Authoritative backend endpoint with user's Firebase Auth token
    try {
      let token = '';
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
      const res = await fetch('/api/businesses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          business,
          ownerId: data.ownerId || auth.currentUser?.uid,
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.business) {
          saveLocalBusiness(payload.business);
          return payload.business;
        }
      }
    } catch (fallbackErr) {
      console.error('Backend business creation fallback failed:', fallbackErr);
    }

    throw err; // Rethrow to handle failure in UI if both failed
  }
}

export async function getBusinessById(businessId: string): Promise<BusinessProfile | null> {
  if (!businessId) return null;
  try {
    const docRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    } else {
      // Document does not exist in Firestore: clear from local cache
      removeLocalBusiness(businessId);
      return null;
    }
  } catch (err) {
    console.warn('Error fetching business by ID from Firestore:', err);
    return null;
  }
}

export async function forceSyncLocalToFirestore() {
  // Purge any local business records that do not exist in Firestore or are deleted.
  // Never restore missing or deleted businesses from localStorage.
  const localList = getLocalBusinesses();
  for (const lb of localList) {
    if (lb && lb.id) {
      try {
        const docRef = doc(db, 'businesses', lb.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists() || docSnap.data()?.status === 'deleted') {
          removeLocalBusiness(lb.id);
        }
      } catch (e) {
        console.warn('Sync cleanup note:', e);
      }
    }
  }
}

export async function getBusinessBySlug(rawSlug: string): Promise<BusinessProfile | null> {
  if (!rawSlug) return null;
  if (await isSlugBlocked(rawSlug)) {
    console.warn('Blocked slug access attempt:', rawSlug);
    return null;
  }

  const slug = rawSlug.trim();
  const lowerSlug = slug.toLowerCase();

  // 1. Try exact slug in Firestore (Authority)
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = { ...snap.docs[0].data(), id: snap.docs[0].id } as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore slug lookup (exact) warning:', err);
  }

  // 2. Try lowercase slug in Firestore if different
  if (slug !== lowerSlug) {
    try {
      const qLower = query(collection(db, 'businesses'), where('slug', '==', lowerSlug), limit(1));
      const snapLower = await getDocs(qLower);
      if (!snapLower.empty) {
        const data = { ...snapLower.docs[0].data(), id: snapLower.docs[0].id } as BusinessProfile;
        if (data.status === 'deleted') {
          removeLocalBusiness(data.id);
          return null;
        }
        saveLocalBusiness(data);
        return data;
      }
    } catch (err) {
      console.warn('Firestore slug lookup (lower) warning:', err);
    }
  }

  // 3. Try matching by username field (Creators often use handle as username)
  try {
    const qUser = query(collection(db, 'businesses'), where('username', '==', lowerSlug), limit(1));
    const snapUser = await getDocs(qUser);
    if (!snapUser.empty) {
      const data = { ...snapUser.docs[0].data(), id: snapUser.docs[0].id } as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore username lookup warning:', err);
  }

  // 4. Try fetching by ID directly (in case slug is business document ID)
  try {
    const docRef = doc(db, 'businesses', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { ...snap.data(), id: snap.id } as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore ID lookup warning:', err);
  }

  // Clean any stale local cache entry if present
  const localList = getLocalBusinesses();
  const stale = localList.find(
    (b) =>
      b.slug?.toLowerCase() === lowerSlug ||
      b.username?.toLowerCase() === lowerSlug ||
      b.id === slug
  );
  if (stale) {
    removeLocalBusiness(stale.id);
  }

  // Firestore is the ONLY authority for business existence.
  // Never restore missing or deleted businesses from localStorage/cache.
  return null;
}

export async function getUserBusinesses(ownerId: string, email?: string): Promise<BusinessProfile[]> {
  if (!ownerId && !email) return [];
  const foundMap = new Map<string, BusinessProfile>();

  // 1. Direct Firestore equality query on ownerId (UID)
  if (ownerId) {
    try {
      const q = query(
        collection(db, 'businesses'),
        where('ownerId', '==', ownerId)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        const data = { ...d.data(), id: d.id } as BusinessProfile;
        if (data.status !== 'deleted') {
          foundMap.set(data.id, data);
        }
      });
    } catch (err) {
      console.warn('Direct Firestore query for user businesses by ownerId failed:', err);
    }
  }

  // 2. Secondary resolution by email / ownerEmail if provided or from currentUser
  const userEmail = email || auth.currentUser?.email;
  if (userEmail && userEmail.trim()) {
    const cleanEmail = userEmail.trim();
    const lowerEmail = cleanEmail.toLowerCase();

    // Query by 'email'
    try {
      const qEmail = query(
        collection(db, 'businesses'),
        where('email', '==', cleanEmail)
      );
      const snapEmail = await getDocs(qEmail);
      snapEmail.docs.forEach((d) => {
        const data = { ...d.data(), id: d.id } as BusinessProfile;
        if (data.status !== 'deleted') {
          foundMap.set(data.id, data);
        }
      });
    } catch (e) {
      // Non-blocking
    }

    if (cleanEmail !== lowerEmail) {
      try {
        const qEmailLower = query(
          collection(db, 'businesses'),
          where('email', '==', lowerEmail)
        );
        const snapEmailLower = await getDocs(qEmailLower);
        snapEmailLower.docs.forEach((d) => {
          const data = { ...d.data(), id: d.id } as BusinessProfile;
          if (data.status !== 'deleted') {
            foundMap.set(data.id, data);
          }
        });
      } catch (e) {
        // Non-blocking
      }
    }

    // Query by 'ownerEmail'
    try {
      const qOwnerEmail = query(
        collection(db, 'businesses'),
        where('ownerEmail', '==', cleanEmail)
      );
      const snapOwnerEmail = await getDocs(qOwnerEmail);
      snapOwnerEmail.docs.forEach((d) => {
        const data = { ...d.data(), id: d.id } as BusinessProfile;
        if (data.status !== 'deleted') {
          foundMap.set(data.id, data);
        }
      });
    } catch (e) {
      // Non-blocking
    }

    // Query by 'ownerId == email' (legacy compatibility)
    try {
      const qOwnerAsEmail = query(
        collection(db, 'businesses'),
        where('ownerId', '==', cleanEmail)
      );
      const snapOwnerAsEmail = await getDocs(qOwnerAsEmail);
      snapOwnerAsEmail.docs.forEach((d) => {
        const data = { ...d.data(), id: d.id } as BusinessProfile;
        if (data.status !== 'deleted') {
          foundMap.set(data.id, data);
        }
      });
    } catch (e) {
      // Non-blocking
    }
  }

  const businesses = Array.from(foundMap.values()).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  if (businesses.length > 0) {
    const localList = getLocalBusinesses();
    const updatedLocal = localList
      .filter((b) => b.ownerId !== ownerId && (!userEmail || (b.email !== userEmail && b.ownerEmail !== userEmail)))
      .concat(businesses);
    localStorage.setItem(LOCAL_BIZ_KEY, JSON.stringify(updatedLocal));
    return businesses;
  }

  // 3. Fallback to locally cached businesses for this user UID or email
  const localList = getLocalBusinesses();
  const userBizs = localList.filter(
    (b) =>
      (b.ownerId === ownerId ||
        (userEmail && (b.email === userEmail || b.ownerEmail === userEmail || b.ownerId === userEmail))) &&
      b.status !== 'deleted'
  );
  if (userBizs.length > 0) {
    return userBizs;
  }

  return [];
}

export async function updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<void> {
  const finishSync = firestoreSyncManager.startOperation();
  const updatedData = {
    ...data,
    updatedAt: Date.now(),
  };

  try {
    const docRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(docRef);
    if (!snap.exists() || snap.data()?.status === 'deleted') {
      removeLocalBusiness(businessId);
      throw new Error(`Business ${businessId} does not exist in Firestore or has been deleted.`);
    }

    const sanitized = sanitizeForFirestore(updatedData);
    await updateDoc(docRef, sanitized);

    // Update local cache only for existing business
    const localList = getLocalBusinesses();
    const existing = localList.find((b) => b.id === businessId);
    if (existing) {
      saveLocalBusiness({ ...existing, ...updatedData });
    }
  } catch (err) {
    console.warn('Firestore updateBusiness error:', err);
    throw err;
  } finally {
    finishSync();
  }
}

export const updateBusinessProfile = updateBusiness;

export async function deleteBusiness(businessId: string): Promise<void> {
  // 1. Immediately clean up all local storage entries
  removeLocalBusiness(businessId);
  try {
    const active = localStorage.getItem('storelly_active_biz');
    if (active === businessId) {
      localStorage.removeItem('storelly_active_biz');
    }
    localStorage.removeItem(`storelly_biolinks_${businessId}`);
    localStorage.removeItem(`storelly_cart_${businessId}`);
    localStorage.removeItem(`storelly_fcm_notifications_${businessId}`);
    localStorage.removeItem(`storelly_razorpay_config_${businessId}`);
    localStorage.removeItem(`storelly_offline_catalog_${businessId}`);
    localStorage.removeItem(`storelly_offline_reviews_${businessId}`);
    localStorage.removeItem(`storelly_analytics_${businessId}`);
    const adminCached = localStorage.getItem('storelly_admin_all_biz');
    if (adminCached) {
      const parsed: BusinessProfile[] = JSON.parse(adminCached);
      const filtered = parsed.filter((b) => b.id !== businessId);
      localStorage.setItem('storelly_admin_all_biz', JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn('LocalStorage cleanup warning:', e);
  }

  try {
    const docRef = doc(db, 'businesses', businessId);
    
    // 2. Soft-delete tombstone with unique slug so it will never conflict or resurrect
    try {
      await setDoc(docRef, { 
        status: 'deleted', 
        slug: `deleted_${businessId}_${Date.now()}`,
        deletedAt: Date.now() 
      }, { merge: true });
    } catch (softErr) {
      console.warn('Soft-delete tombstone note:', softErr);
    }
    
    // 3. Hard delete main document from Firestore
    try {
      await deleteDoc(docRef);
    } catch (hardErr) {
      console.warn('Hard delete document warning:', hardErr);
    }

    // 4. Clean all Firestore subcollections
    const subcollections = [
      'catalog',
      'categories',
      'orders',
      'bookings',
      'customers',
      'offers',
      'portfolio',
      'testimonials',
      'events',
      'tickets',
      'quote_requests',
      'digital_products',
      'reviews',
      'analyticsEvents',
      'communityLinks'
    ];

    for (const sub of subcollections) {
      try {
        const subSnap = await getDocs(collection(db, 'businesses', businessId, sub));
        const deletePromises = subSnap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (subErr) {
        // Continue cleaning remaining subcollections
      }
    }

    // 5. Clean any top-level collections referencing this business
    const rootCols = [
      'catalogItems',
      'biolinks',
      'communityLinks',
      'orders',
      'bookings',
      'customers',
      'events',
      'tickets',
      'portfolio',
      'testimonials',
      'quote_requests'
    ];

    for (const colName of rootCols) {
      try {
        const q = query(collection(db, colName), where('businessId', '==', businessId));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (rootErr) {
        // ignore
      }
    }

    console.log(`[Permanent Deletion] Successfully deleted business ${businessId} and associated records.`);
  } catch (err) {
    console.warn('Firestore deleteBusiness warning:', err);
  }
}

/**
 * Categories CRUD
 */
export async function getCategories(businessId: string): Promise<Category[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'categories');
    const snap = await getDocs(colRef);
    const list = snap.docs.map((d) => d.data() as Category);
    return list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (err) {
    console.error('Error getting categories:', err);
    return [];
  }
}

export async function createCategory(businessId: string, data: Omit<Category, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const catDocRef = doc(collection(db, 'businesses', businessId, 'categories'));
  const catId = catDocRef.id;
  const now = Date.now();
  const category: Category = {
    ...data,
    id: catId,
    businessId,
    ownerId: auth.currentUser?.uid || undefined,
    slug: data.slug || generateSlug(data.name),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const sanitized = sanitizeForFirestore(category);
    await setDoc(catDocRef, sanitized);
  } catch (err) {
    console.error('Firestore createCategory error:', err);
    throw err;
  }
  return category;
}

export async function updateCategory(businessId: string, catId: string, data: Partial<Category>): Promise<void> {
  try {
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: Date.now(),
    });
    const docRef = doc(db, 'businesses', businessId, 'categories', catId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.error('Firestore updateCategory error:', err);
    throw err;
  }
}

export async function deleteCategory(businessId: string, catId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'categories', catId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Firestore deleteCategory error:', err);
    throw err;
  }
}

export async function reorderCategories(businessId: string, orderedCategoryIds: string[]): Promise<void> {
  try {
    const updatePromises = orderedCategoryIds.map((id, index) => {
      const docRef = doc(db, 'businesses', businessId, 'categories', id);
      return updateDoc(docRef, { sortOrder: index, updatedAt: Date.now() }).catch(async () => {
        return setDoc(docRef, { sortOrder: index, updatedAt: Date.now() }, { merge: true });
      });
    });
    await Promise.all(updatePromises);
  } catch (err) {
    console.error('Firestore reorderCategories error:', err);
    throw err;
  }
}

/**
 * Catalog Items CRUD (Products, Services, Rooms, Vehicles, Menu Items, etc.)
 */
export async function getCatalogItems(businessId: string, activeOnly = false): Promise<CatalogItem[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'catalog');
    const snap = await getDocs(colRef);
    let list = snap.docs.map((d) => d.data() as CatalogItem);
    
    // Fallback if collection path query returned empty, try querying by businessId field
    if (list.length === 0) {
      try {
        const q = query(collection(db, 'catalog'), where('businessId', '==', businessId));
        const fallbackSnap = await getDocs(q);
        list = fallbackSnap.docs.map((d) => d.data() as CatalogItem);
      } catch (e) {
        // ignore fallback error
      }
    }

    if (activeOnly) {
      list = list.filter((item) => item.isActive !== false);
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Error getting catalog items:', err);
    return [];
  }
}

export async function getCatalogItemById(businessId: string, itemId: string): Promise<CatalogItem | null> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CatalogItem;
    }
  } catch (err) {
    console.error('Error getting catalog item by id:', err);
  }
  return null;
}

export async function createCatalogItem(
  businessId: string,
  data: Omit<CatalogItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
): Promise<CatalogItem> {
  const itemDocRef = doc(collection(db, 'businesses', businessId, 'catalog'));
  const itemId = itemDocRef.id;
  const now = Date.now();
  const item: CatalogItem = {
    ...data,
    id: itemId,
    businessId,
    ownerId: auth.currentUser?.uid || undefined,
    slug: data.slug || generateSlug(data.name),
    createdAt: now,
    updatedAt: now,
  };

  const finishSync = firestoreSyncManager.startOperation();
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(itemDocRef, sanitized);
  } catch (err) {
    console.error('Firestore createCatalogItem error:', err);
    throw err;
  } finally {
    finishSync();
  }
  return item;
}

export async function updateCatalogItem(businessId: string, itemId: string, data: Partial<CatalogItem>): Promise<void> {
  const finishSync = firestoreSyncManager.startOperation();
  try {
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: Date.now(),
    });
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.error('Firestore updateCatalogItem error:', err);
    throw err;
  } finally {
    finishSync();
  }
}

export async function deleteCatalogItem(businessId: string, itemId: string): Promise<void> {
  const finishSync = firestoreSyncManager.startOperation();
  try {
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Firestore deleteCatalogItem error:', err);
    throw err;
  } finally {
    finishSync();
  }
}

export async function duplicateCatalogItem(businessId: string, originalItem: CatalogItem): Promise<CatalogItem> {
  const { id, createdAt, updatedAt, ...rest } = originalItem;
  return createCatalogItem(businessId, {
    ...rest,
    name: rest.name,
    slug: generateSlug(`${rest.name}-${Date.now().toString().slice(-4)}`),
  });
}

/**
 * Orders Management
 */
export async function createPublicOrder(
  businessId: string,
  data: Omit<Order, 'id' | 'businessId' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  // First attempt authoritative server endpoint (ideal for Instagram bio / in-app browsers)
  try {
    const res = await fetch('/api/orders/create-public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, orderData: data }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.order) {
        return result.order as Order;
      }
    }
  } catch (apiErr) {
    console.warn('[Public Order] Server endpoint unreachable, falling back to direct client write:', apiErr);
  }

  // Fallback to client-side Firestore execution
  const orderDocRef = doc(collection(db, 'businesses', businessId, 'orders'));
  const orderId = orderDocRef.id;
  const orderNumber = 'ORD-' + orderId.slice(-6).toUpperCase();
  const now = Date.now();

  const order: Order = {
    ...data,
    id: orderId,
    businessId,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  };

  try {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Phase 1: Execute ALL reads first
        const itemSnapshots: { itemRef: ReturnType<typeof doc>; itemSnap: any; item: typeof order.items[0] }[] = [];
        for (const item of order.items) {
          const itemRef = doc(db, 'businesses', businessId, 'catalog', item.itemId);
          const itemSnap = await transaction.get(itemRef);
          itemSnapshots.push({ itemRef, itemSnap, item });
        }

        // 2. Phase 2: Execute ALL writes after every read has completed
        const sanitized = sanitizeForFirestore(order);
        transaction.set(orderDocRef, sanitized);

        for (const { itemRef, itemSnap, item } of itemSnapshots) {
          if (itemSnap.exists()) {
            const itemData = itemSnap.data() as CatalogItem;
            // Only decrement if it's actually tracking stock (not null/undefined)
            if (typeof itemData.stockQuantity === 'number') {
              const currentStock = itemData.stockQuantity;
              const newQty = currentStock - item.quantity;
              
              // Prevent negative stock - floor at 0
              const safeQty = Math.max(0, newQty);
              
              transaction.update(itemRef, {
                stockQuantity: safeQty,
                inStock: safeQty > 0,
                updatedAt: Date.now(),
              });
            }
          }
        }
      });
    } catch (txErr) {
      console.warn('Transaction failed, falling back to direct order setDoc:', txErr);
      const sanitized = sanitizeForFirestore(order);
      await setDoc(orderDocRef, sanitized);
    }

    // Automatically update or create customer record (non-blocking)
    try {
      await upsertCustomerFromOrder(businessId, order);
    } catch (custErr) {
      console.warn('Customer upsert non-blocking notice:', custErr);
    }

    // Create notification (non-blocking)
    try {
      await createNotification(businessId, {
        type: 'order',
        title: 'New Order Received',
        message: `You have a new ${order.orderType} order from ${order.customerName} for ${order.total}.`,
        link: '/dashboard/orders',
        entityType: 'order',
        entityId: order.id,
        idempotencyKey: `order_${order.id}`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber }
      });
    } catch (notifErr) {
      console.warn('Notification create non-blocking notice:', notifErr);
    }
  } catch (err) {
    console.error('Firestore createOrder error:', err);
    throw err; 
  }

  return order;
}

export const createOrder = createPublicOrder;

export async function getOrders(businessId: string, status?: OrderStatus): Promise<Order[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'orders');
    let snap;
    if (status) {
      const q = query(
        colRef, 
        where('businessId', '==', businessId),
        where('status', '==', status)
      );
      snap = await getDocs(q);
    } else {
      const q = query(colRef, where('businessId', '==', businessId));
      snap = await getDocs(q);
    }
    const list = snap.docs.map((d) => d.data() as Order);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Error getting orders:', err);
    return [];
  }
}

export async function getOrder(businessId: string, orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Order;
    }
    return null;
  } catch (err) {
    console.warn(`Could not get order ${orderId}:`, err);
    return null;
  }
}

export function subscribeToOrders(businessId: string, callback: (orders: Order[]) => void): () => void {
  if (!businessId || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const colRef = collection(db, 'businesses', businessId, 'orders');
    const q = query(colRef, where('businessId', '==', businessId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as Order);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore orders subscription notice:', err?.message || err);
      callback([]);
    });
    
    return unsubscribe;
  } catch (e) {
    console.warn('Could not initialize orders subscription:', e);
    return () => {};
  }
}

export async function updateOrderStatus(businessId: string, orderId: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      const order = snap.data() as Order;
      const oldStatus = order.status;

      // If status is changed TO cancelled and it WAS NOT already cancelled, restore stock
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        for (const item of order.items) {
          try {
            const itemRef = doc(db, 'businesses', businessId, 'catalog', item.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
              const itemData = itemSnap.data() as CatalogItem;
              if (typeof itemData.stockQuantity === 'number') {
                const newQty = itemData.stockQuantity + item.quantity;
                await updateDoc(itemRef, {
                  stockQuantity: newQty,
                  inStock: newQty > 0,
                  updatedAt: Date.now(),
                });
              }
            }
          } catch (e) {
            console.warn('Inventory restoration note:', e);
          }
        }
      } 
      // If status is changed FROM cancelled TO something else, re-decrement stock
      else if (oldStatus === 'cancelled' && status !== 'cancelled') {
        for (const item of order.items) {
          try {
            const itemRef = doc(db, 'businesses', businessId, 'catalog', item.itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
              const itemData = itemSnap.data() as CatalogItem;
              if (typeof itemData.stockQuantity === 'number') {
                const newQty = Math.max(0, itemData.stockQuantity - item.quantity);
                await updateDoc(itemRef, {
                  stockQuantity: newQty,
                  inStock: newQty > 0,
                  updatedAt: Date.now(),
                });
              }
            }
          } catch (e) {
            console.warn('Inventory re-decrement note:', e);
          }
        }
      }
    }

    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Firestore updateOrderStatus error:', err);
    throw err;
  }
}

export async function updateOrder(
  businessId: string,
  orderId: string,
  data: Partial<Order>
): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Firestore updateOrder error:', err);
    throw err;
  }
}

export async function deleteOrder(businessId: string, orderId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Firestore deleteOrder error:', err);
    throw err;
  }
}

/**
 * Bookings Management
 */
export async function createBooking(
  businessId: string,
  data: Omit<Booking, 'id' | 'businessId' | 'bookingNumber' | 'createdAt' | 'updatedAt'>
): Promise<Booking> {
  const bookingDocRef = doc(collection(db, 'businesses', businessId, 'bookings'));
  const bookingId = bookingDocRef.id;
  const bookingNumber = 'BK-' + bookingId.slice(-6).toUpperCase();
  const now = Date.now();

  const booking: Booking = {
    ...data,
    id: bookingId,
    businessId,
    bookingNumber,
    createdAt: now,
    updatedAt: now,
  };

  const slotKey = (data.itemId && data.bookingDate && data.bookingTimeSlot)
    ? `${data.itemId}_${data.bookingDate}_${data.bookingTimeSlot.replace(/[^a-zA-Z0-9]/g, '_')}`
    : null;

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Phase 1: Reads first - Deterministic atomic slot lock
      let slotRef: ReturnType<typeof doc> | null = null;
      if (slotKey) {
        slotRef = doc(db, 'businesses', businessId, 'slot_reservations', slotKey);
        const slotSnap = await transaction.get(slotRef);
        if (slotSnap.exists()) {
          const slotData = slotSnap.data();
          if (slotData && (slotData.status === 'pending' || slotData.status === 'confirmed' || slotData.status === 'active')) {
            throw new Error('This time slot is already booked. Please choose another time.');
          }
        }
      }

      // 2. Phase 2: Writes only after all reads
      if (slotRef && slotKey) {
        transaction.set(slotRef, sanitizeForFirestore({
          id: slotKey,
          bookingId,
          businessId,
          itemId: data.itemId,
          bookingDate: data.bookingDate,
          bookingTimeSlot: data.bookingTimeSlot,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        }));
      }

      const sanitized = sanitizeForFirestore(booking);
      transaction.set(bookingDocRef, sanitized);
    });

    // Create notification
    await createNotification(businessId, {
      type: 'booking',
      title: 'New Booking Request',
      message: `New ${data.bookingType.replace('_', ' ')} request from ${data.customerName} for ${data.itemName}.`,
      link: '/dashboard/bookings',
      entityType: 'booking',
      entityId: booking.id,
      idempotencyKey: `booking_${booking.id}`,
      metadata: { bookingId: booking.id, bookingNumber: booking.bookingNumber }
    });

    // Automatically update/create customer
    await upsertCustomerFromBooking(businessId, booking);
  } catch (err: any) {
    console.error('Firestore createBooking error:', err);
    throw err;
  }

  return booking;
}

export async function getBookings(businessId: string, status?: BookingStatus): Promise<Booking[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'bookings');
    let snap;
    if (status) {
      const q = query(colRef, where('status', '==', status));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(colRef);
    }
    const list = snap.docs.map((d) => d.data() as Booking);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Error getting bookings:', err);
    return [];
  }
}

export async function updateBookingStatus(businessId: string, bookingId: string, status: BookingStatus): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'bookings', bookingId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const bookingData = snap.data() as Booking;
      if (status === 'cancelled' && bookingData.itemId && bookingData.bookingDate && bookingData.bookingTimeSlot) {
        const slotKey = `${bookingData.itemId}_${bookingData.bookingDate}_${bookingData.bookingTimeSlot.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const slotRef = doc(db, 'businesses', businessId, 'slot_reservations', slotKey);
        await updateDoc(slotRef, { status: 'cancelled', updatedAt: Date.now() }).catch(() => {});
      }
    }

    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.error('Firestore updateBookingStatus error:', err);
    throw err;
  }
}

export function subscribeToBookings(businessId: string, callback: (bookings: Booking[]) => void): () => void {
  if (!businessId || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const colRef = collection(db, 'businesses', businessId, 'bookings');
    const q = query(colRef, where('businessId', '==', businessId));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data() as Booking);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    }, (err) => {
      console.warn('Firestore bookings subscription notice:', err?.message || err);
      callback([]);
    });
    
    return unsubscribe;
  } catch (e) {
    console.warn('Could not initialize bookings subscription:', e);
    return () => {};
  }
}

/**
 * Customers Aggregation & CRM
 */
export async function getCustomers(businessId: string): Promise<Customer[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'customers');
    const snap = await getDocs(colRef);
    const list = snap.docs.map((d) => d.data() as Customer);
    return list.sort((a, b) => (b.lastInteractionAt || 0) - (a.lastInteractionAt || 0));
  } catch (err) {
    console.error('Error getting customers:', err);
    return [];
  }
}

export async function upsertCustomerFromOrder(businessId: string, order: Order): Promise<void> {
  if (!order.customerPhone) return;
  const cleanPhone = order.customerPhone.replace(/\D/g, '');
  const custId = 'cust_' + cleanPhone;
  const docRef = doc(db, 'businesses', businessId, 'customers', custId);

  try {
    const snap = await getDoc(docRef);
    const now = Date.now();
    if (snap.exists()) {
      const existing = snap.data() as Customer;
      const updatePayload = sanitizeForFirestore({
        name: order.customerName || existing.name,
        whatsapp: order.customerWhatsApp || existing.whatsapp || order.customerPhone,
        email: order.customerEmail || existing.email,
        address: order.customerAddress || existing.address,
        totalOrders: (existing.totalOrders || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + order.total,
        lastInteractionAt: now,
      });
      await updateDoc(docRef, updatePayload);
    } else {
      const newCust: Customer = {
        id: custId,
        businessId,
        name: order.customerName,
        phone: order.customerPhone,
        whatsapp: order.customerWhatsApp || order.customerPhone,
        email: order.customerEmail,
        address: order.customerAddress,
        totalOrders: 1,
        totalBookings: 0,
        totalSpent: order.total,
        firstInteractionAt: now,
        lastInteractionAt: now,
      };
      await setDoc(docRef, sanitizeForFirestore(newCust));
    }
  } catch (e) {
    console.error('Customer upsert error:', e);
  }
}

export async function upsertCustomerFromBooking(businessId: string, booking: Booking): Promise<void> {
  if (!booking.customerPhone) return;
  const cleanPhone = booking.customerPhone.replace(/\D/g, '');
  const custId = 'cust_' + cleanPhone;
  const docRef = doc(db, 'businesses', businessId, 'customers', custId);

  try {
    const snap = await getDoc(docRef);
    const now = Date.now();
    if (snap.exists()) {
      const existing = snap.data() as Customer;
      const updatePayload = sanitizeForFirestore({
        name: booking.customerName || existing.name,
        email: booking.customerEmail || existing.email,
        totalBookings: (existing.totalBookings || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + (booking.totalAmount || 0),
        lastInteractionAt: now,
      });
      await updateDoc(docRef, updatePayload);
    } else {
      const newCust: Customer = {
        id: custId,
        businessId,
        name: booking.customerName,
        phone: booking.customerPhone,
        whatsapp: booking.customerPhone,
        email: booking.customerEmail,
        totalOrders: 0,
        totalBookings: 1,
        totalSpent: booking.totalAmount || 0,
        firstInteractionAt: now,
        lastInteractionAt: now,
      };
      await setDoc(docRef, sanitizeForFirestore(newCust));
    }
  } catch (e) {
    console.error('Customer booking upsert error:', e);
  }
}

export async function upsertCustomerFromEventTicket(businessId: string, ticket: EventTicket): Promise<void> {
  if (!ticket.customerPhone) return;
  const cleanPhone = ticket.customerPhone.replace(/\D/g, '');
  const custId = 'cust_' + cleanPhone;
  const docRef = doc(db, 'businesses', businessId, 'customers', custId);

  try {
    const snap = await getDoc(docRef);
    const now = Date.now();
    if (snap.exists()) {
      const existing = snap.data() as Customer;
      const modules = new Set(existing.sourceModules || []);
      modules.add('event');
      const updatePayload = sanitizeForFirestore({
        name: ticket.customerName || existing.name,
        email: ticket.customerEmail || existing.email,
        totalBookings: (existing.totalBookings || 0) + 1,
        totalSpent: (existing.totalSpent || 0) + (ticket.price || 0),
        sourceModule: 'event',
        sourceModules: Array.from(modules),
        lastInteractionAt: now,
      });
      await updateDoc(docRef, updatePayload);
    } else {
      const newCust: Customer = {
        id: custId,
        businessId,
        name: ticket.customerName,
        phone: ticket.customerPhone,
        whatsapp: ticket.customerPhone,
        email: ticket.customerEmail,
        totalOrders: 0,
        totalBookings: 1,
        totalSpent: ticket.price || 0,
        sourceModule: 'event',
        sourceModules: ['event'],
        firstInteractionAt: now,
        lastInteractionAt: now,
      };
      await setDoc(docRef, sanitizeForFirestore(newCust));
    }
  } catch (e) {
    console.warn('Customer event ticket upsert notice:', e);
  }
}

export async function upsertCustomerFromQuoteRequest(businessId: string, quote: CustomQuoteRequest): Promise<void> {
  if (!quote.customerPhone) return;
  const cleanPhone = quote.customerPhone.replace(/\D/g, '');
  const custId = 'cust_' + cleanPhone;
  const docRef = doc(db, 'businesses', businessId, 'customers', custId);

  try {
    const snap = await getDoc(docRef);
    const now = Date.now();
    if (snap.exists()) {
      const existing = snap.data() as Customer;
      const modules = new Set(existing.sourceModules || []);
      modules.add('quote');
      const updatePayload = sanitizeForFirestore({
        name: quote.customerName || existing.name,
        email: quote.customerEmail || existing.email,
        sourceModule: 'quote',
        sourceModules: Array.from(modules),
        lastInteractionAt: now,
      });
      await updateDoc(docRef, updatePayload);
    } else {
      const newCust: Customer = {
        id: custId,
        businessId,
        name: quote.customerName,
        phone: quote.customerPhone,
        whatsapp: quote.customerPhone,
        email: quote.customerEmail,
        totalOrders: 0,
        totalBookings: 0,
        totalSpent: 0,
        sourceModule: 'quote',
        sourceModules: ['quote'],
        firstInteractionAt: now,
        lastInteractionAt: now,
      };
      await setDoc(docRef, sanitizeForFirestore(newCust));
    }
  } catch (e) {
    console.warn('Customer quote request upsert notice:', e);
  }
}

export async function upsertCustomerFromReview(businessId: string, review: Review): Promise<void> {
  if (!review.customerPhone) return;
  const cleanPhone = review.customerPhone.replace(/\D/g, '');
  const custId = 'cust_' + cleanPhone;
  const docRef = doc(db, 'businesses', businessId, 'customers', custId);

  try {
    const snap = await getDoc(docRef);
    const now = Date.now();
    if (snap.exists()) {
      const existing = snap.data() as Customer;
      const modules = new Set(existing.sourceModules || []);
      modules.add('review');
      const updatePayload = sanitizeForFirestore({
        name: review.customerName || existing.name,
        sourceModule: 'review',
        sourceModules: Array.from(modules),
        lastInteractionAt: now,
      });
      await updateDoc(docRef, updatePayload);
    } else {
      const newCust: Customer = {
        id: custId,
        businessId,
        name: review.customerName,
        phone: review.customerPhone,
        whatsapp: review.customerPhone,
        totalOrders: 0,
        totalBookings: 0,
        totalSpent: 0,
        sourceModule: 'review',
        sourceModules: ['review'],
        firstInteractionAt: now,
        lastInteractionAt: now,
      };
      await setDoc(docRef, sanitizeForFirestore(newCust));
    }
  } catch (e) {
    console.warn('Customer review upsert notice:', e);
  }
}

/**
 * Reviews & Ratings
 */
export async function getReviews(businessId: string): Promise<Review[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'reviews');
    const q = query(colRef, where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Review);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Error getting reviews:', err);
    return [];
  }
}

export async function createReview(
  businessId: string,
  data: Omit<Review, 'id' | 'businessId' | 'createdAt'>
): Promise<Review> {
  const reviewDocRef = doc(collection(db, 'businesses', businessId, 'reviews'));
  const reviewId = reviewDocRef.id;
  const review: Review = {
    ...data,
    id: reviewId,
    businessId,
    createdAt: Date.now(),
  };

  await setDoc(reviewDocRef, sanitizeForFirestore(review));

  // Upsert customer CRM record
  await upsertCustomerFromReview(businessId, review);

  // Create notification
  await createNotification(businessId, {
    type: 'review',
    title: 'New Review Received',
    message: `${data.customerName} gave a ${data.rating}-star review.`,
    link: '/dashboard/reviews',
    entityType: 'review',
    entityId: reviewId,
    idempotencyKey: `review_${reviewId}`,
    metadata: { reviewId: reviewId }
  });

  return review;
}

export async function replyToReview(businessId: string, reviewId: string, reply: string): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await updateDoc(docRef, sanitizeForFirestore({
    reply,
    replyAt: Date.now(),
  }));
}

export async function updateReviewStatus(businessId: string, reviewId: string, status: 'published' | 'hidden' | 'pending'): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await updateDoc(docRef, sanitizeForFirestore({
    status,
    updatedAt: Date.now(),
  }));
}

export async function deleteReview(businessId: string, reviewId: string): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await deleteDoc(docRef);
}

/**
 * Notifications
 */
export async function createNotification(
  businessId: string,
  data: Omit<Notification, 'id' | 'businessId' | 'createdAt' | 'read'> & {
    idempotencyKey?: string;
  }
): Promise<Notification | null> {
  if (!businessId) return null;
  try {
    // 1. Fetch business doc to determine profileType, ownerId, and module eligibility
    const bizRef = doc(db, 'businesses', businessId);
    const bizSnap = await getDoc(bizRef);
    if (!bizSnap.exists()) {
      console.warn('Cannot create notification: Business profile not found:', businessId);
      return null;
    }
    const biz = bizSnap.data() as BusinessProfile;
    const isCreator = biz.profileType === 'creator' || biz.storeType === 'creator' || biz.type === 'digital_creator';
    const profileType: 'creator' | 'vendor' = isCreator ? 'creator' : 'vendor';
    const ownerId = biz.ownerId;
    const modules = biz.modules || {};

    // 2. Module-aware gating: strictly prevent creating notifications for disabled modules
    if (data.type === 'order' || data.type === 'digital_product') {
      if (isCreator && !modules.digital_products && !modules.digitalProducts && !modules.cart_ordering) {
        return null;
      }
      if (!isCreator && !modules.products && !modules.menu && !modules.cart_ordering && !modules.table_delivery && !modules.digital_products) {
        return null;
      }
    } else if (data.type === 'booking' || data.type === 'consultation') {
      if (!modules.booking_appointments && !modules.stay_booking && !modules.rental_booking) {
        return null;
      }
    } else if (data.type === 'quote') {
      if (!modules.custom_quotes) return null;
    } else if (data.type === 'event') {
      if (!modules.events_tickets && !modules.events_ticketing) return null;
    } else if (data.type === 'review') {
      if (!modules.reviews) return null;
    }

    // 3. Delegate notification creation to trusted server API
    try {
      const resp = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          ...data,
        }),
      });
      if (resp.ok) {
        return {
          ...data,
          id: data.idempotencyKey || `notif_${Date.now()}`,
          businessId,
          ownerId: ownerId || undefined,
          profileType,
          read: false,
          createdAt: Date.now(),
        } as Notification;
      }
    } catch (apiErr) {
      console.warn('[Notification] Server notification endpoint unreachable, checking client auth:', apiErr);
    }

    // 4. Authenticated Owner fallback write
    if (auth?.currentUser && auth.currentUser.uid === ownerId) {
      const notifDocId = data.idempotencyKey || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const docRef = doc(db, 'businesses', businessId, 'notifications', notifDocId);
      const notification: Notification = {
        ...data,
        id: notifDocId,
        businessId,
        ownerId: ownerId || undefined,
        profileType,
        read: false,
        createdAt: Date.now(),
      };
      await setDoc(docRef, sanitizeForFirestore(notification));
      return notification;
    }

    return null;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

export function subscribeToNotifications(
  businessId: string,
  callback: (notifications: Notification[]) => void,
  profileType?: 'vendor' | 'creator'
): () => void {
  if (!businessId || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const colRef = collection(db, 'businesses', businessId, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snap) => {
        const currentUserId = auth?.currentUser?.uid;
        let list = snap.docs.map((d) => d.data() as Notification);

        // Strict tenant + profile + owner isolation
        list = list.filter((n) => {
          if (n.businessId !== businessId) return false;
          if (n.ownerId && currentUserId && n.ownerId !== currentUserId) return false;
          if (profileType && n.profileType && n.profileType !== profileType) return false;
          return true;
        });

        callback(list);
      },
      (err) => {
        console.warn('Firestore notifications subscription notice:', err?.message || err);
        callback([]);
      }
    );
  } catch (e) {
    console.warn('Could not initialize notifications subscription:', e);
    return () => {};
  }
}

export async function markNotificationAsRead(businessId: string, notificationId: string): Promise<void> {
  if (!businessId || !notificationId || !auth?.currentUser) return;
  const docRef = doc(db, 'businesses', businessId, 'notifications', notificationId);
  await updateDoc(docRef, { read: true, updatedAt: Date.now() });
}

export async function markAllNotificationsAsRead(businessId: string): Promise<void> {
  if (!businessId || !auth?.currentUser) return;
  try {
    const colRef = collection(db, 'businesses', businessId, 'notifications');
    const q = query(colRef, where('read', '==', false));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true, updatedAt: Date.now() });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all as read:', err);
  }
}

export async function deleteNotification(businessId: string, notificationId: string): Promise<void> {
  if (!businessId || !notificationId || !auth?.currentUser) return;
  const docRef = doc(db, 'businesses', businessId, 'notifications', notificationId);
  await deleteDoc(docRef);
}

/**
 * Offers & Coupons
 */
export async function getOffers(businessId: string): Promise<Offer[]> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'offers');
    const q = query(colRef, where('businessId', '==', businessId));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Offer);
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.error('Error getting offers:', err);
    return [];
  }
}

export async function createOffer(
  businessId: string,
  data: Omit<Offer, 'id' | 'businessId' | 'createdAt'>
): Promise<Offer> {
  const offerDocRef = doc(collection(db, 'businesses', businessId, 'offers'));
  const offerId = offerDocRef.id;
  const offer: Offer = {
    ...data,
    id: offerId,
    businessId,
    createdAt: Date.now(),
  };

  await setDoc(offerDocRef, sanitizeForFirestore(offer));
  return offer;
}

export async function updateOffer(businessId: string, offerId: string, data: Partial<Offer>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'offers', offerId);
  await updateDoc(docRef, sanitizeForFirestore(data));
}

export async function deleteOffer(businessId: string, offerId: string): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'offers', offerId);
  await deleteDoc(docRef);
}

/**
 * Analytics Events & Dashboard Metrics
 */
export async function recordAnalyticsEvent(
  businessId: string,
  eventType: CanonicalAnalyticsEventType | string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const eventDocRef = doc(collection(db, 'businesses', businessId, 'analyticsEvents'));
    const eventId = eventDocRef.id;
    await setDoc(eventDocRef, sanitizeForFirestore({
      id: eventId,
      businessId,
      eventType,
      metadata: metadata || {},
      timestamp: Date.now(),
    }));
  } catch (e) {
    // Non-blocking telemetry
  }
}

export async function getAnalyticsSummary(businessId: string): Promise<AnalyticsSummary> {
  try {
    const [orders, bookings, customers, items, eventsSnap] = await Promise.all([
      getOrders(businessId),
      getBookings(businessId),
      getCustomers(businessId),
      getCatalogItems(businessId),
      getDocs(collection(db, 'businesses', businessId, 'analyticsEvents')).catch(() => ({ docs: [] } as any)),
    ]);

    const completedOrders = orders.filter((o) => 
      o.status !== 'cancelled' && 
      o.paymentStatus !== 'refunded' && 
      (o.paymentStatus === 'paid' || o.status === 'delivered' || o.status === 'confirmed')
    );
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const events = eventsSnap.docs.map((d: any) => d.data());
    const storeViews = events.filter((e: any) => e.eventType === 'store_view').length;
    const whatsappClicks = events.filter((e: any) => e.eventType === 'whatsapp_click').length;
    const bioLinkViews = events.filter((e: any) => e.eventType === 'biolink_view' || e.eventType === 'bio_view').length;
    const bioLinkClicks = events.filter((e: any) => e.eventType === 'biolink_click' || e.eventType === 'bio_click').length;

    const totalConversions = completedOrders.length + bookings.filter((b) => b.status !== 'cancelled').length;
    const conversionRate = storeViews > 0 ? (totalConversions / storeViews) * 100 : totalConversions > 0 ? 100 : 0;

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalBookings: bookings.length,
      totalCustomers: customers.length,
      totalProducts: items.length,
      storeViews: Math.max(storeViews, orders.length + bookings.length),
      whatsappClicks,
      bioLinkViews,
      bioLinkClicks,
      conversionRate: Math.min(100, Math.round(conversionRate * 10) / 10),
      recentOrders: orders.slice(0, 5),
      recentBookings: bookings.slice(0, 5),
    };
  } catch (err) {
    console.error('Error aggregating analytics:', err);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalBookings: 0,
      totalCustomers: 0,
      totalProducts: 0,
      storeViews: 0,
      whatsappClicks: 0,
      conversionRate: 0,
      recentOrders: [],
      recentBookings: [],
    };
  }
}

export async function getCreatorAnalyticsSummary(
  businessId: string,
  timeRange: 'today' | '7d' | '30d' | '90d' | 'all' = '7d'
): Promise<CreatorAnalyticsSummary> {
  const now = Date.now();
  let startTime = 0;
  if (timeRange === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startTime = today.getTime();
  } else if (timeRange === '7d') {
    startTime = now - 7 * 24 * 60 * 60 * 1000;
  } else if (timeRange === '30d') {
    startTime = now - 30 * 24 * 60 * 60 * 1000;
  } else if (timeRange === '90d') {
    startTime = now - 90 * 24 * 60 * 60 * 1000;
  }

  try {
    const [
      eventsSnap,
      orders,
      bookings,
      eventsList,
      ticketsList,
      quotesSnap,
      quoteReqsSnap,
      reviewsList,
      affiliatesList,
      catalogList,
    ] = await Promise.all([
      getDocs(collection(db, 'businesses', businessId, 'analyticsEvents')).catch(() => ({ docs: [] } as any)),
      getOrders(businessId).catch(() => []),
      getBookings(businessId).catch(() => []),
      getEvents(businessId).catch(() => []),
      getEventTickets(businessId).catch(() => []),
      getDocs(collection(db, 'businesses', businessId, 'quotes')).catch(() => ({ docs: [] } as any)),
      getDocs(collection(db, 'businesses', businessId, 'quote_requests')).catch(() => ({ docs: [] } as any)),
      getReviews(businessId).catch(() => []),
      getAffiliateProducts(businessId).catch(() => []),
      getCatalogItems(businessId).catch(() => []),
    ]);

    const rawEvents = eventsSnap.docs.map((d: any) => d.data());
    const filteredEvents = startTime > 0 ? rawEvents.filter((e: any) => (e.timestamp || 0) >= startTime) : rawEvents;

    const normalizeType = (type: string): CanonicalAnalyticsEventType => {
      if (type === 'biolink_view' || type === 'bio_views') return 'bio_view';
      if (type === 'biolink_click' || type === 'bio_clicks' || type === 'bio_link_click') return 'bio_click';
      if (type === 'portfolio_views') return 'portfolio_view';
      if (type === 'project_views') return 'project_view';
      if (type === 'resume_downloads') return 'digital_download';
      return type as CanonicalAnalyticsEventType;
    };

    let totalViews = 0;
    let totalClicks = 0;
    
    let bioViews = 0;
    let bioClicks = 0;
    const clicksPerLink: Record<string, number> = {};

    let portfolioViews = 0;
    let projectViews = 0;
    let portfolioEnquiries = 0;
    const viewsPerProject: Record<string, number> = {};

    let digitalViews = 0;
    let digitalDownloads = 0;

    let affiliateImpressions = 0;
    let affiliateClicks = 0;
    const clicksPerProduct: Record<string, { title: string; clicks: number }> = {};

    filteredEvents.forEach((ev: any) => {
      const norm = normalizeType(ev.eventType);
      if (['profile_view', 'bio_view', 'portfolio_view', 'digital_product_view', 'consultation_view', 'event_view', 'quote_view', 'review_view', 'affiliate_impression', 'store_view'].includes(norm)) {
        totalViews++;
      }
      if (['bio_click', 'affiliate_click', 'whatsapp_click', 'project_view', 'share', 'qr_scan'].includes(norm)) {
        totalClicks++;
      }

      if (norm === 'bio_view') bioViews++;
      if (norm === 'bio_click') {
        bioClicks++;
        const linkId = ev.metadata?.linkId;
        if (linkId) {
          clicksPerLink[linkId] = (clicksPerLink[linkId] || 0) + 1;
        }
      }

      if (norm === 'portfolio_view') portfolioViews++;
      if (norm === 'project_view') {
        projectViews++;
        const projectId = ev.metadata?.projectId || ev.metadata?.itemId;
        if (projectId) {
          viewsPerProject[projectId] = (viewsPerProject[projectId] || 0) + 1;
        }
      }
      if (norm === 'whatsapp_click' && ev.metadata?.source === 'portfolio') {
        portfolioEnquiries++;
      }

      if (norm === 'digital_product_view') digitalViews++;
      if (norm === 'digital_download') digitalDownloads++;

      if (norm === 'affiliate_impression') affiliateImpressions++;
      if (norm === 'affiliate_click') {
        affiliateClicks++;
        const itemId = ev.metadata?.itemId || ev.metadata?.productId;
        const title = ev.metadata?.title || 'Affiliate Item';
        if (itemId) {
          if (!clicksPerProduct[itemId]) {
            clicksPerProduct[itemId] = { title, clicks: 0 };
          }
          clicksPerProduct[itemId].clicks += 1;
        }
      }
    });

    // 1. Digital Store Revenue: Realized paid digital transactions only (not pending or unverified)
    const digitalOrders = orders.filter((o) => {
      if (startTime > 0 && (o.createdAt || 0) < startTime) return false;
      const isPaid = o.paymentStatus === 'paid' || (o.total === 0 && (o.status === 'confirmed' || o.status === 'delivered'));
      const notRefundedOrCancelled = o.status !== 'cancelled' && o.paymentStatus !== 'refunded';
      return isPaid && notRefundedOrCancelled;
    });
    const digitalSalesCount = digitalOrders.length;
    const digitalRevenue = digitalOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const digitalProductsCount = catalogList.filter((c: any) => c.itemType === 'course' || c.downloadUrl || (c.digitalFiles && c.digitalFiles.length > 0)).length;

    // 2. Consultation Revenue: Authoritative paid/confirmed transactions only
    const filteredBookings = bookings.filter((b) => {
      if (startTime > 0 && (b.createdAt || 0) < startTime) return false;
      return b.status !== 'cancelled' && b.status !== 'refunded' && b.paymentStatus !== 'refunded';
    });
    const pendingBookings = filteredBookings.filter((b) => b.status === 'pending' && b.paymentStatus !== 'paid').length;
    const completedBookings = filteredBookings.filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.paymentStatus === 'paid')).length;
    const paidBookings = filteredBookings.filter((b) => b.paymentStatus === 'paid' || (b.totalAmount === 0 && (b.status === 'confirmed' || b.status === 'completed')));
    const consultationRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // 3. Event Revenue: Only paid/valid tickets, not pending or failed payments, excluding refunds
    const filteredTickets = ticketsList.filter((t) => {
      if (startTime > 0 && (t.createdAt || 0) < startTime) return false;
      const isPaid = t.paymentStatus === 'paid' || (t.price === 0 && t.status !== 'cancelled');
      const notRefundedOrCancelled = t.status !== 'cancelled' && t.status !== 'refunded' && t.paymentStatus !== 'refunded';
      return isPaid && notRefundedOrCancelled;
    });
    const eventRevenue = filteredTickets.reduce((sum, t) => sum + (t.price || 0), 0);

    // 4. Quote Revenue: Only paid quotes, excluding refunds
    const quoteReqs = quoteReqsSnap.docs.map((d: any) => d.data()).filter((q: any) => startTime === 0 || (q.createdAt || 0) >= startTime);
    const quotes = quotesSnap.docs.map((d: any) => d.data()).filter((q: any) => startTime === 0 || (q.createdAt || 0) >= startTime);
    const quotesSent = quotes.length;
    const quotesAccepted = quotes.filter((q: any) => q.status === 'accepted' || q.status === 'paid').length;
    const quotesPaidList = quotes.filter((q: any) => {
      const isPaid = q.status === 'paid' || q.paymentStatus === 'paid';
      const notRefundedOrCancelled = q.status !== 'refunded' && q.paymentStatus !== 'refunded' && q.status !== 'cancelled';
      return isPaid && notRefundedOrCancelled;
    });
    const quoteRevenue = quotesPaidList.reduce((sum: number, q: any) => sum + (q.totalAmount || q.amount || 0), 0);

    const filteredReviews = reviewsList.filter((r) => startTime === 0 || (r.createdAt || 0) >= startTime);
    const publishedReviews = filteredReviews.filter((r) => r.status === 'published');
    const pendingReviews = filteredReviews.filter((r) => r.status === 'pending');
    const avgRating = publishedReviews.length > 0
      ? Number((publishedReviews.reduce((sum, r) => sum + r.rating, 0) / publishedReviews.length).toFixed(1))
      : 0;

    const totalConversions = digitalSalesCount + completedBookings + filteredTickets.length + quotesPaidList.length;
    const totalRevenue = digitalRevenue + consultationRevenue + eventRevenue + quoteRevenue;
    const overallCtr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;
    const bioCtr = bioViews > 0 ? Number(((bioClicks / bioViews) * 100).toFixed(1)) : 0;
    const affiliateCtr = affiliateImpressions > 0 ? Number(((affiliateClicks / affiliateImpressions) * 100).toFixed(1)) : 0;
    const digitalConversionRate = digitalViews > 0 ? Number(((digitalSalesCount / digitalViews) * 100).toFixed(1)) : 0;

    const daysCount = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    const dailyTrends: Array<{ dateStr: string; day: string; views: number; clicks: number; conversions: number; revenue: number }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      const dayEvents = rawEvents.filter((e: any) => (e.timestamp || 0) >= startOfDay && (e.timestamp || 0) <= endOfDay);
      const dayViews = dayEvents.filter((e: any) => ['profile_view', 'bio_view', 'portfolio_view', 'digital_product_view', 'consultation_view', 'event_view', 'quote_view', 'review_view', 'affiliate_impression', 'store_view'].includes(normalizeType(e.eventType))).length;
      const dayClicks = dayEvents.filter((e: any) => ['bio_click', 'affiliate_click', 'whatsapp_click', 'project_view', 'share', 'qr_scan'].includes(normalizeType(e.eventType))).length;

      const dayOrders = digitalOrders.filter((o) => (o.createdAt || 0) >= startOfDay && (o.createdAt || 0) <= endOfDay);
      const dayBookings = paidBookings.filter((b) => (b.createdAt || 0) >= startOfDay && (b.createdAt || 0) <= endOfDay);
      const dayTickets = filteredTickets.filter((t) => (t.createdAt || 0) >= startOfDay && (t.createdAt || 0) <= endOfDay);
      const dayQuotesPaid = quotesPaidList.filter((q: any) => (q.updatedAt || q.createdAt || 0) >= startOfDay && (q.updatedAt || q.createdAt || 0) <= endOfDay);

      const dayConversions = dayOrders.length + dayBookings.length + dayTickets.length + dayQuotesPaid.length;
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
        dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) +
        dayTickets.reduce((sum, t) => sum + (t.price || 0), 0) +
        dayQuotesPaid.reduce((sum: number, q: any) => sum + (q.totalAmount || q.amount || 0), 0);

      dailyTrends.push({
        dateStr: dateFormatted,
        day: dayName,
        views: dayViews,
        clicks: dayClicks,
        conversions: dayConversions,
        revenue: dayRevenue,
      });
    }

    const recentEvents = filteredEvents
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 15)
      .map((e: any) => {
        const norm = normalizeType(e.eventType);
        let title = 'Interaction';
        let subtitle = e.metadata?.title || e.metadata?.url || 'Direct visitor';
        if (norm === 'bio_view') title = 'Bio Link Viewed';
        else if (norm === 'bio_click') title = `Bio Link Clicked: ${e.metadata?.title || 'Link'}`;
        else if (norm === 'portfolio_view') title = 'Portfolio Viewed';
        else if (norm === 'project_view') title = `Project Showcase Viewed: ${e.metadata?.title || 'Case Study'}`;
        else if (norm === 'digital_product_view') title = `Digital Product Viewed: ${e.metadata?.title || 'Product'}`;
        else if (norm === 'digital_purchase') title = `Digital Purchase: ${e.metadata?.productName || 'Asset'}`;
        else if (norm === 'digital_download') title = `Digital Asset Downloaded: ${e.metadata?.productName || 'File'}`;
        else if (norm === 'consultation_booking') title = `1:1 Consultation Booked: ${e.metadata?.customerName || 'Client'}`;
        else if (norm === 'event_registration' || norm === 'event_ticket_purchase') title = `Event Ticket Confirmed: ${e.metadata?.eventName || 'Pass'}`;
        else if (norm === 'quote_request') title = `Quote Requested by ${e.metadata?.customerName || 'Client'}`;
        else if (norm === 'quote_paid') title = `Quote Payment Received: #${e.metadata?.quoteNumber || ''}`;
        else if (norm === 'review_submitted') title = `Review Submitted (${e.metadata?.rating || 5} Stars)`;
        else if (norm === 'affiliate_click') title = `Affiliate Outbound Click: ${e.metadata?.title || 'Product'}`;
        else if (norm === 'whatsapp_click') title = 'WhatsApp Direct Inquiry';

        return {
          id: e.id || `ev_${e.timestamp}_${Math.random().toString(36).slice(2, 6)}`,
          eventType: norm,
          timestamp: e.timestamp || Date.now(),
          title,
          subtitle,
          metadata: e.metadata,
        };
      });

    return {
      timeRange,
      totalViews,
      totalClicks,
      overallCtr,
      totalRevenue,
      totalConversions,
      bioLink: {
        views: bioViews,
        clicks: bioClicks,
        ctr: bioCtr,
        clicksPerLink,
      },
      portfolio: {
        views: portfolioViews,
        projectViews,
        enquiries: portfolioEnquiries,
        viewsPerProject,
      },
      digitalStore: {
        productsCount: digitalProductsCount,
        salesCount: digitalSalesCount,
        revenue: digitalRevenue,
        downloadsCount: digitalDownloads,
        conversionRate: digitalConversionRate,
        salesPerProduct: {},
      },
      consultations: {
        totalBookings: filteredBookings.length,
        pendingBookings,
        completedBookings,
        revenue: consultationRevenue,
      },
      events: {
        eventsCount: eventsList.length,
        ticketsSold: filteredTickets.length,
        attendanceCount: filteredTickets.filter((t) => t.checkedIn).length,
        revenue: eventRevenue,
      },
      quotes: {
        enquiriesCount: quoteReqs.length,
        quotesSent,
        quotesAccepted,
        quotesPaid: quotesPaidList.length,
        revenue: quoteRevenue,
      },
      reviews: {
        total: filteredReviews.length,
        published: publishedReviews.length,
        pending: pendingReviews.length,
        averageRating: avgRating,
      },
      affiliate: {
        impressions: affiliateImpressions,
        outboundClicks: affiliateClicks,
        ctr: affiliateCtr,
        clicksPerProduct,
      },
      dailyTrends,
      recentEvents,
    };
  } catch (err) {
    console.error('Error computing creator analytics summary:', err);
    return {
      timeRange,
      totalViews: 0,
      totalClicks: 0,
      overallCtr: 0,
      totalRevenue: 0,
      totalConversions: 0,
      bioLink: { views: 0, clicks: 0, ctr: 0, clicksPerLink: {} },
      portfolio: { views: 0, projectViews: 0, enquiries: 0, viewsPerProject: {} },
      digitalStore: { productsCount: 0, salesCount: 0, revenue: 0, downloadsCount: 0, conversionRate: 0, salesPerProduct: {} },
      consultations: { totalBookings: 0, pendingBookings: 0, completedBookings: 0, revenue: 0 },
      events: { eventsCount: 0, ticketsSold: 0, attendanceCount: 0, revenue: 0 },
      quotes: { enquiriesCount: 0, quotesSent: 0, quotesAccepted: 0, quotesPaid: 0, revenue: 0 },
      reviews: { total: 0, published: 0, pending: 0, averageRating: 0 },
      affiliate: { impressions: 0, outboundClicks: 0, ctr: 0, clicksPerProduct: {} },
      dailyTrends: [],
      recentEvents: [],
    };
  }
}

/**
 * Permanently delete store account, all items, categories, orders, offers, and wipe all storage bucket images (Cloudinary / Firebase) to save storage costs.
 */
export async function permanentlyDeleteStoreAccount(business: BusinessProfile): Promise<void> {
  const businessId = business.id;
  try {
    // 1. Delete all storage images (logo, cover, banner, maintenance image)
    if (business.logo) await deleteImageFromStorage(business.logo);
    if (business.coverImage) await deleteImageFromStorage(business.coverImage);
    if (business.banner) await deleteImageFromStorage(business.banner);
    if (business.maintenanceImage) await deleteImageFromStorage(business.maintenanceImage);

    // 2. Fetch and delete catalog items & their images
    const items = await getCatalogItems(businessId);
    for (const item of items) {
      if (item.images && Array.isArray(item.images)) {
        for (const img of item.images) {
          await deleteImageFromStorage(img);
        }
      }
      await deleteCatalogItem(businessId, item.id);
    }

    // 3. Fetch and delete categories
    const categories = await getCategories(businessId);
    for (const cat of categories) {
      await deleteCategory(businessId, cat.id);
    }

    // 4. Fetch and delete orders
    const orders = await getOrders(businessId);
    for (const order of orders) {
      await deleteOrder(businessId, order.id);
    }

    // 5. Fetch and delete offers
    const offers = await getOffers(businessId);
    for (const offer of offers) {
      await deleteOffer(businessId, offer.id);
    }

    // 5a. Fetch and delete biolinks
    const links = await getBioLinks(businessId);
    for (const link of links) {
      await deleteBioLink(link.id);
    }

    // 5b. Fetch and delete portfolio items & media
    const portfolioItems = await getPortfolioItems(businessId);
    for (const pItem of portfolioItems) {
      await deletePortfolioItem(businessId, pItem.id, pItem);
    }

    // 5c. Fetch and delete events & media
    const events = await getEvents(businessId);
    for (const ev of events) {
      if (ev.coverImage) await deleteImageFromStorage(ev.coverImage);
      await deleteDoc(doc(db, 'businesses', businessId, 'events', ev.id));
    }

    // 5d. Fetch and delete testimonials
    const testimonials = await getTestimonials(businessId);
    for (const t of testimonials) {
      if (t.clientPhoto) await deleteImageFromStorage(t.clientPhoto);
      await deleteDoc(doc(db, 'businesses', businessId, 'testimonials', t.id));
    }

    // 5e. Fetch and delete custom quotes
    const quotes = await getCustomQuoteRequests(businessId);
    for (const q of quotes) {
      await deleteDoc(doc(db, 'businesses', businessId, 'quote_requests', q.id));
    }

    // 5f. Fetch and delete digital products & images/files
    try {
      const dpSnap = await getDocs(collection(db, 'businesses', businessId, 'digital_products'));
      for (const d of dpSnap.docs) {
        const dp = d.data() as any;
        if (dp.coverImage) await deleteImageFromStorage(dp.coverImage);
        if (dp.fileUrls && Array.isArray(dp.fileUrls)) {
          for (const fUrl of dp.fileUrls) {
            await deleteImageFromStorage(fUrl, 'raw');
          }
        }
        await deleteDoc(d.ref);
      }
    } catch (dpErr) {
      console.warn('Digital products cleanup note:', dpErr);
    }

    // 5g. Fetch and delete bookings
    try {
      const bookings = await getBookings(businessId);
      for (const b of bookings) {
        await deleteDoc(doc(db, 'businesses', businessId, 'bookings', b.id));
      }
    } catch (bkErr) {
      console.warn('Bookings cleanup note:', bkErr);
    }

    // 5h. Fetch and delete customers
    try {
      const customers = await getCustomers(businessId);
      for (const c of customers) {
        await deleteDoc(doc(db, 'businesses', businessId, 'customers', c.id));
      }
    } catch (cErr) {
      console.warn('Customers cleanup note:', cErr);
    }

    // 6. Finally delete business doc & local storage
    await deleteBusiness(businessId);
  } catch (err) {
    console.error('Error permanently deleting store account:', err);
    throw err;
  }
}

// BIO LINKS HELPERS
const getLocalBioLinks = (businessId: string): any[] => {
  try {
    const raw = localStorage.getItem(`storelly_biolinks_${businessId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalBioLinks = (businessId: string, links: any[]) => {
  try {
    localStorage.setItem(`storelly_biolinks_${businessId}`, JSON.stringify(links));
  } catch (e) {
    console.warn('Failed to save biolinks locally:', e);
  }
};

// BIO LINKS
export const getBioLinks = async (businessId: string) => {
  let items: any[] = [];
  try {
    // 1. Try compound query
    try {
      const q = query(
        collection(db, 'biolinks'),
        where('businessId', '==', businessId),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (indexError) {
      // Fallback query without compound orderBy in case composite index is missing
      const fallbackQuery = query(
        collection(db, 'biolinks'),
        where('businessId', '==', businessId)
      );
      const snapshot = await getDocs(fallbackQuery);
      items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    if (items.length > 0) {
      saveLocalBioLinks(businessId, items);
      return items;
    }
  } catch (error) {
    console.warn('Error fetching bio links from Firestore, using local cache:', error);
  }

  // Fallback to local storage cache
  const localItems = getLocalBioLinks(businessId);
  return localItems.sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const createBioLink = async (businessId: string, data: any) => {
  const newLink = {
    ...data,
    businessId,
    ownerId: auth.currentUser?.uid || data.ownerId || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const tempDocRef = doc(collection(db, 'biolinks'));
  const tempId = tempDocRef.id;
  // Optimistically save locally
  const current = getLocalBioLinks(businessId);
  saveLocalBioLinks(businessId, [...current, { ...newLink, id: tempId }]);

  try {
    await setDoc(tempDocRef, sanitizeForFirestore(newLink));
    return tempId;
  } catch (err) {
    console.warn('Firestore setDoc warning for createBioLink, preserved locally:', err);
    return tempId;
  }
};

export const updateBioLink = async (linkId: string, data: any) => {
  // Update local caches across businesses
  const localList = getLocalBusinesses();
  for (const b of localList) {
    const bLinks = getLocalBioLinks(b.id);
    const target = bLinks.find(l => l.id === linkId);
    if (target) {
      const updatedList = bLinks.map(l => l.id === linkId ? { ...l, ...data, updatedAt: Date.now() } : l);
      saveLocalBioLinks(b.id, updatedList);
      break;
    }
  }

  try {
    const docRef = doc(db, 'biolinks', linkId);
    await updateDoc(docRef, sanitizeForFirestore({
      ...data,
      updatedAt: Date.now()
    }));
  } catch (err) {
    console.warn('Firestore updateBioLink warning:', err);
  }
};

export const deleteBioLink = async (linkId: string) => {
  const localList = getLocalBusinesses();
  for (const b of localList) {
    const bLinks = getLocalBioLinks(b.id);
    if (bLinks.some(l => l.id === linkId)) {
      saveLocalBioLinks(b.id, bLinks.filter(l => l.id !== linkId));
      break;
    }
  }

  try {
    const docRef = doc(db, 'biolinks', linkId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteBioLink warning:', err);
  }
};

export const updateBioLinksOrder = async (links: any[]) => {
  if (links.length > 0 && links[0].businessId) {
    saveLocalBioLinks(links[0].businessId, links);
  }

  try {
    const batch = writeBatch(db);
    links.forEach((link, index) => {
      const ref = doc(db, 'biolinks', link.id);
      batch.update(ref, { order: index, updatedAt: Date.now() });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore updateBioLinksOrder batch warning:', err);
  }
};

export const recordBioLinkClick = async (businessId: string, linkId: string) => {
  try {
    const eventDocRef = doc(collection(db, 'businesses', businessId, 'analyticsEvents'));
    await setDoc(eventDocRef, sanitizeForFirestore({
      id: eventDocRef.id,
      businessId,
      eventType: 'biolink_click',
      metadata: { linkId },
      timestamp: Date.now()
    }));
  } catch(e) {
    console.error(e);
  }
};

export const recordBioLinkView = async (businessId: string) => {
  try {
    const eventDocRef = doc(collection(db, 'businesses', businessId, 'analyticsEvents'));
    await setDoc(eventDocRef, sanitizeForFirestore({
      id: eventDocRef.id,
      businessId,
      eventType: 'biolink_view',
      metadata: {},
      timestamp: Date.now()
    }));
  } catch(e) {
    console.error(e);
  }
};

export const getBioLinkAnalytics = async (businessId: string) => {
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'analyticsEvents'),
      where('eventType', 'in', ['biolink_view', 'biolink_click'])
    );
    const snap = await getDocs(q);
    const events = snap.docs.map(d => d.data());
    
    let views = 0;
    let clicks = 0;
    const clicksPerLink: Record<string, number> = {};
    
    events.forEach((ev: any) => {
      if (ev.eventType === 'biolink_view') {
        views++;
      } else if (ev.eventType === 'biolink_click') {
        clicks++;
        const linkId = ev.metadata?.linkId;
        if (linkId) {
          clicksPerLink[linkId] = (clicksPerLink[linkId] || 0) + 1;
        }
      }
    });
    
    return { views, clicks, clicksPerLink };
  } catch (error) {
    console.error("Error fetching bio link analytics:", error);
    return { views: 0, clicks: 0, clicksPerLink: {} };
  }
};

// ==========================================
// MODULE 3: WORK PORTFOLIO & SHOWCASE SERVICE
// ==========================================

/**
 * Fetch all portfolio items for a business.
 */
export async function getPortfolioItems(
  businessId: string,
  activeOnly = false
): Promise<PortfolioItem[]> {
  try {
    const portfolioRef = collection(db, 'businesses', businessId, 'portfolio');
    const snap = await getDocs(portfolioRef);
    let items: PortfolioItem[] = [];
    snap.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        businessId,
        ...docSnap.data(),
      } as PortfolioItem);
    });

    if (activeOnly) {
      items = items.filter((i) => i.isActive !== false);
    }

    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err: any) {
    console.error('Error fetching portfolio items:', err?.message || err);
    return [];
  }
}

/**
 * Create a new portfolio work sample.
 */
export async function createPortfolioItem(
  businessId: string,
  data: Omit<PortfolioItem, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
): Promise<PortfolioItem> {
  const portfolioRef = collection(db, 'businesses', businessId, 'portfolio');
  const now = Date.now();

  const cleanData = sanitizeForFirestore({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const docRef = await addDoc(portfolioRef, cleanData);

  return {
    id: docRef.id,
    businessId,
    ...cleanData,
  } as PortfolioItem;
}

/**
 * Update an existing portfolio item.
 */
export async function updatePortfolioItem(
  businessId: string,
  itemId: string,
  data: Partial<PortfolioItem>
): Promise<void> {
  const itemRef = doc(db, 'businesses', businessId, 'portfolio', itemId);
  const cleanData = sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  });

  await updateDoc(itemRef, cleanData);
}

/**
 * Delete a portfolio item and cleanup associated Cloudinary images/videos.
 */
export async function deletePortfolioItem(
  businessId: string,
  itemId: string,
  itemData?: PortfolioItem
): Promise<void> {
  // Delete from Cloudinary if media exists
  if (itemData) {
    if (itemData.coverImage) {
      deleteImageFromStorage(itemData.coverImage).catch(() => {});
    }
    if (itemData.mediaUrls && itemData.mediaUrls.length > 0) {
      itemData.mediaUrls.forEach((url) => {
        const isVideo = itemData.mediaType === 'video_file' || url.includes('/video/');
        deleteImageFromStorage(url, isVideo ? 'video' : 'image').catch(() => {});
      });
    }
    if (itemData.cloudinaryPublicIds && itemData.cloudinaryPublicIds.length > 0) {
      itemData.cloudinaryPublicIds.forEach((pid) => {
        deleteImageFromStorage(pid).catch(() => {});
      });
    }
  }

  const itemRef = doc(db, 'businesses', businessId, 'portfolio', itemId);
  await deleteDoc(itemRef);
}

/**
 * Batch reorder portfolio items.
 */
export async function reorderPortfolioItems(
  businessId: string,
  items: { id: string; order: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const itemRef = doc(db, 'businesses', businessId, 'portfolio', item.id);
    batch.update(itemRef, { order: item.order, updatedAt: Date.now() });
  });
  await batch.commit();
}

/**
 * Fetch testimonials for a business.
 */
export async function getTestimonials(
  businessId: string,
  activeOnly = false
): Promise<Testimonial[]> {
  try {
    const testimonialsRef = collection(db, 'businesses', businessId, 'testimonials');
    const snap = await getDocs(testimonialsRef);
    let testimonials: Testimonial[] = [];
    snap.forEach((docSnap) => {
      testimonials.push({
        id: docSnap.id,
        businessId,
        ...docSnap.data(),
      } as Testimonial);
    });

    if (activeOnly) {
      testimonials = testimonials.filter((t) => t.isActive !== false);
    }

    return testimonials.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err: any) {
    console.error('Error fetching testimonials:', err?.message || err);
    return [];
  }
}

/**
 * Create a new client testimonial.
 */
export async function createTestimonial(
  businessId: string,
  data: Omit<Testimonial, 'id' | 'businessId' | 'createdAt'>
): Promise<Testimonial> {
  const testimonialsRef = collection(db, 'businesses', businessId, 'testimonials');
  const now = Date.now();

  const cleanData = sanitizeForFirestore({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const docRef = await addDoc(testimonialsRef, cleanData);

  return {
    id: docRef.id,
    businessId,
    ...cleanData,
  } as Testimonial;
}

/**
 * Update a testimonial.
 */
export async function updateTestimonial(
  businessId: string,
  testimonialId: string,
  data: Partial<Testimonial>
): Promise<void> {
  const testimonialRef = doc(db, 'businesses', businessId, 'testimonials', testimonialId);
  const cleanData = sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  });

  await updateDoc(testimonialRef, cleanData);
}

/**
 * Delete a testimonial.
 */
export async function deleteTestimonial(
  businessId: string,
  testimonialId: string,
  photoUrl?: string
): Promise<void> {
  if (photoUrl) {
    deleteImageFromStorage(photoUrl).catch(() => {});
  }
  const testimonialRef = doc(db, 'businesses', businessId, 'testimonials', testimonialId);
  await deleteDoc(testimonialRef);
}

/**
 * Batch reorder testimonials.
 */
export async function reorderTestimonials(
  businessId: string,
  testimonials: { id: string; order: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  testimonials.forEach((t) => {
    const tRef = doc(db, 'businesses', businessId, 'testimonials', t.id);
    batch.update(tRef, { order: t.order, updatedAt: Date.now() });
  });
  await batch.commit();
}

/**
 * Update portfolio showcase settings on BusinessProfile.
 */
export async function updatePortfolioSettings(
  businessId: string,
  settings: Partial<PortfolioSettings>
): Promise<void> {
  const bizRef = doc(db, 'businesses', businessId);
  const cleanSettings = sanitizeForFirestore(settings);
  const updatePayload: Record<string, any> = {
    portfolioSettings: cleanSettings,
    updatedAt: Date.now(),
  };
  if (cleanSettings.templateId) {
    updatePayload.template = cleanSettings.templateId;
  }
  await updateDoc(bizRef, updatePayload);
}

// ==========================================
// MODULE 4: EVENT & WEBINAR TICKETING SERVICES
// ==========================================

/**
 * Fetch all events for a business
 */
export async function getEvents(businessId: string): Promise<EventItem[]> {
  try {
    const eventsRef = collection(db, 'businesses', businessId, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as EventItem[];
  } catch (err) {
    console.error('Error fetching events:', err);
    return [];
  }
}

/**
 * Real-time subscription to events
 */
export function subscribeToEvents(
  businessId: string,
  callback: (events: EventItem[]) => void
): () => void {
  if (!businessId) {
    callback([]);
    return () => {};
  }
  try {
    const eventsRef = collection(db, 'businesses', businessId, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EventItem[];
        callback(items);
      },
      (err) => {
        console.warn('Firestore events subscription notice:', err?.message || err);
        callback([]);
      }
    );
  } catch (e) {
    console.warn('Could not initialize events subscription:', e);
    return () => {};
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  businessId: string,
  data: Omit<EventItem, 'id' | 'businessId' | 'ticketsSold' | 'seatsRemaining' | 'createdAt' | 'updatedAt'>
): Promise<EventItem> {
  const eventsRef = collection(db, 'businesses', businessId, 'events');
  const newDocRef = doc(eventsRef);

  const capacity = Number(data.capacity) || 50;
  const newEvent: EventItem = {
    ...data,
    id: newDocRef.id,
    businessId,
    capacity,
    seatsRemaining: capacity,
    ticketsSold: 0,
    status: data.status || 'upcoming',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const cleanData = sanitizeForFirestore(newEvent);
  await setDoc(newDocRef, cleanData);
  return newEvent;
}

/**
 * Update an existing event
 */
export async function updateEvent(
  businessId: string,
  eventId: string,
  data: Partial<EventItem>
): Promise<void> {
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  const cleanData = sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  });
  await updateDoc(eventRef, cleanData);
}

/**
 * Delete an event
 */
export async function deleteEvent(
  businessId: string,
  eventId: string,
  coverImage?: string
): Promise<void> {
  if (coverImage) {
    deleteImageFromStorage(coverImage).catch(() => {});
  }
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  await deleteDoc(eventRef);
}

/**
 * Cancel an event and update tickets to refunded
 */
export async function cancelEvent(
  businessId: string,
  eventId: string,
  cancellationReason?: string
): Promise<{ event: EventItem; tickets: EventTicket[] }> {
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) {
    throw new Error('Event not found');
  }

  const eventData = { id: eventSnap.id, ...eventSnap.data() } as EventItem;

  // 1. Mark event as cancelled
  await updateDoc(eventRef, {
    status: 'cancelled',
    cancellationReason: cancellationReason || 'Cancelled by organizer',
    updatedAt: Date.now(),
  });

  // 2. Fetch all tickets for this event and mark as refunded
  const ticketsRef = collection(db, 'businesses', businessId, 'tickets');
  const q = query(ticketsRef, where('eventId', '==', eventId));
  const ticketSnaps = await getDocs(q);

  const batch = writeBatch(db);
  const updatedTickets: EventTicket[] = [];

  ticketSnaps.docs.forEach((tDoc) => {
    const tData = { id: tDoc.id, ...tDoc.data() } as EventTicket;
    if (tData.paymentStatus !== 'refunded') {
      batch.update(tDoc.ref, {
        paymentStatus: 'refunded',
        updatedAt: Date.now(),
      });
      updatedTickets.push({ ...tData, paymentStatus: 'refunded' });
    } else {
      updatedTickets.push(tData);
    }
  });

  await batch.commit();

  return {
    event: { ...eventData, status: 'cancelled', cancellationReason },
    tickets: updatedTickets,
  };
}

/**
 * Fetch all tickets for an event or entire business
 */
export async function getEventTickets(
  businessId: string,
  eventId?: string
): Promise<EventTicket[]> {
  try {
    const ticketsRef = collection(db, 'businesses', businessId, 'tickets');
    let q = query(ticketsRef, orderBy('createdAt', 'desc'));
    if (eventId && eventId !== 'all') {
      q = query(ticketsRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as EventTicket[];
  } catch (err) {
    console.error('Error fetching event tickets:', err?.message || err, err);
    return [];
  }
}

/**
 * Real-time subscription to tickets of an event or all business events
 */
export function subscribeToEventTickets(
  businessId: string,
  eventIdOrCallback: string | ((tickets: EventTicket[]) => void) | undefined,
  maybeCallback?: (tickets: EventTicket[]) => void
): () => void {
  const eventId = typeof eventIdOrCallback === 'string' ? eventIdOrCallback : undefined;
  const callback = typeof eventIdOrCallback === 'function' ? eventIdOrCallback : maybeCallback;

  if (!businessId || !callback || !auth?.currentUser) {
    if (callback) callback([]);
    return () => {};
  }
  try {
    const ticketsRef = collection(db, 'businesses', businessId, 'tickets');
    const q = eventId && eventId !== 'all'
      ? query(ticketsRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc'))
      : query(ticketsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as EventTicket[];
        callback(items);
      },
      (err) => {
        console.warn('Firestore tickets subscription notice:', err?.message || err);
        callback([]);
      }
    );
  } catch (e) {
    console.warn('Could not initialize tickets subscription:', e);
    return () => {};
  }
}

export async function getBookedSlotsForDate(
  businessId: string,
  itemId: string,
  date: string
): Promise<string[]> {
  try {
    const bookingsRef = collection(db, 'businesses', businessId, 'bookings');
    const q = query(
      bookingsRef,
      where('itemId', '==', itemId),
      where('bookingDate', '==', date),
      where('status', 'in', ['pending', 'confirmed'])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => (d.data() as Booking).bookingTimeSlot);
  } catch (err) {
    console.error('Error fetching booked slots:', err);
    return [];
  }
}

/**
 * CRITICAL SEAT MANAGEMENT TRANSACTION:
 * Purchases / claims an event ticket atomically.
 * Ensures seatsRemaining > 0 and ticketsSold < capacity before decrementing.
 */
export async function purchaseEventTicketTransaction(
  businessId: string,
  eventId: string,
  buyerDetails: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    paymentStatus?: 'paid' | 'free';
    paymentId?: string;
    razorpayOrderId?: string;
    seatNumber?: string;
    seatSection?: string;
    notes?: string;
    holdId?: string;
  }
): Promise<{ ticket: EventTicket; updatedEvent: EventItem }> {
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  const ticketRef = doc(collection(db, 'businesses', businessId, 'tickets'));
  const ticketCode = `TKT-${ticketRef.id.slice(-8).toUpperCase()}`;

  const result = await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) {
      throw new Error('Event not found or has been deleted');
    }

    const event = eventSnap.data() as EventItem;

    if (event.status === 'cancelled') {
      throw new Error('This event has been cancelled by the organizer');
    }

    const capacity = Number(event.capacity) || 1;
    const currentSold = Number(event.ticketsSold) || 0;
    let seatsRemaining = event.seatsRemaining !== undefined ? Number(event.seatsRemaining) : capacity - currentSold;

    // Check if we have an active hold
    if (buyerDetails.holdId) {
      const holdRef = doc(db, 'businesses', businessId, 'events', eventId, 'seat_holds', buyerDetails.holdId);
      const holdSnap = await transaction.get(holdRef);
      if (holdSnap.exists() && holdSnap.data().status === 'active') {
        // Seat already decremented in reserveEventSeat, just finalize the hold
        transaction.update(holdRef, {
          status: 'completed',
          completedAt: Date.now()
        });
      } else {
        // Hold expired/released, decrement now if available
        if (seatsRemaining <= 0 || currentSold >= capacity || event.status === 'sold_out') {
          throw new Error('Sold Out - No seats remaining for this event (hold expired)');
        }
        seatsRemaining -= 1;
      }
    } else {
      // Normal flow without hold
      if (seatsRemaining <= 0 || currentSold >= capacity || event.status === 'sold_out') {
        throw new Error('Sold Out - No seats remaining for this event');
      }
      seatsRemaining -= 1;
    }

    const nextSold = currentSold + 1;
    const nextStatus: EventStatus = seatsRemaining <= 0 ? 'sold_out' : (event.status !== 'sold_out' ? event.status || 'upcoming' : 'upcoming');

    // Seat allocation if event has seating chart enabled
    let assignedSeatNumber = buyerDetails.seatNumber;
    let assignedSeatSection = buyerDetails.seatSection;
    let updatedSeatingChart = event.seatingChart;

    if (event.seatingChart?.enabled && event.seatingChart.seats?.length) {
      const allSeats = [...event.seatingChart.seats];

      // If specific seat requested
      if (assignedSeatNumber) {
        const targetSeatIndex = allSeats.findIndex(
          (s) => (s.label === assignedSeatNumber || s.id === assignedSeatNumber) && s.status === 'available'
        );
        if (targetSeatIndex !== -1) {
          allSeats[targetSeatIndex] = {
            ...allSeats[targetSeatIndex],
            status: 'booked',
            bookedByTicketId: ticketCode,
            bookedByCustomerName: buyerDetails.customerName.trim(),
          };
          assignedSeatSection = allSeats[targetSeatIndex].section;
        }
      } else {
        // Auto-assign next available seat
        const firstAvailIndex = allSeats.findIndex((s) => s.status === 'available');
        if (firstAvailIndex !== -1) {
          assignedSeatNumber = allSeats[firstAvailIndex].label;
          assignedSeatSection = allSeats[firstAvailIndex].section;
          allSeats[firstAvailIndex] = {
            ...allSeats[firstAvailIndex],
            status: 'booked',
            bookedByTicketId: ticketCode,
            bookedByCustomerName: buyerDetails.customerName.trim(),
          };
        }
      }

      updatedSeatingChart = {
        ...event.seatingChart,
        seats: allSeats,
        totalSeats: allSeats.filter((s) => s.status !== 'blocked').length,
      };
    }

    // 1. Update event atomically
    const eventUpdatePayload: any = {
      ticketsSold: nextSold,
      seatsRemaining: seatsRemaining,
      status: nextStatus,
      updatedAt: Date.now(),
    };

    if (updatedSeatingChart) {
      eventUpdatePayload.seatingChart = updatedSeatingChart;
    }

    transaction.update(eventRef, eventUpdatePayload);

    // 2. Create the ticket document
    const newTicket: EventTicket = {
      id: ticketRef.id,
      ticketId: ticketCode,
      eventId,
      eventTitle: event.title,
      businessId,
      customerName: buyerDetails.customerName.trim(),
      customerPhone: buyerDetails.customerPhone.trim(),
      customerEmail: buyerDetails.customerEmail?.trim(),
      format: event.format,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      price: event.price || 0,
      paymentStatus: buyerDetails.paymentStatus || (event.price === 0 ? 'free' : 'paid'),
      paymentId: buyerDetails.paymentId,
      razorpayOrderId: buyerDetails.razorpayOrderId,
      seatNumber: assignedSeatNumber,
      seatSection: assignedSeatSection,
      checkedIn: false,
      meetingUrl: event.meetingUrl,
      venueAddress: event.venueAddress,
      venueCity: event.venueCity,
      notes: buyerDetails.notes,
      createdAt: Date.now(),
    };

    const cleanTicket = sanitizeForFirestore(newTicket);
    transaction.set(ticketRef, cleanTicket);

    const updatedEvent: EventItem = {
      ...event,
      ticketsSold: nextSold,
      seatsRemaining: seatsRemaining,
      status: nextStatus,
      seatingChart: updatedSeatingChart,
    };

    return { ticket: newTicket, updatedEvent };
  });

  // Create notification (non-blocking)
  try {
    await createNotification(businessId, {
      type: 'event',
      title: 'New Ticket Purchased',
      message: `${buyerDetails.customerName} bought a ticket for ${result.ticket.eventTitle}.`,
      link: '/dashboard/events',
      entityType: 'event',
      entityId: result.ticket.eventId,
      idempotencyKey: `ticket_${result.ticket.id}`,
      metadata: { ticketId: result.ticket.id, eventId: result.ticket.eventId }
    });
  } catch (notifErr) {
    console.warn('Non-blocking notification warning:', notifErr);
  }

  // Upsert customer for CRM (non-blocking)
  try {
    if (buyerDetails.customerPhone) {
      await upsertCustomerFromEventTicket(businessId, result.ticket);
    }
  } catch (custErr) {
    console.warn('Customer upsert non-blocking notice:', custErr);
  }

  return result;
}

/**
 * Toggle check-in status for an attendee ticket
 */
export async function checkInTicket(
  businessId: string,
  ticketId: string,
  checkedIn: boolean
): Promise<void> {
  const ticketRef = doc(db, 'businesses', businessId, 'tickets', ticketId);
  await updateDoc(ticketRef, {
    checkedIn,
    checkedInAt: checkedIn ? Date.now() : null,
    updatedAt: Date.now(),
  });
}

// ==========================================
// MODULE 5: CUSTOM ORDER & QUOTE REQUEST SERVICES
// ==========================================

/**
 * Fetch all quote requests for a business
 */
export async function getCustomQuoteRequests(
  businessId: string,
  includeArchived: boolean = false
): Promise<CustomQuoteRequest[]> {
  try {
    const quotesRef = collection(db, 'businesses', businessId, 'quote_requests');
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CustomQuoteRequest[];

    if (includeArchived) return all;
    return all.filter((r) => !r.isArchived);
  } catch (err) {
    console.error('Error fetching custom quote requests:', err);
    return [];
  }
}

/**
 * Real-time subscription to quote requests
 */
export function subscribeToCustomQuoteRequests(
  businessId: string,
  callback: (requests: CustomQuoteRequest[]) => void,
  includeArchived: boolean = false
): () => void {
  if (!businessId || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const quotesRef = collection(db, 'businesses', businessId, 'quote_requests');
    const q = query(quotesRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CustomQuoteRequest[];
        callback(includeArchived ? all : all.filter((r) => !r.isArchived));
      },
      (err) => {
        console.warn('Firestore quote_requests subscription notice:', err?.message || err);
        callback([]);
      }
    );
  } catch (e) {
    console.warn('Could not initialize quote_requests subscription:', e);
    return () => {};
  }
}

/**
 * Submit a new custom quote request (Customer side)
 */
export async function createCustomQuoteRequest(
  businessId: string,
  data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    description: string;
    budgetRange?: string;
    referenceImages?: string[];
  }
): Promise<CustomQuoteRequest> {
  const quotesRef = collection(db, 'businesses', businessId, 'quote_requests');
  const newDocRef = doc(quotesRef);
  const requestNumber = `REQ-${newDocRef.id.slice(-6).toUpperCase()}`;

  const newRequest: CustomQuoteRequest = {
    id: newDocRef.id,
    businessId,
    requestNumber,
    customerName: data.customerName.trim(),
    customerPhone: data.customerPhone.trim(),
    customerEmail: data.customerEmail?.trim(),
    description: data.description.trim(),
    budgetRange: data.budgetRange,
    referenceImages: data.referenceImages || [],
    status: 'new',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const cleanData = sanitizeForFirestore(newRequest);
  await setDoc(newDocRef, cleanData);

  // Upsert customer CRM record
  await upsertCustomerFromQuoteRequest(businessId, newRequest);

  // Create notification
  await createNotification(businessId, {
    type: 'quote',
    title: 'New Quote Request',
    message: `Custom quote requested by ${data.customerName}.`,
    link: '/dashboard/quotes',
    entityType: 'quote',
    entityId: newDocRef.id,
    idempotencyKey: `quote_${newDocRef.id}`,
    metadata: { requestId: newDocRef.id, requestNumber: requestNumber }
  });

  return newRequest;
}

/**
 * Creator sends a custom price quote & generates one-time payment link
 */
export async function submitQuoteOffer(
  businessId: string,
  requestId: string,
  quoteDetails: {
    quotedPrice: number;
    quoteNotes?: string;
    estimatedDeliveryDays?: number;
  }
): Promise<{ request: CustomQuoteRequest; paymentUrl: string; paymentLinkId: string }> {
  const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
  const quoteSnap = await getDoc(quoteRef);
  if (!quoteSnap.exists()) {
    throw new Error('Quote request not found');
  }

  const paymentLinkId = `paylink_qr_${requestId}_${Date.now()}`;
  const paymentUrl = getQuotePayUrl(businessId, requestId);

  const updatePayload = {
    quotedPrice: quoteDetails.quotedPrice,
    quoteNotes: quoteDetails.quoteNotes || '',
    estimatedDeliveryDays: quoteDetails.estimatedDeliveryDays || 3,
    quotedAt: Date.now(),
    paymentLinkId,
    paymentLinkUrl: paymentUrl,
    paymentStatus: 'pending' as const,
    status: 'quoted' as QuoteRequestStatus,
    updatedAt: Date.now(),
  };

  await updateDoc(quoteRef, updatePayload);

  const updatedReq: CustomQuoteRequest = {
    ...(quoteSnap.data() as CustomQuoteRequest),
    ...updatePayload,
    id: requestId,
  };

  return { request: updatedReq, paymentUrl, paymentLinkId };
}

/**
 * Mark payment completed on custom quote request
 */
export async function acceptQuotePayment(
  businessId: string,
  requestId: string,
  paymentDetails: {
    paymentId?: string;
    razorpayOrderId?: string;
    amountPaid?: number;
  }
): Promise<CustomQuoteRequest> {
  const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
  const quoteSnap = await getDoc(quoteRef);
  if (!quoteSnap.exists()) {
    throw new Error('Quote request not found');
  }

  const current = quoteSnap.data() as CustomQuoteRequest;
  const updatePayload = {
    status: 'accepted' as QuoteRequestStatus,
    paymentStatus: 'paid' as const,
    paymentId: paymentDetails.paymentId || `pay_${Date.now()}`,
    paidAt: Date.now(),
    updatedAt: Date.now(),
  };

  await updateDoc(quoteRef, updatePayload);
  return { ...current, ...updatePayload };
}

/**
 * Update custom quote request status / fields
 */
export async function updateCustomQuoteRequest(
  businessId: string,
  requestId: string,
  data: Partial<CustomQuoteRequest>
): Promise<void> {
  const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
  const cleanData = sanitizeForFirestore({
    ...data,
    updatedAt: Date.now(),
  });
  await updateDoc(quoteRef, cleanData);
}

/**
 * Toggle archive on custom quote request
 */
export async function archiveCustomQuoteRequest(
  businessId: string,
  requestId: string,
  isArchived: boolean = true
): Promise<void> {
  const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
  await updateDoc(quoteRef, {
    isArchived,
    updatedAt: Date.now(),
  });
}

/**
 * Delete custom quote request
 */
export async function deleteCustomQuoteRequest(
  businessId: string,
  requestId: string
): Promise<void> {
  const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
  await deleteDoc(quoteRef);
}

/**
 * Fetch a single quote request by ID
 */
export async function getCustomQuoteRequest(
  businessId: string,
  requestId: string
): Promise<CustomQuoteRequest | null> {
  try {
    const quoteRef = doc(db, 'businesses', businessId, 'quote_requests', requestId);
    const snap = await getDoc(quoteRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as CustomQuoteRequest;
  } catch (err) {
    console.error('Error fetching custom quote request:', err);
    return null;
  }
}

/**
 * Check and automatically expire custom quotes that are unpaid after 48 hours
 */
export async function checkAndExpireOldQuotes(
  businessId: string,
  expiryHours: number = 48
): Promise<CustomQuoteRequest[]> {
  try {
    const quoteColl = collection(db, 'businesses', businessId, 'quote_requests');
    const q = query(quoteColl, where('status', '==', 'quoted'));
    const snap = await getDocs(q);
    const now = Date.now();
    const expiryMs = expiryHours * 60 * 60 * 1000;
    const expiredList: CustomQuoteRequest[] = [];

    for (const d of snap.docs) {
      const data = d.data() as CustomQuoteRequest;
      if (data.paymentStatus === 'paid') continue;

      const quotedTime = data.quotedAt || data.updatedAt || data.createdAt;
      if (quotedTime && now - quotedTime >= expiryMs) {
        const docRef = doc(db, 'businesses', businessId, 'quote_requests', d.id);
        const reason = `Quote Expired: Customer did not complete payment within ${expiryHours} hours.`;
        await updateDoc(docRef, {
          status: 'rejected' as QuoteRequestStatus,
          rejectionReason: reason,
          updatedAt: now,
        });

        expiredList.push({
          ...data,
          id: d.id,
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: now,
        });
      }
    }

    return expiredList;
  } catch (err) {
    console.error('Error checking and expiring old quotes:', err);
    return [];
  }
}

/**
 * Submit a new custom quote request (Customer side alias)
 */
export const submitCustomQuoteRequest = createCustomQuoteRequest;





/**
 * Securely uploads a file (PDF, Image, etc.) using Cloudinary with client-side fallback,
 * returning the public CDN URL.
 */
export const uploadFileToStorage = async (
  file: File,
  _pathFolder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> => {
  return await uploadToCloudinary(file, onProgress);
};



// ============================================================================
// EVENT SEAT HOLD MECHANISM
// ============================================================================

/**
 * Reserve a seat before opening checkout to prevent race conditions.
 */
export async function reserveEventSeat(businessId: string, eventId: string, holdId: string, holdDurationMs = 10 * 60 * 1000): Promise<boolean> {
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  const holdRef = doc(db, 'businesses', businessId, 'events', eventId, 'seat_holds', holdId);
  
  return await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) throw new Error('Event not found');
    
    const event = eventSnap.data() as EventItem;
    if (event.status === 'cancelled') throw new Error('Event is cancelled');
    
    const capacity = Number(event.capacity) || 1;
    const currentSold = Number(event.ticketsSold) || 0;
    const seatsRemaining = event.seatsRemaining !== undefined ? Number(event.seatsRemaining) : capacity - currentSold;
    
    if (seatsRemaining <= 0 || event.status === 'sold_out') {
      throw new Error('Sold Out - No seats remaining');
    }
    
    const nextRemaining = seatsRemaining - 1;
    const nextStatus = nextRemaining <= 0 ? 'sold_out' : (event.status || 'upcoming');
    
    transaction.update(eventRef, {
      seatsRemaining: nextRemaining,
      status: nextStatus,
      updatedAt: Date.now()
    });
    
    transaction.set(holdRef, {
      id: holdId,
      heldUntil: Date.now() + holdDurationMs,
      status: 'active',
      createdAt: Date.now()
    });
    
    return true;
  });
}

/**
 * Release a seat if checkout is dismissed or payment fails.
 */
export async function releaseEventSeat(businessId: string, eventId: string, holdId: string): Promise<void> {
  const eventRef = doc(db, 'businesses', businessId, 'events', eventId);
  const holdRef = doc(db, 'businesses', businessId, 'events', eventId, 'seat_holds', holdId);
  
  return await runTransaction(db, async (transaction) => {
    const holdSnap = await transaction.get(holdRef);
    if (!holdSnap.exists()) return; // Nothing to release
    
    const hold = holdSnap.data();
    if (hold.status !== 'active') return; // Already completed or released
    
    const eventSnap = await transaction.get(eventRef);
    if (eventSnap.exists()) {
      const event = eventSnap.data() as EventItem;
      const capacity = Number(event.capacity) || 1;
      let seatsRemaining = event.seatsRemaining !== undefined ? Number(event.seatsRemaining) : capacity - (Number(event.ticketsSold) || 0);
      
      const nextRemaining = seatsRemaining + 1;
      const nextStatus = nextRemaining > 0 && event.status === 'sold_out' ? 'upcoming' : event.status;
      
      transaction.update(eventRef, {
        seatsRemaining: nextRemaining,
        status: nextStatus,
        updatedAt: Date.now()
      });
    }
    
    transaction.update(holdRef, {
      status: 'released',
      releasedAt: Date.now()
    });
  });
}

/**
 * Cleanup stale holds that were never confirmed or released.
 * Safe to call periodically from the client side (e.g. when loading the event page).
 */
export async function cleanupStaleEventHolds(businessId: string, eventId: string): Promise<void> {
  const holdsRef = collection(db, 'businesses', businessId, 'events', eventId, 'seat_holds');
  const q = query(holdsRef, where('status', '==', 'active'), where('heldUntil', '<', Date.now()));
  
  try {
    const snap = await getDocs(q);
    if (snap.empty) return;
    
    // Process each stale hold
    for (const holdDoc of snap.docs) {
      try {
        await releaseEventSeat(businessId, eventId, holdDoc.id);
      } catch (err) {
        console.warn('Failed to clean up hold:', holdDoc.id, err);
      }
    }
  } catch (err) {
    console.warn('Error fetching stale holds:', err);
  }
}

/**
 * Secure utility to delete a creator asset recursively,
 * removing documents and associated cloud storage files.
 */
export async function deleteCreatorAsset(businessId: string, assetId: string, assetType: 'biolink' | 'portfolio' | 'product' | 'event' | 'quote' | 'affiliate'): Promise<void> {
  try {
    switch (assetType) {
      case 'biolink':
        await deleteDoc(doc(db, 'biolinks', assetId));
        break;
      case 'portfolio': {
        const pRef = doc(db, 'businesses', businessId, 'portfolio', assetId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const itemData = pSnap.data() as PortfolioItem;
          if (itemData.coverImage) await deleteImageFromStorage(itemData.coverImage);
          if (itemData.mediaUrls) {
            for (const url of itemData.mediaUrls) {
              const isVideo = itemData.mediaType === 'video_file' || url.includes('/video/');
              await deleteImageFromStorage(url, isVideo ? 'video' : 'image');
            }
          }
          if (itemData.cloudinaryPublicIds) {
            for (const pid of itemData.cloudinaryPublicIds) await deleteImageFromStorage(pid);
          }
          await deleteDoc(pRef);
        }
        break;
      }
      case 'product': {
        const prodRef = doc(db, 'businesses', businessId, 'catalog', assetId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as CatalogItem;
          if (prodData.images) {
            for (const img of prodData.images) await deleteImageFromStorage(img);
          }
          if (prodData.digitalFileUrl) await deleteImageFromStorage(prodData.digitalFileUrl, 'raw');
          await deleteDoc(prodRef);
        }
        break;
      }
      case 'event': {
        const evRef = doc(db, 'businesses', businessId, 'events', assetId);
        const evSnap = await getDoc(evRef);
        if (evSnap.exists()) {
          const evData = evSnap.data() as EventItem;
          if (evData.coverImage) await deleteImageFromStorage(evData.coverImage);
          await deleteDoc(evRef);
        }
        break;
      }
      case 'quote': {
        await deleteDoc(doc(db, 'businesses', businessId, 'quote_requests', assetId));
        break;
      }
      case 'affiliate': {
        const affRef = doc(db, 'businesses', businessId, 'affiliate_products', assetId);
        const affSnap = await getDoc(affRef);
        if (affSnap.exists()) {
          const affData = affSnap.data() as AffiliateProductItem;
          if (affData.imageUrl) await deleteImageFromStorage(affData.imageUrl);
          await deleteDoc(affRef);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Failed to delete ${assetType} ${assetId}:`, err);
    throw err;
  }
}

// ==========================================
// MODULE 8: AFFILIATE & RECOMMENDED PRODUCTS
// ==========================================

/**
 * Fetch all affiliate recommendations for a business
 */
export async function getAffiliateProducts(businessId: string): Promise<AffiliateProductItem[]> {
  try {
    const q = query(
      collection(db, 'businesses', businessId, 'affiliate_products'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AffiliateProductItem));
  } catch (err) {
    console.warn('Error fetching affiliate products:', err);
    return [];
  }
}

/**
 * Real-time subscription to affiliate recommendations
 */
export function subscribeToAffiliateProducts(
  businessId: string,
  callback: (items: AffiliateProductItem[]) => void
): () => void {
  const q = query(
    collection(db, 'businesses', businessId, 'affiliate_products'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AffiliateProductItem));
      callback(items);
    },
    (err) => {
      console.warn('Affiliate products subscription notice:', err);
      callback([]);
    }
  );
}

/**
 * Create a new affiliate / recommended product item
 */
export async function createAffiliateProduct(
  businessId: string,
  itemData: Omit<AffiliateProductItem, 'id' | 'businessId' | 'createdAt'>
): Promise<AffiliateProductItem> {
  const colRef = collection(db, 'businesses', businessId, 'affiliate_products');
  const docRef = doc(colRef);
  const now = Date.now();

  const newItem: AffiliateProductItem = {
    id: docRef.id,
    businessId,
    title: itemData.title.trim(),
    category: itemData.category?.trim() || 'General',
    description: itemData.description?.trim(),
    imageUrl: itemData.imageUrl,
    affiliateUrl: itemData.affiliateUrl.trim(),
    platform: itemData.platform?.trim(),
    priceDisplay: itemData.priceDisplay?.trim(),
    badgeText: itemData.badgeText?.trim(),
    discountCode: itemData.discountCode?.trim(),
    clicks: 0,
    featured: itemData.featured || false,
    order: itemData.order || 0,
    status: itemData.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  const clean = sanitizeForFirestore(newItem);
  await setDoc(docRef, clean);
  return newItem;
}

/**
 * Update an existing affiliate / recommended product item
 */
export async function updateAffiliateProduct(
  businessId: string,
  itemId: string,
  updates: Partial<AffiliateProductItem>
): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'affiliate_products', itemId);
  const clean = sanitizeForFirestore({
    ...updates,
    updatedAt: Date.now(),
  });
  await updateDoc(docRef, clean);
}

/**
 * Delete an affiliate recommendation
 */
export async function deleteAffiliateProduct(businessId: string, itemId: string): Promise<void> {
  await deleteCreatorAsset(businessId, itemId, 'affiliate');
}

/**
 * Atomically record click event for an affiliate recommendation link
 */
export async function recordAffiliateProductClick(businessId: string, itemId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'affiliate_products', itemId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists()) {
        const curClicks = Number(snap.data().clicks) || 0;
        tx.update(docRef, { clicks: curClicks + 1, updatedAt: Date.now() });
      }
    });
  } catch (err) {
    console.warn('Non-blocking affiliate click tracking notice:', err);
  }
}
