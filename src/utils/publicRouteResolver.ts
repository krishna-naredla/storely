import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';

export type CanonicalPublicView = 'store' | 'bio' | 'portfolio' | 'card' | 'quote_pay' | null;

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
  'store',
  'p',
  'card',
  'quote-pay',
  'catalog',
  'events',
  'quotes',
  'categories',
  'orders',
  'bookings',
  'customers',
  'reviews',
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

  // 1. Quote Payment Route: /quote-pay/:businessId/:requestId
  const quoteMatch = pathname.match(/^\/quote-pay\/([^/?#]+)\/([^/?#]+)/i);
  if (quoteMatch && quoteMatch[1] && quoteMatch[2]) {
    return {
      isPublicRoute: true,
      slug: null,
      explicitView: 'quote_pay',
      quotePayInfo: {
        businessId: decodeURIComponent(quoteMatch[1]).trim(),
        requestId: decodeURIComponent(quoteMatch[2]).trim(),
      },
      isExplicitPreview,
      canonicalPath: `/quote-pay/${quoteMatch[1]}/${quoteMatch[2]}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 2. Creator Bio Store Route: /@:slug/store (alias for Creator Digital Store)
  const bioStoreMatch = pathname.match(/^\/@([^/?#]+)\/(store|shop|products|catalog)/i);
  if (bioStoreMatch && bioStoreMatch[1]) {
    const slug = decodeURIComponent(bioStoreMatch[1]).trim();
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

  // 3. Creator Bio: /@:slug
  const bioMatch = pathname.match(/^\/@([^/?#]+)/i);
  if (bioMatch && bioMatch[1]) {
    const slug = decodeURIComponent(bioMatch[1]).trim();
    const isStoreView = urlParams.get('view') === 'store' || urlParams.get('tab') === 'store';
    return {
      isPublicRoute: true,
      slug,
      explicitView: isStoreView ? 'store' : 'bio',
      quotePayInfo: null,
      isExplicitPreview,
      canonicalPath: isStoreView ? `/store/${slug}` : `/@${slug}`,
      itemDeepLink,
      categoryDeepLink,
    };
  }

  // 4. Creator Portfolio: /portfolio/:slug or /p/:slug
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

  // 5. Vendor Storefront or Creator Digital Store: /store/:slug
  const storeMatch = pathname.match(/^\/store\/([^/?#]+)/i);
  if (storeMatch && storeMatch[1]) {
    const slug = decodeURIComponent(storeMatch[1]).trim();
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

  // 6. Trust Card Route: /card/:slug
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

  // 7. Direct Root Handle Fallback: /:slug (excluding reserved system paths)
  const rawHandleMatch = pathname.match(/^\/([a-zA-Z0-9_.-]+)$/);
  if (rawHandleMatch && rawHandleMatch[1]) {
    const candidate = rawHandleMatch[1].toLowerCase();
    if (!RESERVED_SYSTEM_PATHS.has(candidate)) {
      const slug = decodeURIComponent(rawHandleMatch[1]).trim();
      return {
        isPublicRoute: true,
        slug,
        explicitView: null, // Resolves according to business type/preferences once business loads
        quotePayInfo: null,
        isExplicitPreview,
        canonicalPath: null,
        itemDeepLink,
        categoryDeepLink,
      };
    }
  }

  // 8. Query parameter fallbacks (e.g. ?store=..., ?bio=..., ?portfolio=...)
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

  // Non-public route (e.g. dashboard, login, admin, etc.)
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
  targetView: 'store' | 'bio' | 'portfolio' | 'card';
  canonicalPath: string;
} {
  const isCreator = isCreatorProfile(business);
  const slug = business.slug || route.slug || business.id;

  // If user requested an explicit view (e.g. /store/:slug, /@:slug, /portfolio/:slug, /card/:slug):
  // Directly honor that explicit view. Do NOT silently change to another view!
  if (route.explicitView === 'store') {
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
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

  // Handle Root Handle /{slug} (no explicit view specified in path):
  if (!isCreator) {
    // Vendors canonical route is /store/{slug}
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }

  // For Creators, root handle resolves to their configured primary destination:
  const preferred = business.primaryDestination;
  if (preferred === 'biolink') {
    return { targetView: 'bio', canonicalPath: `/@${slug}` };
  }
  if (preferred === 'store') {
    return { targetView: 'store', canonicalPath: `/store/${slug}` };
  }
  if (preferred === 'portfolio') {
    return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
  }

  // Default creator preference if not set: portfolio -> bio -> store
  const modules = business.modules || {};
  if (modules.work_portfolio || modules.portfolio) {
    return { targetView: 'portfolio', canonicalPath: `/portfolio/${slug}` };
  }
  if (modules.universal_links || modules.bio_links || modules.biolink) {
    return { targetView: 'bio', canonicalPath: `/@${slug}` };
  }
  return { targetView: 'store', canonicalPath: `/store/${slug}` };
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
  targetView: 'store' | 'bio' | 'portfolio' | 'card',
  isExplicitOwnerPreview: boolean
): ModuleStatusResult {
  const isCreator = isCreatorProfile(business);
  const modules = business.modules || {};

  // 1. Account status checks
  if (business.status === 'deleted' || business.status === 'suspended') {
    const typeLabel = targetView === 'bio' ? 'Bio Link' : targetView === 'portfolio' ? 'Portfolio' : targetView === 'card' ? 'Visiting Card' : 'Store';
    return {
      isAvailable: false,
      title: business.status === 'suspended' ? `${typeLabel} Suspended` : `${typeLabel} Inactive`,
      message: business.status === 'suspended'
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
    case 'store': {
      let isEnabled = false;
      if (isCreator) {
        isEnabled = Boolean(
          modules.digital_products ||
          modules.digitalProducts ||
          modules.products ||
          modules.catalog
        );
      } else {
        // Vendors: store is enabled if modules is empty/undefined or any commerce module is enabled
        isEnabled = !business.modules || Boolean(
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
      }

      return {
        isAvailable: isEnabled || isExplicitOwnerPreview,
        title: isCreator ? 'Digital Store Unavailable' : 'Storefront Unavailable',
        message: isCreator
          ? `The digital store for ${business.name} has not been enabled or published.`
          : `The storefront for ${business.name} is currently unavailable or disabled.`,
      };
    }

    case 'bio': {
      const isEnabled = Boolean(
        modules.universal_links ||
        modules.bio_links ||
        modules.biolink
      );
      return {
        isAvailable: isEnabled || isExplicitOwnerPreview,
        title: 'Universal Bio Link Unavailable',
        message: `The bio link profile for ${business.name} is currently disabled or has not been published.`,
      };
    }

    case 'portfolio': {
      const isEnabled = Boolean(
        modules.work_portfolio ||
        modules.portfolio
      );
      return {
        isAvailable: isEnabled || isExplicitOwnerPreview,
        title: 'Professional Portfolio Unavailable',
        message: `The portfolio showcase for ${business.name} is currently disabled or has not been published.`,
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
  }
}
