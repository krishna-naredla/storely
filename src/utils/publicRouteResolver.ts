import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';
import { isCreatorModuleEnabled, isCreatorModulePublished } from './creatorModuleManager';

export type CanonicalPublicView =
  | 'store'
  | 'bio'
  | 'portfolio'
  | 'card'
  | 'quote_pay'
  | 'consultations'
  | 'events'
  | 'quotes'
  | 'reviews'
  | null;

export interface PublicRouteInfo {
  isPublicRoute: boolean;
  slug: string | null;
  explicitView: CanonicalPublicView;
  quotePayInfo: { businessId: string; requestId: string } | null;
  isExplicitPreview: boolean;
  canonicalPath: string | null;
  itemDeepLink: string | null;
  categoryDeepLink: string | null;
}

export const RESERVED_SYSTEM_PATHS = new Set([
  '',
  'login',
  'register',
  'dashboard',
  'admin',
  'api',
  'assets',
  'favicon.ico',
  'portfolio',
  'p',
  'store',
  'digital',
  'card',
  'quote-pay',
  'consult',
  'consultations',
  'book',
  'events',
  'event',
  'quote',
  'quotes',
  'reviews',
  'testimonials',
  'catalog',
  'categories',
  'orders',
  'bookings',
  'customers',
  'offers',
  'analytics',
  'modules',
  'payments',
  'notifications',
  'biolink',
  'share',
  'settings',
  'profile',
  'index.html',
  'vite.svg',
]);

/**
 * Parses current URL and extracts canonical public routing parameters.
 * Single source of truth for public routing resolution.
 */
