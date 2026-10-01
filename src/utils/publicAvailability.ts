import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';
import { CanonicalPublicView } from './publicRouteResolver';

export type PublicAvailabilityStatus =
  | 'ACTIVE'
  | 'UNPUBLISHED'
  | 'SUSPENDED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'DELETED'
  | 'NOT_FOUND'
  | 'DISABLED';

export interface PublicAvailabilityResult {
  status: PublicAvailabilityStatus;
  isAvailable: boolean;
  title: string;
  message: string;
  helperNote?: string;
  business: BusinessProfile | null;
}

/**
 * Single authoritative evaluation layer for public availability of Storelly resources.
 * Prevents unauthorized or confusing rendering of deleted, suspended, unpublished,
 * expired, or disabled modules while preventing private data leaks.
 */
export function evaluatePublicAvailability(
  business: BusinessProfile | null | undefined,
  targetView: CanonicalPublicView = null,
  isExplicitOwnerPreview = false
): PublicAvailabilityResult {
  // 1. Not Found
  if (!business) {
    return {
      status: 'NOT_FOUND',
      isAvailable: false,
      title: 'Page not found',
      message: "We couldn't find a public Storelly page at this address.",
      helperNote: 'Please verify the handle in the URL or visit the Storelly homepage.',
      business: null,
    };
  }

  // 2. Deleted
  if (business.status === 'deleted') {
    return {
      status: 'DELETED',
      isAvailable: false,
      title: 'Page not found',
      message: "We couldn't find a public Storelly page at this address.",
      helperNote: 'Please verify the handle in the URL or visit the Storelly homepage.',
      business: null,
    };
  }

  // 3. Suspended
  if (business.status === 'suspended') {
    return {
      status: 'SUSPENDED',
      isAvailable: false,
      title: 'Page currently unavailable',
      message: 'This Storelly page is not available right now.',
      helperNote: 'This page may be temporarily offline.',
      business,
    };
  }

  // 4. Maintenance Mode
  if (business.maintenanceMode || business.status === 'maintenance') {
    return {
      status: 'UNPUBLISHED',
      isAvailable: false,
      title: 'Store Under Maintenance',
      message:
        business.maintenanceMessage ||
        'We are currently offline for scheduled maintenance. Please check back shortly!',
      helperNote: 'The store owner is currently restocking or updating details.',
      business,
    };
  }

  // 5. Subscription Expired (if explicitly flagged on profile)
  const isSubscriptionExpired =
    (business as any).subscriptionStatus === 'expired' ||
    (business as any).isExpired === true;
  if (isSubscriptionExpired && !isExplicitOwnerPreview) {
    return {
      status: 'SUBSCRIPTION_EXPIRED',
      isAvailable: false,
      title: 'Page currently unavailable',
      message: 'This Storelly page is not available right now.',
      helperNote: 'This page may have been unpublished or is temporarily unavailable.',
      business,
    };
  }

  // 6. Draft / Inactive (allowed only under explicit owner preview with verified auth)
  const isDraftOrInactive =
    business.status === 'inactive' ||
    business.status === 'draft' ||
    business.publicProfileStatus === 'draft';

  if (isDraftOrInactive && !isExplicitOwnerPreview) {
    return {
      status: 'UNPUBLISHED',
      isAvailable: false,
      title: 'Page currently unavailable',
      message: 'This Storelly page is not available right now.',
      helperNote: 'This page may have been unpublished or is temporarily unavailable.',
      business,
    };
  }

  // 7. Target View Specific Module Checks
  const isCreator = isCreatorProfile(business);
  const modules = business.modules || {};

  if (targetView === 'bio') {
    const isBioEnabled = Boolean(
      modules.universal_links ||
      modules.bio_links ||
      modules.biolink
    );
    if (!isBioEnabled && !isExplicitOwnerPreview) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Page currently unavailable',
        message: 'This Storelly page is not available right now.',
        helperNote: 'This page may have been unpublished or is temporarily unavailable.',
        business,
      };
    }
  } else if (targetView === 'portfolio') {
    const isPortfolioEnabled = Boolean(
      modules.work_portfolio ||
      modules.portfolio
    );
    if (!isPortfolioEnabled && !isExplicitOwnerPreview) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Page currently unavailable',
        message: 'This Storelly page is not available right now.',
        helperNote: 'This page may have been unpublished or is temporarily unavailable.',
        business,
      };
    }
  } else if (targetView === 'card') {
    const isCardEnabled = business.trustCardSettings?.enabled !== false;
    if (!isCardEnabled && !isExplicitOwnerPreview) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Page currently unavailable',
        message: 'This Storelly page is not available right now.',
        helperNote: 'This page may have been unpublished or is temporarily unavailable.',
        business,
      };
    }
  } else if (targetView === 'store') {
    let isStoreEnabled = false;
    if (isCreator) {
      isStoreEnabled = Boolean(
        modules.digital_products ||
        modules.digitalProducts ||
        modules.products ||
        modules.catalog
      );
    } else {
      // Vendors
      isStoreEnabled = !business.modules || Boolean(
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

    if (!isStoreEnabled && !isExplicitOwnerPreview) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Page currently unavailable',
        message: 'This Storelly page is not available right now.',
        helperNote: 'This page may have been unpublished or is temporarily unavailable.',
        business,
      };
    }
  }

  // 8. Fully Active and Publicly Available
  return {
    status: 'ACTIVE',
    isAvailable: true,
    title: 'Active',
    message: 'Profile is publicly active.',
    business,
  };
}
