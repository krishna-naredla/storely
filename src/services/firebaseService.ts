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

/**
 * Resolves the canonical base URL for public links and QR code generation.
 * Uses window.location.origin dynamically so links work in local development, Cloud Run previews, and custom domains.
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin.trim();
    if (origin && origin !== 'null' && (origin.startsWith('http://') || origin.startsWith('https://'))) {
      return origin;
    }
  }
  return typeof process !== 'undefined' && process.env?.APP_BASE_URL
    ? process.env.APP_BASE_URL
    : 'http://localhost:3000';
}

export function getBioLinkUrl(slug: string): string {
  return `${getBaseUrl()}/@${encodeURIComponent(slug)}`;
}

export function getPortfolioUrl(slug: string): string {
  return `${getBaseUrl()}/portfolio/${encodeURIComponent(slug)}`;
}

export function getDigitalStoreUrl(slug: string): string {
  return `${getBaseUrl()}/store/${encodeURIComponent(slug)}`;
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

export function getModuleDeepUrl(businessOrSlug: any, moduleType: 'catalog' | 'digital' | 'services' | 'portfolio' | 'events' | 'quotes' | 'reviews' | 'card' | 'biolink'): string {
  const slug = typeof businessOrSlug === 'object' && businessOrSlug !== null ? businessOrSlug.slug : businessOrSlug;
  if (moduleType === 'biolink') {
    return getBioLinkUrl(slug);
  }
  if (moduleType === 'portfolio') {
    return getPortfolioUrl(slug);
  }
  const storeUrl = getDigitalStoreUrl(slug);
  const separator = storeUrl.includes('?') ? '&' : '?';
  return `${storeUrl}${separator}view=${encodeURIComponent(moduleType)}`;
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
  } catch (err) {
    console.error('Firestore write error for createBusiness:', err);
    throw err; // Rethrow to handle failure in UI
  }

  return business;
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
      const data = snap.docs[0].data() as BusinessProfile;
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
        const data = snapLower.docs[0].data() as BusinessProfile;
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

  // 3. Try fetching by ID directly (in case slug is business ID)
  try {
    const docRef = doc(db, 'businesses', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
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

  // 4. Try scanning all businesses in Firestore for slug/name match
  try {
    const allSnap = await getDocs(collection(db, 'businesses'));
    const matched = allSnap.docs.find((d) => {
      const b = d.data() as BusinessProfile;
      return (
        b.slug?.toLowerCase() === lowerSlug ||
        generateSlug(b.name || '') === lowerSlug ||
        d.id === slug
      );
    });
    if (matched) {
      const data = matched.data() as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore fallback scan warning:', err);
  }

  // Clean any stale local cache entry if present
  const localList = getLocalBusinesses();
  const stale = localList.find(
    (b) =>
      b.slug?.toLowerCase() === lowerSlug ||
      generateSlug(b.name || '') === lowerSlug ||
      b.id === slug
  );
  if (stale) {
    removeLocalBusiness(stale.id);
  }

  // Firestore is the ONLY authority for business existence.
  // Never restore missing or deleted businesses from localStorage/cache.
  return null;
}

export async function getUserBusinesses(ownerId: string): Promise<BusinessProfile[]> {
  try {
    const q = query(
      collection(db, 'businesses'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const businesses = snap.docs
      .map((d) => ({ ...d.data(), id: d.id } as BusinessProfile))
      .filter((b) => b.status !== 'deleted');
    
    // Firestore is authoritative: synchronize local cache strictly to existing businesses
    const localList = getLocalBusinesses();
    const updatedLocal = localList.filter(b => b.ownerId !== ownerId).concat(businesses);
    localStorage.setItem(LOCAL_BIZ_KEY, JSON.stringify(updatedLocal));
    
    return businesses;
  } catch (err) {
    console.warn('Error getting user businesses from Firestore:', err);
    return [];
  }
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
    slug: data.slug || generateSlug(data.name),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const sanitized = sanitizeForFirestore(category);
    await setDoc(catDocRef, sanitized);
  } catch (err) {
    console.warn('Firestore createCategory warning:', err);
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
    console.warn('Firestore updateCategory warning:', err);
  }
}

export async function deleteCategory(businessId: string, catId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'categories', catId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteCategory warning:', err);
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
    console.warn('Firestore reorderCategories warning:', err);
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
    slug: data.slug || generateSlug(data.name),
    createdAt: now,
    updatedAt: now,
  };

  const finishSync = firestoreSyncManager.startOperation();
  try {
    const sanitized = sanitizeForFirestore(item);
    await setDoc(itemDocRef, sanitized);
  } catch (err) {
    console.warn('Firestore createCatalogItem warning:', err);
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
    console.warn('Firestore updateCatalogItem warning:', err);
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
    console.warn('Firestore deleteCatalogItem warning:', err);
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
export async function createOrder(
  businessId: string,
  data: Omit<Order, 'id' | 'businessId' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
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
    await runTransaction(db, async (transaction) => {
      // 1. Create the order document
      const sanitized = sanitizeForFirestore(order);
      transaction.set(orderDocRef, sanitized);

      // 2. Safely handle inventory within the same transaction
      for (const item of order.items) {
        const itemRef = doc(db, 'businesses', businessId, 'catalog', item.itemId);
        const itemSnap = await transaction.get(itemRef);
        
        if (itemSnap.exists()) {
          const itemData = itemSnap.data() as CatalogItem;
          // Only decrement if it's actually tracking stock (not null/undefined)
          if (typeof itemData.stockQuantity === 'number') {
            const currentStock = itemData.stockQuantity;
            const newQty = currentStock - item.quantity;
            
            // Prevent negative stock - if stock becomes negative, we floor it at 0 
            // but we could also throw an error here to fail the order if strictness is desired.
            // For now, we'll floor at 0 as per the existing logic but keep it safe.
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

    // Automatically update or create customer record (can be outside transaction if needed, or moved inside)
    await upsertCustomerFromOrder(businessId, order);

    // Create notification
    await createNotification(businessId, {
      type: 'order',
      title: 'New Order Received',
      message: `You have a new ${order.orderType} order from ${order.customerName} for ${order.total}.`,
      link: '/dashboard/orders',
      metadata: { orderId: order.id, orderNumber: order.orderNumber }
    });
  } catch (err) {
    console.error('Firestore createOrder TRANSACTION FAIL:', err);
    // If the transaction fails, the order is not created.
    throw err; 
  }

  return order;
}

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
    console.warn('Firestore updateOrderStatus warning:', err);
  }
}

export async function deleteOrder(businessId: string, orderId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteOrder warning:', err);
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

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Double Booking Prevention for Appointments/Consultations
      if (data.bookingType === 'appointment' && data.bookingDate && data.bookingTimeSlot) {
        const colRef = collection(db, 'businesses', businessId, 'bookings');
        const q = query(
          colRef,
          where('itemId', '==', data.itemId),
          where('bookingDate', '==', data.bookingDate),
          where('bookingTimeSlot', '==', data.bookingTimeSlot),
          where('status', 'in', ['pending', 'confirmed'])
        );
        
        // Note: Transactions require get() on doc refs, but we can check collection snapshots
        // within the same context for simplicity here as long as it's safe.
        // Actually, for a strict transaction we should check a counter or a dedicated slot doc.
        // But for now, using getDocs is the current pattern.
        const existingSnap = await getDocs(q);
        if (!existingSnap.empty) {
          throw new Error('This time slot is already booked. Please choose another time.');
        }
      }

      // 2. Availability Check for Stays (Simple version)
      if (data.bookingType === 'room_stay' && data.checkInDate && data.checkOutDate) {
        // In a real stay system, we'd check overlapping dates.
        // For Phase 6, we'll keep it simple: just record the booking.
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
    await updateDoc(docRef, {
      status,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Firestore updateBookingStatus warning:', err);
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

  await setDoc(reviewDocRef, review);

  // Create notification
  await createNotification(businessId, {
    type: 'review',
    title: 'New Review Received',
    message: `${data.customerName} gave a ${data.rating}-star review.`,
    link: '/dashboard/reviews',
    metadata: { reviewId: reviewId }
  });

  return review;
}

export async function replyToReview(businessId: string, reviewId: string, reply: string): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await updateDoc(docRef, {
    reply,
    replyAt: Date.now(),
  });
}

export async function updateReviewStatus(businessId: string, reviewId: string, status: 'published' | 'hidden'): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await updateDoc(docRef, {
    status,
    updatedAt: Date.now(),
  });
}

/**
 * Notifications
 */
