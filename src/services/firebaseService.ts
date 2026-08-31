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
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { deleteImageFromStorage } from './cloudinary';
import {
  BusinessProfile,
  Category,
  CatalogItem,
  Order,
  Booking,
  Customer,
  Review,
  Offer,
  AnalyticsSummary,
  OrderStatus,
  BookingStatus,
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

/**
 * Get dynamic, accurate storefront URL for any environment
 */
export function getStorefrontUrl(slug: string): string {
  if (typeof window === 'undefined') return `/store/${slug}`;
  const origin = window.location.origin;
  return `${origin}/store/${encodeURIComponent(slug)}`;
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

  const businessId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const slug = data.slug || generateSlug(data.name);

  const business: BusinessProfile = {
    ...data,
    id: businessId,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  // Always save locally first for instant, guaranteed resilience
  saveLocalBusiness(business);

  try {
    const sanitized = sanitizeForFirestore(business);
    const docRef = doc(db, 'businesses', businessId);
    await setDoc(docRef, sanitized);
  } catch (err) {
    console.warn('Firestore write warning for createBusiness, preserved in local cache:', err);
  }

  return business;
}

export async function getBusinessById(businessId: string): Promise<BusinessProfile | null> {
  try {
    const docRef = doc(db, 'businesses', businessId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Error fetching business by ID from Firestore, checking local cache:', err);
  }

  // Fallback to local cache
  const localList = getLocalBusinesses();
  return localList.find((b) => b.id === businessId) || null;
}

export async function forceSyncLocalToFirestore() {
  const localList = getLocalBusinesses();
  for (const lb of localList) {
     if (lb && lb.id) {
       try {
         const docRef = doc(db, 'businesses', lb.id);
         setDoc(docRef, sanitizeForFirestore(lb), { merge: true }).catch(() => {});
       } catch (e) {}
     }
  }
}

export async function getBusinessBySlug(rawSlug: string): Promise<BusinessProfile | null> {
  if (!rawSlug) return null;
  if (await isSlugBlocked(rawSlug)) {
    console.warn('Blocked slug access attempt:', rawSlug);
    return null;
  }

  // Always attempt a quick background sync when looking up a store
  // in case the creator is viewing their own store link right after creation
  forceSyncLocalToFirestore();

  if (!rawSlug) return null;
  const slug = rawSlug.trim();
  const lowerSlug = slug.toLowerCase();

  // 1. Try exact slug in Firestore
  try {
    const q = query(collection(db, 'businesses'), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data() as BusinessProfile;
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
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore fallback scan warning:', err);
  }

  // 5. Fallback to local storage cache
  const localList = getLocalBusinesses();
  return (
    localList.find(
      (b) =>
        b.slug?.toLowerCase() === lowerSlug ||
        generateSlug(b.name || '') === lowerSlug ||
        b.id === slug
    ) || null
  );
}

export async function getUserBusinesses(ownerId: string): Promise<BusinessProfile[]> {
  let list: BusinessProfile[] = [];
  try {
    const q = query(
      collection(db, 'businesses'),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    list = snap.docs.map((d) => d.data() as BusinessProfile);
  } catch (err) {
    try {
      const qFallback = query(collection(db, 'businesses'), where('ownerId', '==', ownerId));
      const snap = await getDocs(qFallback);
      list = snap.docs.map((d) => d.data() as BusinessProfile);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.warn('Error getting user businesses from Firestore:', e);
    }
  }

  // Merge with local businesses
  const localList = getLocalBusinesses().filter((b) => b.ownerId === ownerId || ownerId === 'guest_user');
  const combinedMap = new Map<string, BusinessProfile>();
  localList.forEach((b) => combinedMap.set(b.id, b));
  list.forEach((b) => combinedMap.set(b.id, b));

  const result = Array.from(combinedMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  result.forEach((b) => saveLocalBusiness(b));
  return result;
}

export async function updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<void> {
  const updatedData = {
    ...data,
    updatedAt: Date.now(),
  };

  // Update local cache
  const localList = getLocalBusinesses();
  const existing = localList.find((b) => b.id === businessId);
  
  let dataToWrite = updatedData;
  if (existing) {
    const fullUpdated = { ...existing, ...updatedData };
    saveLocalBusiness(fullUpdated);
    dataToWrite = fullUpdated; // Upload full document in case it's missing in Firestore
  }

  try {
    const sanitized = sanitizeForFirestore(dataToWrite);
    const docRef = doc(db, 'businesses', businessId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore updateBusiness warning, preserved in local cache:', err);
  }
}

export const updateBusinessProfile = updateBusiness;

export async function deleteBusiness(businessId: string): Promise<void> {
  removeLocalBusiness(businessId);
  try {
    const docRef = doc(db, 'businesses', businessId);
    await deleteDoc(docRef);
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
  const catId = 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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
    const docRef = doc(db, 'businesses', businessId, 'categories', catId);
    await setDoc(docRef, sanitized);
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
  const itemId = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = Date.now();
  const item: CatalogItem = {
    ...data,
    id: itemId,
    businessId,
    slug: data.slug || generateSlug(data.name),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const sanitized = sanitizeForFirestore(item);
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    await setDoc(docRef, sanitized);
  } catch (err) {
    console.warn('Firestore createCatalogItem warning:', err);
  }
  return item;
}

export async function updateCatalogItem(businessId: string, itemId: string, data: Partial<CatalogItem>): Promise<void> {
  try {
    const sanitized = sanitizeForFirestore({
      ...data,
      updatedAt: Date.now(),
    });
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore updateCatalogItem warning:', err);
  }
}

export async function deleteCatalogItem(businessId: string, itemId: string): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'catalog', itemId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteCatalogItem warning:', err);
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
  const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
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
    const sanitized = sanitizeForFirestore(order);
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
    await setDoc(docRef, sanitized);

    // Automatically update or create customer record
    await upsertCustomerFromOrder(businessId, order);

    // Decrement inventory stock if tracking enabled
    for (const item of order.items) {
      try {
        const itemRef = doc(db, 'businesses', businessId, 'catalog', item.itemId);
        const snap = await getDoc(itemRef);
        if (snap.exists()) {
          const itemData = snap.data() as CatalogItem;
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
        console.warn('Inventory decrement note:', e);
      }
    }
  } catch (err) {
    console.warn('Firestore createOrder warning:', err);
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

export function subscribeToOrders(businessId: string, callback: (orders: Order[]) => void): () => void {
  const colRef = collection(db, 'businesses', businessId, 'orders');
  const q = query(colRef, where('businessId', '==', businessId));
  
  const unsubscribe = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => d.data() as Order);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to orders:', err);
  });
  
  return unsubscribe;
}

export async function updateOrderStatus(businessId: string, orderId: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, 'businesses', businessId, 'orders', orderId);
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
  const bookingId = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const bookingNumber = 'BK-' + Math.floor(100000 + Math.random() * 900000);
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
    const sanitized = sanitizeForFirestore(booking);
    const docRef = doc(db, 'businesses', businessId, 'bookings', bookingId);
    await setDoc(docRef, sanitized);

    // Automatically update/create customer
    await upsertCustomerFromBooking(businessId, booking);
  } catch (err) {
    console.warn('Firestore createBooking warning:', err);
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
  const colRef = collection(db, 'businesses', businessId, 'bookings');
  const q = query(colRef, where('businessId', '==', businessId));
  
  const unsubscribe = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => d.data() as Booking);
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to bookings:', err);
  });
  
  return unsubscribe;
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
  const reviewId = 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const review: Review = {
    ...data,
    id: reviewId,
    businessId,
    createdAt: Date.now(),
  };

  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await setDoc(docRef, review);
  return review;
}

export async function replyToReview(businessId: string, reviewId: string, reply: string): Promise<void> {
  const docRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  await updateDoc(docRef, {
    reply,
    replyAt: Date.now(),
  });
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
  const offerId = 'off_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const offer: Offer = {
    ...data,
    id: offerId,
    businessId,
    createdAt: Date.now(),
  };

  const docRef = doc(db, 'businesses', businessId, 'offers', offerId);
  await setDoc(docRef, offer);
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
  eventType: 'store_view' | 'whatsapp_click' | 'catalog_view' | 'cart_add',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const docRef = doc(db, 'businesses', businessId, 'analyticsEvents', eventId);
    await setDoc(docRef, {
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

    // 6. Finally delete business doc & local storage
    await deleteBusiness(businessId);
  } catch (err) {
    console.error('Error permanently deleting store account:', err);
    throw err;
  }
}

// BIO LINKS
export const getBioLinks = async (businessId: string) => {
  try {
    const q = query(
      collection(db, 'biolinks'),
      where('businessId', '==', businessId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching bio links:", error);
    return [];
  }
};

export const createBioLink = async (businessId: string, data: any) => {
  const docRef = await addDoc(collection(db, 'biolinks'), {
    businessId,
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return docRef.id;
};

export const updateBioLink = async (linkId: string, data: any) => {
  const docRef = doc(db, 'biolinks', linkId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
};

export const deleteBioLink = async (linkId: string) => {
  const docRef = doc(db, 'biolinks', linkId);
  await deleteDoc(docRef);
};

export const updateBioLinksOrder = async (links: any[]) => {
  const batch = writeBatch(db);
  links.forEach((link, index) => {
    const ref = doc(db, 'biolinks', link.id);
    batch.update(ref, { order: index, updatedAt: Date.now() });
  });
  await batch.commit();
};

export const recordBioLinkClick = async (linkId: string) => {
  // Add a click analytics document
  try {
    await addDoc(collection(db, 'analytics'), {
      type: 'biolink_click',
      linkId,
      timestamp: Date.now()
    });
  } catch(e) {
    console.error(e);
  }
};
