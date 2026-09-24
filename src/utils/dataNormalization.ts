import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';

export function normalizeBusinessData(business?: BusinessProfile | null): BusinessProfile | null {
  if (!business) return null;

  const isCreator = isCreatorProfile(business);
  const defaultModules = isCreator
    ? {
        work_portfolio: true,
        universal_links: true,
        digital_products: false,
        booking_appointments: false,
        custom_quotes: false,
        events_tickets: false,
        reviews: true,
      }
    : {
        products: true,
        cart_ordering: true,
        booking_appointments: false,
        reviews: true,
        offers: false,
      };

  return {
    ...business,
    name: business.name || 'Untitled Store',
    slug: business.slug || business.id || 'store',
    currency: business.currency || 'USD',
    currencySymbol: business.currencySymbol || '$',
    deliveryAvailable: business.deliveryAvailable ?? !isCreator,
    // Preserve saved module settings exactly as saved! Never auto-enable all modules.
    modules: business.modules && Object.keys(business.modules).length > 0
      ? { ...business.modules }
      : defaultModules,
    themeColor: business.themeColor || 'indigo',
  };
}