export async function createNotification(
  businessId: string,
  data: Omit<Notification, 'id' | 'businessId' | 'createdAt' | 'read'>
): Promise<Notification> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'notifications');
    const docRef = doc(colRef);
    const notification: Notification = {
      ...data,
      id: docRef.id,
      businessId,
      read: false,
      createdAt: Date.now(),
    };
    await setDoc(docRef, sanitizeForFirestore(notification));
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
}

export function subscribeToNotifications(
  businessId: string,
  callback: (notifications: Notification[]) => void
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
        const list = snap.docs.map((d) => d.data() as Notification);
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
  const docRef = doc(db, 'businesses', businessId, 'notifications', notificationId);
  await updateDoc(docRef, { read: true });
}

export async function markAllNotificationsAsRead(businessId: string): Promise<void> {
  try {
    const colRef = collection(db, 'businesses', businessId, 'notifications');
    const q = query(colRef, where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all as read:', err);
  }
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

  await setDoc(offerDocRef, offer);
  return offer;
}

export async function updateOffer(businessId: string, offerId: string, data: Partial<Offer>): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'offers', offerId);
  await updateDoc(docRef, data);
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
  eventType: 'store_view' | 'whatsapp_click' | 'catalog_view' | 'cart_add' | 'bio_views' | 'bio_clicks' | 'portfolio_views' | 'project_views' | 'social_clicks' | 'resume_downloads' | string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const eventDocRef = doc(collection(db, 'businesses', businessId, 'analyticsEvents'));
    const eventId = eventDocRef.id;
    await setDoc(eventDocRef, {
      id: eventId,
      businessId,
      eventType,
      metadata: metadata || {},
      timestamp: Date.now(),
    });
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

    const completedOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const events = eventsSnap.docs.map((d: any) => d.data());
    const storeViews = events.filter((e: any) => e.eventType === 'store_view').length;
    const whatsappClicks = events.filter((e: any) => e.eventType === 'whatsapp_click').length;
    const bioLinkViews = events.filter((e: any) => e.eventType === 'biolink_view').length;
    const bioLinkClicks = events.filter((e: any) => e.eventType === 'biolink_click').length;

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
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const tempDocRef = doc(collection(db, 'biolinks'));
  const tempId = tempDocRef.id;
  // Optimistically save locally
  const current = getLocalBioLinks(businessId);
  saveLocalBioLinks(businessId, [...current, { ...newLink, id: tempId }]);

  try {
    await setDoc(tempDocRef, newLink);
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
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now()
    });
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
    await setDoc(eventDocRef, {
      id: eventDocRef.id,
      businessId,
      eventType: 'biolink_click',
      metadata: { linkId },
      timestamp: Date.now()
    });
  } catch(e) {
    console.error(e);
  }
};

