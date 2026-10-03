import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';
import { CanonicalPublicView } from './publicRouteResolver';
import {
  getCreatorModuleState,
  isCreatorModuleEnabled,
  isCreatorModulePublished,
} from './creatorModuleManager';

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
      message: 'This Storelly profile is in draft mode and has not yet been published.',
      helperNote: 'Please check back soon once the owner publishes their page.',
      business,
    };
  }

  // 7. Target View Specific Module Checks
  const isCreator = isCreatorProfile(business);
  const modules = business.modules || {};

  if (targetView === 'bio') {
    const state = getCreatorModuleState(business, 'universal_links');
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Universal Bio Link Inactive',
        message: `The bio link for ${business.name} is currently inactive.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: 'Universal Bio Link Unpublished',
        message: `The bio link for ${business.name} is currently unpublished.`,
        helperNote: 'The creator has not yet published this section.',
        business,
      };
    }
  } else if (targetView === 'portfolio') {
    const state = getCreatorModuleState(business, 'portfolio');
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Portfolio Showcase Inactive',
        message: `The portfolio showcase for ${business.name} is currently inactive.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: 'Portfolio Showcase Unpublished',
        message: `The portfolio showcase for ${business.name} is currently unpublished.`,
        helperNote: 'The creator has not yet published their portfolio showcase.',
        business,
      };
    }
  } else if (targetView === 'consultations') {
    const state = isCreator
      ? getCreatorModuleState(business, 'booking_appointments')
      : { enabled: Boolean(modules.booking_appointments), published: Boolean(modules.booking_appointments), status: 'ENABLED_PUBLISHED' as const };
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: '1:1 Consultations Inactive',
        message: `1:1 consultations for ${business.name} are currently not active.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: '1:1 Consultations Unpublished',
        message: `1:1 consultations for ${business.name} are currently unpublished.`,
        helperNote: 'The creator has not yet published consultation bookings.',
        business,
      };
    }
  } else if (targetView === 'events') {
    const state = isCreator
      ? getCreatorModuleState(business, 'events_tickets')
      : { enabled: Boolean(modules.events_tickets || modules.events_ticketing), published: Boolean(modules.events_tickets || modules.events_ticketing), status: 'ENABLED_PUBLISHED' as const };
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Events & Workshops Inactive',
        message: `Events and workshops for ${business.name} are currently not active.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: 'Events & Workshops Unpublished',
        message: `Events and workshops for ${business.name} are currently unpublished.`,
        helperNote: 'The creator has not yet published their upcoming events.',
        business,
      };
    }
  } else if (targetView === 'quotes') {
    const state = isCreator
      ? getCreatorModuleState(business, 'custom_quotes')
      : { enabled: Boolean(modules.custom_quotes), published: Boolean(modules.custom_quotes), status: 'ENABLED_PUBLISHED' as const };
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Custom Quotes Inactive',
        message: `Custom project quotes for ${business.name} are currently not accepting inquiries.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: 'Custom Quotes Unpublished',
        message: `Custom project quotes for ${business.name} are currently unpublished.`,
        helperNote: 'The creator has not yet published their project brief form.',
        business,
      };
    }
  } else if (targetView === 'reviews') {
    const state = isCreator
      ? getCreatorModuleState(business, 'reviews')
      : { enabled: modules.reviews !== false, published: modules.reviews !== false, status: 'ENABLED_PUBLISHED' as const };
    if (!state.enabled) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Reviews Inactive',
        message: `Customer reviews for ${business.name} are currently not public.`,
        helperNote: 'You can enable this module from your Creator Modules dashboard.',
        business,
      };
    }
    if (!state.published && !isExplicitOwnerPreview) {
      return {
        status: 'UNPUBLISHED',
        isAvailable: false,
        title: 'Reviews Unpublished',
        message: `Customer reviews for ${business.name} are currently unpublished.`,
        helperNote: 'The creator has not yet published customer testimonials.',
        business,
      };
    }
  } else if (targetView === 'card') {
    const isCardEnabled = business.trustCardSettings?.enabled !== false;
    if (!isCardEnabled && !isExplicitOwnerPreview) {
      return {
        status: 'DISABLED',
        isAvailable: false,
        title: 'Visiting Card Inactive',
        message: `The digital trust card for ${business.name} is not currently active.`,
        business,
      };
    }
  } else if (targetView === 'store') {
    if (isCreator) {
      const state = getCreatorModuleState(business, 'digital_products');
      if (!state.enabled) {
        return {
          status: 'DISABLED',
          isAvailable: false,
          title: 'Digital Store Inactive',
          message: `The digital store for ${business.name} has not been enabled.`,
          helperNote: 'You can enable the Digital Store & Downloads module from your Creator Modules dashboard.',
          business,
        };
      }
      if (!state.published && !isExplicitOwnerPreview) {
        return {
          status: 'UNPUBLISHED',
          isAvailable: false,
          title: 'Digital Store Unpublished',
          message: `The digital store for ${business.name} is currently in draft mode.`,
          helperNote: 'You can publish your digital store from the Creator Modules dashboard.',
          business,
        };
      }
    } else {
      // Vendors
      const isStoreEnabled =
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

      if (!isStoreEnabled && !isExplicitOwnerPreview) {
        return {
          status: 'DISABLED',
          isAvailable: false,
          title: 'Storefront Unavailable',
          message: `The storefront for ${business.name} is currently unavailable or disabled.`,
          helperNote: 'You can enable catalog & storefront modules from your Store Settings.',
          business,
        };
      }
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
