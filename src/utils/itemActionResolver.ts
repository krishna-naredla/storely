import { CatalogItem } from '../types';

export type CanonicalItemAction =
  | 'add_to_cart'      // physical product, food/menu item
  | 'digital_purchase' // digital_file (Digital Purchase/Access, NEVER physical cart)
  | 'booking'          // consultation_slot (Booking), service (Booking/Inquiry)
  | 'stay_booking'     // room/stay (Stay Booking)
  | 'rental_booking';  // vehicle (Rental Booking)

export interface ItemActionResult {
  action: CanonicalItemAction;
  isCartable: boolean;
  isDigital: boolean;
  isBooking: boolean;
  isStay: boolean;
  isRental: boolean;
  isConsultation: boolean;
  isService: boolean;
  label: string;
  buttonText: string;
}

/**
 * Authoritative Canonical Action Resolver for Catalog Items.
 * 
 * Rules:
 * - physical product → Add to Cart
 * - food/menu item → Add to Cart
 * - digital_file → Digital Purchase/Access, NEVER physical cart
 * - consultation_slot → Booking
 * - service → Booking/Inquiry according to existing module
 * - room/stay → Stay Booking
 * - vehicle → Rental Booking
 */
export function resolveItemAction(item: CatalogItem | null | undefined): ItemActionResult {
  if (!item) {
    return {
      action: 'add_to_cart',
      isCartable: false,
      isDigital: false,
      isBooking: false,
      isStay: false,
      isRental: false,
      isConsultation: false,
      isService: false,
      label: 'Unavailable',
      buttonText: 'Unavailable',
    };
  }

  // 1. Digital File Check:
  // - item.productType === 'digital_file'
  // - OR course type
  // - OR has digital file url / files (and not explicitly physical)
  const isDigital =
    item.productType === 'digital_file' ||
    (item.productType !== 'physical' && (
      item.type === 'course' ||
      Boolean(item.digitalFileUrl && item.digitalFileUrl.trim().length > 0) ||
      Boolean(item.digitalFiles && item.digitalFiles.length > 0)
    ));

  if (isDigital) {
    const isFree = item.isFree || item.price === 0;
    return {
      action: 'digital_purchase',
      isCartable: false, // NEVER physical cart
      isDigital: true,
      isBooking: false,
      isStay: false,
      isRental: false,
      isConsultation: false,
      isService: false,
      label: isFree ? 'Get Access' : 'Purchase Access',
      buttonText: isFree ? 'Get Access' : 'Purchase',
    };
  }

  // 2. Consultation Slot Check:
  if (item.productType === 'consultation_slot') {
    return {
      action: 'booking',
      isCartable: false, // NEVER physical cart
      isDigital: false,
      isBooking: true,
      isStay: false,
      isRental: false,
      isConsultation: true,
      isService: false,
      label: 'Book Consultation',
      buttonText: 'Book',
    };
  }

  // 3. Room / Stay Check:
  if (item.type === 'room' || item.type === 'room_stay' || item.type === 'property') {
    return {
      action: 'stay_booking',
      isCartable: false, // NEVER physical cart
      isDigital: false,
      isBooking: true,
      isStay: true,
      isRental: false,
      isConsultation: false,
      isService: false,
      label: 'Book Stay',
      buttonText: 'Book',
    };
  }

  // 4. Vehicle / Rental Check:
  if (item.type === 'vehicle' || item.type === 'rental_vehicle') {
    return {
      action: 'rental_booking',
      isCartable: false, // NEVER physical cart
      isDigital: false,
      isBooking: true,
      isStay: false,
      isRental: true,
      isConsultation: false,
      isService: false,
      label: 'Book Rental',
      buttonText: 'Book',
    };
  }

  // 5. Service / Package Check:
  if (item.type === 'service' || item.type === 'package') {
    return {
      action: 'booking',
      isCartable: false, // NEVER physical cart
      isDigital: false,
      isBooking: true,
      isStay: false,
      isRental: false,
      isConsultation: false,
      isService: true,
      label: 'Book Service',
      buttonText: 'Book',
    };
  }

  // 6. Food / Menu Item Check:
  if (item.type === 'menu_item') {
    return {
      action: 'add_to_cart',
      isCartable: true,
      isDigital: false,
      isBooking: false,
      isStay: false,
      isRental: false,
      isConsultation: false,
      isService: false,
      label: 'Add to Cart',
      buttonText: 'Add to Cart',
    };
  }

  // 7. Physical Product Check (Default for physical goods, groceries, curd, milk, rice, etc.):
  return {
    action: 'add_to_cart',
    isCartable: true,
    isDigital: false,
    isBooking: false,
    isStay: false,
    isRental: false,
    isConsultation: false,
    isService: false,
    label: 'Add to Cart',
    buttonText: 'Add to Cart',
  };
}

/**
 * Returns true if an item is eligible for physical cart ordering.
 * Cart strictly rejects digital products, consultations, rooms, vehicles, and services.
 */
export function isCartableItem(item: CatalogItem | null | undefined): boolean {
  return resolveItemAction(item).isCartable;
}

/**
 * Generates an authoritative unique cart item ID respecting businessId + productId + variantId (+ optional addon key).
 */
export function getCartItemId(
  businessId: string,
  productId: string,
  variantId?: string,
  addonKey?: string
): string {
  const vId = variantId && variantId.trim().length > 0 ? variantId : 'default';
  const aKey = addonKey && addonKey.trim().length > 0 ? `_${addonKey}` : '';
  return `${businessId}_${productId}_${vId}${aKey}`;
}