export function resolvePublicRouteFromUrl(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '',
  search = typeof window !== 'undefined' ? window.location.search : ''
): PublicRouteInfo {
  const urlParams = new URLSearchParams(search);
  const previewParam = urlParams.get('preview') || urlParams.get('mode');
  const isExplicitPreview = previewParam === 'true' || previewParam === 'owner';
  const itemDeepLink = urlParams.get('item');
  const categoryDeepLink = urlParams.get('category');
  const queryView = urlParams.get('view') || urlParams.get('tab');

  // 1. Quote Payment Route: /quote-pay/:businessId/:requestId
  const quotePayMatch = pathname.match(/^\/quote-pay\/([^/?#]+)\/([^/?#]+)/i);
  if (quotePayMatch && quotePayMatch[1] && quotePayMatch[2]) {
    return {
      isPublicRoute: true,
      slug: null,
      explicitView: 'quote_pay',
      quotePayInfo: {
        businessId: decodeURIComponent(quotePayMatch[1]).trim(),
        requestId: decodeURIComponent(quotePayMatch[2]).trim(),
      },
      isExplicitPreview,
      canonicalPath: `/quote-pay/${quotePayMatch[1]}/${quotePayMatch[2]}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 2. Creator 1:1 Consultations Route: /consult/:slug, /consultations/:slug, /book/:slug
  const consultMatch = pathname.match(/^\/(?:consult|consultations|book)\/([^/?#]+)/i);
  if (consultMatch && consultMatch[1]) {
    const slug = decodeURIComponent(consultMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'consultations',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/consult/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 3. Creator Events Route: /events/:slug, /event/:slug
  const eventMatch = pathname.match(/^\/(?:events|event)\/([^/?#]+)/i);
  if (eventMatch && eventMatch[1]) {
    const slug = decodeURIComponent(eventMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'events',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/events/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 4. Creator Custom Quotes Route: /quote/:slug, /quotes/:slug
  const quoteReqMatch = pathname.match(/^\/(?:quote|quotes)\/([^/?#]+)/i);
  if (quoteReqMatch && quoteReqMatch[1]) {
    const slug = decodeURIComponent(quoteReqMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'quotes',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/quote/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 5. Creator Reviews Route: /reviews/:slug, /testimonials/:slug
  const reviewMatch = pathname.match(/^\/(?:reviews|testimonials)\/([^/?#]+)/i);
  if (reviewMatch && reviewMatch[1]) {
    const slug = decodeURIComponent(reviewMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'reviews',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/reviews/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 6. Creator Bio: /@:slug
  const bioMatch = pathname.match(/^\/@([^/?#]+)/i);
  if (bioMatch && bioMatch[1]) {
    const slug = decodeURIComponent(bioMatch[1]).trim();
    let explicitView: CanonicalPublicView = 'bio';
    if (queryView === 'store' || queryView === 'shop' || queryView === 'catalog' || queryView === 'digital') {
      explicitView = 'store';
    } else if (queryView === 'events' || queryView === 'event') {
      explicitView = 'events';
    } else if (queryView === 'consult' || queryView === 'consultations' || queryView === 'bookings') {
      explicitView = 'consultations';
    } else if (queryView === 'quote' || queryView === 'quotes') {
      explicitView = 'quotes';
    } else if (queryView === 'reviews' || queryView === 'testimonials') {
      explicitView = 'reviews';
    }

    return {
      isPublicRoute: true,
      slug,
      explicitView,
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: explicitView === 'bio' ? `/@${slug}` : `/@${slug}?view=${explicitView}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 7. Creator Portfolio: /portfolio/:slug or /p/:slug
  const portfolioMatch = pathname.match(/^\/(?:portfolio|p)\/([^/?#]+)/i);
  if (portfolioMatch && portfolioMatch[1]) {
    const slug = decodeURIComponent(portfolioMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'portfolio',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/portfolio/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 8. Creator Digital Store alias: /digital/:slug
  const digitalMatch = pathname.match(/^\/digital\/([^/?#]+)/i);
  if (digitalMatch && digitalMatch[1]) {
    const slug = decodeURIComponent(digitalMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'store',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/store/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 9. Vendor Storefront or Creator Digital Store: /store/:slug
  const storeMatch = pathname.match(/^\/store\/([^/?#]+)/i);
  if (storeMatch && storeMatch[1]) {
    const slug = decodeURIComponent(storeMatch[1]).trim();
    let explicitView: CanonicalPublicView = 'store';
    if (queryView === 'events' || queryView === 'event') {
      explicitView = 'events';
    } else if (queryView === 'consult' || queryView === 'consultations' || queryView === 'bookings') {
      explicitView = 'consultations';
    } else if (queryView === 'quote' || queryView === 'quotes') {
      explicitView = 'quotes';
    } else if (queryView === 'reviews' || queryView === 'testimonials') {
      explicitView = 'reviews';
    }

    return {
      isPublicRoute: true,
      slug,
      explicitView,
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/store/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 10. Trust Card Route: /card/:slug
  const cardMatch = pathname.match(/^\/card\/([^/?#]+)/i);
  if (cardMatch && cardMatch[1]) {
    const slug = decodeURIComponent(cardMatch[1]).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'card',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/card/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 11. Direct Root Handle Fallback: /:slug (excluding reserved system paths)
  const rawHandleMatch = pathname.match(/^\/([a-zA-Z0-9_.-]+)$/);
  if (rawHandleMatch && rawHandleMatch[1]) {
    const candidate = rawHandleMatch[1].toLowerCase();
    if (!RESERVED_SYSTEM_PATHS.has(candidate)) {
      const slug = decodeURIComponent(rawHandleMatch[1]).trim();
      let explicitView: CanonicalPublicView = null;
      if (queryView === 'events' || queryView === 'event') explicitView = 'events';
      else if (queryView === 'consult' || queryView === 'consultations' || queryView === 'bookings') explicitView = 'consultations';
      else if (queryView === 'quote' || queryView === 'quotes') explicitView = 'quotes';
      else if (queryView === 'reviews') explicitView = 'reviews';
      else if (queryView === 'bio') explicitView = 'bio';
      else if (queryView === 'portfolio') explicitView = 'portfolio';
      else if (queryView === 'store' || queryView === 'digital') explicitView = 'store';

      return {
        isPublicRoute: true,
        slug,
        explicitView,
        quotePayInfo: null,
        isExplicitPreview,
        canonicalPath: null,
        itemDeepLink,
        categoryDeepLink,
      };
    }
  }

  // 12. Query parameter fallbacks (e.g. ?store=..., ?bio=..., ?portfolio=..., ?consult=..., ?events=...)
  const queryStore = urlParams.get('store');
  if (queryStore && queryStore.trim()) {
    const slug = decodeURIComponent(queryStore).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'store',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/store/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryBio = urlParams.get('bio');
  if (queryBio && queryBio.trim()) {
    const slug = decodeURIComponent(queryBio).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'bio',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/@${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryPortfolio = urlParams.get('portfolio') || urlParams.get('p');
  if (queryPortfolio && queryPortfolio.trim()) {
    const slug = decodeURIComponent(queryPortfolio).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'portfolio',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/portfolio/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryConsult = urlParams.get('consult') || urlParams.get('consultations');
  if (queryConsult && queryConsult.trim()) {
    const slug = decodeURIComponent(queryConsult).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'consultations',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/consult/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryEvents = urlParams.get('events') || urlParams.get('event');
  if (queryEvents && queryEvents.trim()) {
    const slug = decodeURIComponent(queryEvents).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'events',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/events/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryQuote = urlParams.get('quote') || urlParams.get('quotes');
  if (queryQuote && queryQuote.trim()) {
    const slug = decodeURIComponent(queryQuote).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'quotes',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/quote/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryReviews = urlParams.get('reviews') || urlParams.get('testimonials');
  if (queryReviews && queryReviews.trim()) {
    const slug = decodeURIComponent(queryReviews).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'reviews',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/reviews/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  const queryCard = urlParams.get('card');
  if (queryCard && queryCard.trim()) {
    const slug = decodeURIComponent(queryCard).trim();
    return {
      isPublicRoute: true,
      slug,
      explicitView: 'card',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: `/card/${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // Non-public route (dashboard, admin, login, etc.)
  return {
    isPublicRoute: false,
    slug: null,
    explicitView: null,
    quotePayInfo: null,
    isExplicitPreview: false,
    canonicalPath: null,
    itemDeepLink: null,
    categoryDeepLink: null,
  };
}

/**
 * Resolves the target view mode and canonical URL path for a loaded business profile.
 * Respects explicit view requests and prevents silent unwanted fallbacks.
 */
export function resolveTargetViewForBusiness(
  route: PublicRouteInfo,
  business: BusinessProfile
): {
  targetView: 'store' | 'bio' | 'portfolio' | 'card' | 'consultations' | 'events' | 'quotes' | 'reviews';
  canonicalPath: string;
} {
  const isCreator = isCreatorProfile(business);
  const slug = business.slug || route.slug || business.id;

  // 1. Explicit module view requests:
  if (route.explicitView === 'consultations') {
    return { targetView: 'consultations', canonicalPath: `/consult/${slug}` };
  }
  if (route.explicitView === 'events') {
    return { targetView: 'events', canonicalPath: `/events/${slug}` };
  }
  if (route.explicitView === 'quotes') {
    return { targetView: 'quotes', canonicalPath: `/quote/${slug}` };
  }
  if (route.explicitView === 'reviews') {
    return { targetView: 'reviews', canonicalPath: `/reviews/${slug}` };
  }
  if (route.explicitView === 'bio') {
    return { targetView: 'bio', canonicalPath: `/@${slug}` };
  }
  if (route.explicitView === 'portfolio') {
    return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
  }
  if (route.explicitView === 'card') {
    return { targetView: 'card', canonicalPath: `/card/${slug}` };
  }
  if (route.explicitView === 'store') {
    // Creator smart resolution:
    // If a creator hasn't enabled the digital products module, gracefully route visitors
    // to their active creator experience (Portfolio, Bio Link, Consultations, Events, etc.)
    if (isCreator && !route.isExplicitPreview) {
      const hasDigitalStore = isCreatorModuleEnabled(business, 'digital_products');
      if (!hasDigitalStore) {
        if (isCreatorModuleEnabled(business, 'portfolio')) {
          return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
        }
        if (isCreatorModuleEnabled(business, 'universal_links')) {
          return { targetView: 'bio', canonicalPath: `/@${slug}` };
        }
        if (isCreatorModuleEnabled(business, 'booking_appointments')) {
          return { targetView: 'consultations', canonicalPath: `/consult/${slug}` };
        }
        if (isCreatorModuleEnabled(business, 'events_tickets')) {
          return { targetView: 'events', canonicalPath: `/events/${slug}` };
        }
        if (isCreatorModuleEnabled(business, 'custom_quotes')) {
          return { targetView: 'quotes', canonicalPath: `/quote/${slug}` };
        }
        if (isCreatorModuleEnabled(business, 'reviews')) {
          return { targetView: 'reviews', canonicalPath: `/reviews/${slug}` };
        }
      }
    }
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }

  // 2. Handle Root Handle /{slug} (no explicit view specified in path):
  if (!isCreator) {
    // Vendors canonical route is /store/{slug}
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }

  // For Creators, root handle resolves according to their configured primary destination:
  const preferred = business.primaryDestination;
  if (preferred === 'biolink') {
    return { targetView: 'bio', canonicalPath: `/@${slug}` };
  }
  if (preferred === 'portfolio') {
    return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
  }
  if (preferred === 'store') {
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }
  if (preferred === 'consultations') {
    return { targetView: 'consultations', canonicalPath: `/consult/${slug}` };
  }
  if (preferred === 'events') {
    return { targetView: 'events', canonicalPath: `/events/${slug}` };
  }
  if (preferred === 'quotes') {
    return { targetView: 'quotes', canonicalPath: `/quote/${slug}` };
  }

  // Default creator fallback priority if preferred is not set:
  if (isCreatorModuleEnabled(business, 'portfolio')) {
    return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
  }
  if (isCreatorModuleEnabled(business, 'universal_links')) {
    return { targetView: 'bio', canonicalPath: `/@${slug}` };
  }
  if (isCreatorModuleEnabled(business, 'digital_products')) {
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }
  if (isCreatorModuleEnabled(business, 'events_tickets')) {
    return { targetView: 'events', canonicalPath: `/events/${slug}` };
  }
  if (isCreatorModuleEnabled(business, 'booking_appointments')) {
    return { targetView: 'consultations', canonicalPath: `/consult/${slug}` };
  }

  return { targetView: 'bio', canonicalPath: `/@${slug}` };
}

export interface ModuleStatusResult {
  isAvailable: boolean;
  title: string;
  message: string;
}

/**
 * Checks whether the target module is published/enabled for public viewing.
 * Returns clean unavailable information when disabled, preventing silent fallbacks.
 */
export function verifyModuleAvailability(
  business: BusinessProfile,
  targetView: CanonicalPublicView,
  isExplicitOwnerPreview: boolean
): ModuleStatusResult {
  const isCreator = isCreatorProfile(business);
  const modules = business.modules || {};

  // 1. Account status checks
  if (business.status === 'deleted' || business.status === 'suspended') {
    const typeLabel =
      targetView === 'bio'
        ? 'Bio Link'
        : targetView === 'portfolio'
        ? 'Portfolio'
        : targetView === 'card'
        ? 'Visiting Card'
        : targetView === 'consultations'
        ? 'Consultations'
        : targetView === 'events'
        ? 'Events'
        : targetView === 'quotes'
        ? 'Quotes'
        : 'Store';
    return {
      isAvailable: false,
      title: business.status === 'suspended' ? `${typeLabel} Suspended` : `${typeLabel} Inactive`,
      message:
        business.status === 'suspended'
          ? `This ${typeLabel.toLowerCase()} has been suspended by the platform administrator.`
          : `This ${typeLabel.toLowerCase()} is currently inactive.`,
    };
  }

  // 2. Store maintenance mode
  if (business.maintenanceMode || business.status === 'maintenance') {
    return {
      isAvailable: false,
      title: 'Store Under Maintenance',
      message:
        business.maintenanceMessage ||
        'We are currently offline for scheduled maintenance. Please check back shortly!',
    };
  }

  // 3. Draft status (only bypassed if explicit owner preview)
  if (!isExplicitOwnerPreview && (business.publicProfileStatus === 'draft' || business.status === 'draft')) {
    return {
      isAvailable: false,
      title: 'Coming Soon',
      message: 'This profile is currently in draft mode and has not yet been published.',
    };
  }

  // 4. View-specific module checks
  switch (targetView) {
    case 'bio': {
      const isEnabled = isCreatorModuleEnabled(business, 'universal_links');
      const isPublished = isCreatorModulePublished(business, 'universal_links');
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Universal Bio Link Inactive' : 'Universal Bio Link Unpublished',
        message: !isEnabled
          ? `The bio link profile for ${business.name} is currently disabled.`
          : `The bio link profile for ${business.name} has not yet been published.`,
      };
    }

    case 'portfolio': {
      const isEnabled = isCreatorModuleEnabled(business, 'portfolio');
      const isPublished = isCreatorModulePublished(business, 'portfolio');
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Portfolio Showcase Inactive' : 'Portfolio Showcase Unpublished',
        message: !isEnabled
          ? `The portfolio showcase for ${business.name} is currently disabled.`
          : `The portfolio showcase for ${business.name} has not yet been published.`,
      };
    }

    case 'consultations': {
      const isEnabled = isCreator
        ? isCreatorModuleEnabled(business, 'booking_appointments')
        : Boolean(modules.booking_appointments);
      const isPublished = isCreator
        ? isCreatorModulePublished(business, 'booking_appointments')
        : isEnabled;
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Consultations Inactive' : 'Consultations Unpublished',
        message: !isEnabled
          ? `1:1 consultations for ${business.name} are currently not active.`
          : `1:1 consultations for ${business.name} have not yet been published.`,
      };
    }

    case 'events': {
      const isEnabled = isCreator
        ? isCreatorModuleEnabled(business, 'events_tickets')
        : Boolean(modules.events_tickets || modules.events_ticketing);
      const isPublished = isCreator
        ? isCreatorModulePublished(business, 'events_tickets')
        : isEnabled;
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Events & Workshops Inactive' : 'Events & Workshops Unpublished',
        message: !isEnabled
          ? `Events and workshops for ${business.name} are currently not active.`
          : `Events and workshops for ${business.name} have not yet been published.`,
      };
    }

    case 'quotes': {
      const isEnabled = isCreator
        ? isCreatorModuleEnabled(business, 'custom_quotes')
        : Boolean(modules.custom_quotes);
      const isPublished = isCreator
        ? isCreatorModulePublished(business, 'custom_quotes')
        : isEnabled;
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Custom Quotes Inactive' : 'Custom Quotes Unpublished',
        message: !isEnabled
          ? `Custom project quotes for ${business.name} are currently not accepting inquiries.`
          : `Custom project quotes for ${business.name} have not yet been published.`,
      };
    }

    case 'reviews': {
      const isEnabled = isCreator
        ? isCreatorModuleEnabled(business, 'reviews')
        : modules.reviews !== false;
      const isPublished = isCreator
        ? isCreatorModulePublished(business, 'reviews')
        : isEnabled;
      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled ? 'Reviews Inactive' : 'Reviews Unpublished',
        message: !isEnabled
          ? `Customer reviews for ${business.name} are currently inactive.`
          : `Customer reviews for ${business.name} are not currently published.`,
      };
    }

    case 'card': {
      const isEnabled = business.trustCardSettings?.enabled !== false;
      return {
        isAvailable: isEnabled || isExplicitOwnerPreview,
        title: 'Visiting Card Unavailable',
        message: `The digital trust card for ${business.name} is not currently active.`,
      };
    }

    case 'store':
    default: {
      let isEnabled = false;
      let isPublished = false;
      if (isCreator) {
        isEnabled = isCreatorModuleEnabled(business, 'digital_products');
        isPublished = isCreatorModulePublished(business, 'digital_products');
      } else {
        isEnabled =
          !business.modules ||
          Boolean(
            modules.products ||
              modules.services ||
              modules.menu ||
              modules.rooms ||
              modules.vehicles ||
              modules.cart_ordering ||
              modules.table_delivery ||
              modules.inquiries ||
              modules.catalog ||
              modules.booking_appointments ||
              modules.custom_quotes ||
              modules.events_tickets
          );
        isPublished = isEnabled;
      }

      return {
        isAvailable: (isEnabled && isPublished) || isExplicitOwnerPreview,
        title: !isEnabled
          ? isCreator ? 'Digital Store Inactive' : 'Storefront Inactive'
          : isCreator ? 'Digital Store Unpublished' : 'Storefront Unpublished',
        message: !isEnabled
          ? (isCreator ? `The digital store for ${business.name} has not been enabled.` : `The storefront for ${business.name} is currently unavailable or disabled.`)
          : (isCreator ? `The digital store for ${business.name} is currently in draft mode.` : `The storefront for ${business.name} is currently unpublished.`),
      };
    }
  }
}
