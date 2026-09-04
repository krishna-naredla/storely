import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
import { db, storage } from '../config/firebase';
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

/**
 * Get dynamic, accurate storefront URL for any environment
 */
export function getStorefrontUrl(businessOrSlug: any): string {
  const slug = typeof businessOrSlug === 'string' ? businessOrSlug : businessOrSlug?.slug || '';
  const isCreator = typeof businessOrSlug === 'object' && businessOrSlug?.modules?.universal_links;
  
  if (typeof window === 'undefined') return isCreator ? `/@${slug}` : `/store/${slug}`;
  const origin = window.location.origin;
  return `${origin}${isCreator ? '/@' : '/store/'}${encodeURIComponent(slug)}`;
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

export const recordBioLinkClick = async (businessId: string, linkId: string) => {
  try {
    await addDoc(collection(db, 'businesses', businessId, 'analyticsEvents'), {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
    await addDoc(collection(db, 'businesses', businessId, 'analyticsEvents'), {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
    let q = query(portfolioRef, orderBy('order', 'asc'));

    if (activeOnly) {
      q = query(portfolioRef, where('isActive', '==', true), orderBy('order', 'asc'));
    }

    const snap = await getDocs(q);
    const items: PortfolioItem[] = [];
    snap.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        businessId,
        ...docSnap.data(),
      } as PortfolioItem);
    });

    // Client-side fallback sort if orderBy didn't apply
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching portfolio items:', err);
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
    let q = query(testimonialsRef, orderBy('order', 'asc'));

    if (activeOnly) {
      q = query(testimonialsRef, where('isActive', '==', true), orderBy('order', 'asc'));
    }

    const snap = await getDocs(q);
    const testimonials: Testimonial[] = [];
    snap.forEach((docSnap) => {
      testimonials.push({
        id: docSnap.id,
        businessId,
        ...docSnap.data(),
      } as Testimonial);
    });

    return testimonials.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching testimonials:', err);
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
  await updateDoc(bizRef, {
    portfolioSettings: cleanSettings,
    updatedAt: Date.now(),
  });
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
      console.error('Error in subscribeToEvents:', err);
      callback([]);
    }
  );
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
    console.error('Error fetching event tickets:', err);
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
      console.error('Error in subscribeToEventTickets:', err);
      callback([]);
    }
  );
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

  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketCode = `TKT-${Date.now().toString(36).toUpperCase().slice(-4)}-${randomCode}`;

  return await runTransaction(db, async (transaction) => {
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
      console.error('Error in subscribeToCustomQuoteRequests:', err);
      callback([]);
    }
  );
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

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const requestNumber = `REQ-${randomNum}`;

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
 * Securely uploads a file (PDF, Image, etc.) to Firebase Storage and returns the public download URL.
 * Automatically handles MIME types.
 */
export const uploadFileToStorage = (file: File, pathFolder: string = 'uploads', onProgress?: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storageRef = ref(storage, `${pathFolder}/${fileName}`);

    const metadata = {
      contentType: file.type || 'application/octet-stream',
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
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
