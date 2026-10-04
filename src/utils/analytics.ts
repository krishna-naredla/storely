import { CanonicalAnalyticsEventType } from '../types';
import { recordAnalyticsEvent } from '../services/firebaseService';

/**
 * Single Authoritative Canonical Event Taxonomy
 */
export const CANONICAL_EVENTS: Record<CanonicalAnalyticsEventType, string> = {
  profile_view: 'Profile View',
  module_click: 'Module Outbound / Tab Click',
  conversion: 'Module Goal Conversion',
  bio_view: 'Bio Link View',
  bio_click: 'Bio Link Click',
  portfolio_view: 'Portfolio View',
  project_view: 'Project View',
  digital_product_view: 'Digital Product View',
  digital_purchase: 'Digital Product Purchase',
  digital_download: 'Digital Asset Download',
  consultation_view: 'Consultation Page View',
  consultation_booking: '1:1 Consultation Booking',
  event_view: 'Event View',
  event_registration: 'Event Free Registration',
  event_ticket_purchase: 'Event Ticket Purchase',
  quote_view: 'Quote Intake View',
  quote_request: 'Custom Quote Request',
  quote_paid: 'Quote Payment Completed',
  review_view: 'Reviews Hub View',
  review_submitted: 'Review Submitted',
  affiliate_impression: 'Affiliate Products View',
  affiliate_click: 'Affiliate Outbound Click',
  whatsapp_click: 'WhatsApp Direct Chat',
  share: 'Public URL Shared',
  qr_scan: 'QR Code Scanned',
  store_view: 'Storefront View',
  cart_add: 'Item Added to Cart',
};

/**
 * Standardized client-side event tracking helper with deduplication and metadata
 */
export async function trackEvent(
  businessId: string,
  eventType: CanonicalAnalyticsEventType,
  metadata: Record<string, any> = {}
): Promise<void> {
  if (!businessId) return;

  try {
    // Enrich with client context
    const enrichedMetadata = {
      ...metadata,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    await recordAnalyticsEvent(businessId, eventType, enrichedMetadata);
  } catch (err) {
    // Non-blocking telemetry
    console.debug('Analytics telemetry notice:', err);
  }
}