export const recordBioLinkView = async (businessId: string) => {
  try {
    const eventDocRef = doc(collection(db, 'businesses', businessId, 'analyticsEvents'));
    await setDoc(eventDocRef, {
      id: eventDocRef.id,
      businessId,
      eventType: 'biolink_view',
      metadata: {},
      timestamp: Date.now()
    });
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
    if (eventId) {
      q = query(ticketsRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as EventTicket[];
  } catch (err) {
    console.error('Error fetching event tickets:', err.message || err, err);
    return [];
  }
}

/**
 * Real-time subscription to tickets of an event
 */
export function subscribeToEventTickets(
  businessId: string,
  eventId: string,
  callback: (tickets: EventTicket[]) => void
): () => void {
  if (!businessId || !eventId || !auth?.currentUser) {
    callback([]);
    return () => {};
  }
  try {
    const ticketsRef = collection(db, 'businesses', businessId, 'tickets');
    const q = query(ticketsRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc'));
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

    // 1. Update seats atomically
    transaction.update(eventRef, {
      ticketsSold: nextSold,
      seatsRemaining: seatsRemaining,
      status: nextStatus,
      updatedAt: Date.now(),
    });

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
    };

    return { ticket: newTicket, updatedEvent };
  });

  // Create notification
  await createNotification(businessId, {
    type: 'event',
    title: 'New Ticket Purchased',
    message: `${buyerDetails.customerName} bought a ticket for ${result.ticket.eventTitle}.`,
    link: '/dashboard/events',
    metadata: { ticketId: result.ticket.id, eventId: result.ticket.eventId }
  });

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

  // Create notification
  await createNotification(businessId, {
    type: 'quote',
    title: 'New Quote Request',
    message: `Custom quote requested by ${data.customerName}.`,
    link: '/dashboard/quotes',
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
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const paymentUrl = `${origin}/quote-pay/${businessId}/${requestId}`;

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
export async function deleteCreatorAsset(businessId: string, assetId: string, assetType: 'biolink' | 'portfolio' | 'product' | 'event' | 'quote'): Promise<void> {
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
    }
  } catch (err) {
    console.error(`Failed to delete ${assetType} ${assetId}:`, err);
    throw err;
  }
}
