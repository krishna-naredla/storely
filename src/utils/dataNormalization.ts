import { BusinessProfile } from '../types';

export function normalizeBusinessData(business?: BusinessProfile | null): BusinessProfile | null {
  if (!business) return null;

  return {
    ...business,
    name: business.name || 'Untitled Store',
    slug: business.slug || business.id || 'store',
    currency: business.currency || 'USD',
    currencySymbol: business.currencySymbol || '$',
    deliveryAvailable: business.deliveryAvailable ?? true,
    modules: {
      products: true,
      services: true,
      menu: true,
      catalog: true,
      cart_ordering: true,
      digital_products: true,
      universal_links: true,
      work_portfolio: true,
      booking_appointments: true,
      custom_quotes: true,
      events_tickets: true,
      reviews: true,
      offers: true,
      ...(business.modules || {}),
    },
    themeColor: business.themeColor || 'indigo',
  };
}
