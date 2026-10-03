import React from 'react';
import {
  ShoppingBag,
  Link as LinkIcon,
  Briefcase,
  CalendarCheck,
  FileText,
  Ticket,
  Star,
  Tag,
} from 'lucide-react';
import { BusinessProfile, CreatorModuleState } from '../types';
import { getBaseUrl, updateBusinessProfile } from '../services/firebaseService';

export type CreatorModuleId =
  | 'portfolio'
  | 'universal_links'
  | 'digital_products'
  | 'booking_appointments'
  | 'custom_quotes'
  | 'events_tickets'
  | 'reviews'
  | 'affiliate_products';

export type CanonicalCreatorPublicRouteType =
  | 'bio'
  | 'portfolio'
  | 'store'
  | 'consultations'
  | 'quotes'
  | 'events'
  | 'reviews'
  | 'recommendations';

export type ModulePublishState = 'DISABLED' | 'ENABLED_UNPUBLISHED' | 'ENABLED_PUBLISHED';

export interface CreatorModuleRegistryEntry {
  id: CreatorModuleId;
  canonicalRouteType: CanonicalCreatorPublicRouteType;
  dbKeys: string[];
  title: string;
  shortTitle: string;
  description: string;
  tabId: 'portfolio' | 'biolink' | 'catalog' | 'bookings' | 'quotes' | 'events' | 'reviews' | 'recommendations';
  tabLabel: string;
  icon: React.ElementType;
  badgeColor: string;
  activeBg: string;
  accentColor: 'indigo' | 'emerald' | 'purple' | 'blue' | 'rose' | 'amber' | 'teal';
  publicPathPrefix: string;
}

export const CREATOR_MODULES_REGISTRY: CreatorModuleRegistryEntry[] = [
  {
    id: 'portfolio',
    canonicalRouteType: 'portfolio',
    dbKeys: ['work_portfolio', 'portfolio'],
    title: 'Portfolio Showcase',
    shortTitle: 'Portfolio',
    description: 'Case studies, visual project galleries, client feedback, skills, and media kit.',
    tabId: 'portfolio',
    tabLabel: 'Manage Showcase',
    icon: Briefcase,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBg: 'bg-indigo-100 text-indigo-700',
    accentColor: 'indigo',
    publicPathPrefix: '/portfolio',
  },
  {
    id: 'universal_links',
    canonicalRouteType: 'bio',
    dbKeys: ['universal_links', 'bio_links', 'biolink'],
    title: 'Universal Bio Link',
    shortTitle: 'Bio Link',
    description: 'One link in bio for all socials, YouTube videos, resources, and custom links.',
    tabId: 'biolink',
    tabLabel: 'Configure Bio Links',
    icon: LinkIcon,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    activeBg: 'bg-purple-100 text-purple-700',
    accentColor: 'purple',
    publicPathPrefix: '/@',
  },
  {
    id: 'digital_products',
    canonicalRouteType: 'store',
    dbKeys: ['digital_products', 'digitalProducts', 'digital', 'catalog', 'store'],
    title: 'Digital Store & Downloads',
    shortTitle: 'Digital Store',
    description: 'Sell downloadable assets, PDFs, design templates, software, and presets.',
    tabId: 'catalog',
    tabLabel: 'Add Digital Products',
    icon: ShoppingBag,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBg: 'bg-emerald-100 text-emerald-700',
    accentColor: 'emerald',
    publicPathPrefix: '/store',
  },
  {
    id: 'booking_appointments',
    canonicalRouteType: 'consultations',
    dbKeys: ['booking_appointments', 'consultations', 'bookings', 'consult'],
    title: '1:1 Consultations & Mentorship',
    shortTitle: 'Consultations',
    description: 'Paid video calls, portfolio reviews, advice sessions, and appointment slots.',
    tabId: 'bookings',
    tabLabel: 'Manage Appointments',
    icon: CalendarCheck,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    activeBg: 'bg-blue-100 text-blue-700',
    accentColor: 'blue',
    publicPathPrefix: '/consult',
  },
  {
    id: 'custom_quotes',
    canonicalRouteType: 'quotes',
    dbKeys: ['custom_quotes', 'quotes', 'quote'],
    title: 'Custom Project Quotes',
    shortTitle: 'Project Quotes',
    description: 'Receive project briefs and send customized estimates, scopes & payment links.',
    tabId: 'quotes',
    tabLabel: 'Review Quotes',
    icon: FileText,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    activeBg: 'bg-amber-100 text-amber-700',
    accentColor: 'amber',
    publicPathPrefix: '/quote',
  },
  {
    id: 'events_tickets',
    canonicalRouteType: 'events',
    dbKeys: ['events_tickets', 'events_ticketing', 'events', 'event'],
    title: 'Events, Workshops & Webinars',
    shortTitle: 'Events & Tickets',
    description: 'Sell tickets for live masterclasses, cohort meetups, bootcamps, and workshops.',
    tabId: 'events',
    tabLabel: 'Manage Events',
    icon: Ticket,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    activeBg: 'bg-rose-100 text-rose-700',
    accentColor: 'rose',
    publicPathPrefix: '/events',
  },
  {
    id: 'reviews',
    canonicalRouteType: 'reviews',
    dbKeys: ['reviews', 'testimonials'],
    title: 'Client Testimonials & Ratings',
    shortTitle: 'Testimonials',
    description: 'Collect and display verified client feedback, ratings, and social proof.',
    tabId: 'reviews',
    tabLabel: 'Manage Testimonials',
    icon: Star,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    activeBg: 'bg-amber-100 text-amber-700',
    accentColor: 'amber',
    publicPathPrefix: '/reviews',
  },
  {
    id: 'affiliate_products',
    canonicalRouteType: 'recommendations',
    dbKeys: ['affiliate_products', 'recommendations', 'affiliate'],
    title: 'Affiliate & Recommended Products',
    shortTitle: 'Recommendations',
    description: 'Curate recommended gear, books, software tools, discounts, and monetized affiliate links.',
    tabId: 'recommendations',
    tabLabel: 'Manage Recommendations',
    icon: Tag,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    activeBg: 'bg-teal-100 text-teal-700',
    accentColor: 'teal',
    publicPathPrefix: '/recommendations',
  },
];

/**
 * Extracts normalized slug or username from a profile or string
 */
export function extractCreatorHandle(businessOrSlug: any): string {
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null) {
    return (businessOrSlug.username || businessOrSlug.slug || businessOrSlug.id || '').trim();
  }
  return String(businessOrSlug || '').trim();
}

/**
 * Maps any module key or alias to its primary CreatorModuleId
 */
export function normalizeCreatorModuleId(moduleIdOrKey: string): CreatorModuleId {
  const k = String(moduleIdOrKey).toLowerCase();
  switch (k) {
    case 'portfolio':
    case 'work_portfolio':
      return 'portfolio';

    case 'universal_links':
    case 'bio_links':
    case 'biolink':
    case 'bio':
      return 'universal_links';

    case 'digital_products':
    case 'digitalproducts':
    case 'digital':
    case 'catalog':
    case 'store':
      return 'digital_products';

    case 'booking_appointments':
    case 'consultations':
    case 'bookings':
    case 'consult':
    case 'book':
      return 'booking_appointments';

    case 'custom_quotes':
    case 'quotes':
    case 'quote':
      return 'custom_quotes';

    case 'events_tickets':
    case 'events_ticketing':
    case 'events':
    case 'event':
      return 'events_tickets';

    case 'reviews':
    case 'testimonials':
      return 'reviews';

    case 'affiliate_products':
    case 'recommendations':
    case 'affiliate':
    case 'recs':
      return 'affiliate_products';

    default:
      return 'portfolio';
  }
}

/**
 * Retrieves the independent Enabled and Published states for a Creator module.
 * Source of truth:
 * 1. Explicit `business.creatorModulesConfig[moduleId]` or `business.moduleStates[moduleId]`
 * 2. Fallback to `business.modules[key]` (defaulting published = enabled for legacy records)
 */
export function getCreatorModuleState(
  business: BusinessProfile | null | undefined,
  moduleIdOrKey: string
): {
  enabled: boolean;
  published: boolean;
  status: ModulePublishState;
} {
  if (!business) {
    return { enabled: false, published: false, status: 'DISABLED' };
  }

  const primaryId = normalizeCreatorModuleId(moduleIdOrKey);
  const explicitConfig =
    business.creatorModulesConfig?.[primaryId] ||
    business.moduleStates?.[primaryId];

  if (explicitConfig && typeof explicitConfig.enabled === 'boolean') {
    const isEnabled = explicitConfig.enabled;
    const isPublished = isEnabled && explicitConfig.published === true;
    const status: ModulePublishState = !isEnabled
      ? 'DISABLED'
      : isPublished
      ? 'ENABLED_PUBLISHED'
      : 'ENABLED_UNPUBLISHED';
    return {
      enabled: isEnabled,
      published: isPublished,
      status,
    };
  }

  // Fallback to legacy modules object
  const modules = (business.modules || {}) as Record<string, any>;
  let isEnabled = false;

  switch (primaryId) {
    case 'portfolio':
      isEnabled = Boolean(modules.work_portfolio || modules.portfolio);
      break;
    case 'universal_links':
      isEnabled = Boolean(modules.universal_links || modules.bio_links || modules.biolink);
      break;
    case 'digital_products':
      isEnabled = Boolean(modules.digital_products || modules.digitalProducts || modules.digital || modules.catalog || modules.store);
      break;
    case 'booking_appointments':
      isEnabled = Boolean(modules.booking_appointments || modules.consultations || modules.bookings || modules.consult);
      break;
    case 'custom_quotes':
      isEnabled = Boolean(modules.custom_quotes || modules.quotes || modules.quote);
      break;
    case 'events_tickets':
      isEnabled = Boolean(modules.events_tickets || modules.events_ticketing || modules.events || modules.event);
      break;
    case 'reviews':
      isEnabled = Boolean(modules.reviews || modules.testimonials);
      break;
    case 'affiliate_products':
      isEnabled = Boolean(modules.affiliate_products || modules.recommendations || modules.affiliate);
      break;
  }

  const status: ModulePublishState = isEnabled ? 'ENABLED_PUBLISHED' : 'DISABLED';
  return {
    enabled: isEnabled,
    published: isEnabled,
    status,
  };
}

/**
 * Authoritative check if a creator module is currently enabled (for management).
 */
export function isCreatorModuleEnabled(
  business: BusinessProfile | null | undefined,
  moduleIdOrKey: string
): boolean {
  return getCreatorModuleState(business, moduleIdOrKey).enabled;
}

/**
 * Authoritative check if a creator module is currently published (accessible to public).
 */
export function isCreatorModulePublished(
  business: BusinessProfile | null | undefined,
  moduleIdOrKey: string
): boolean {
  return getCreatorModuleState(business, moduleIdOrKey).published;
}

/**
 * Central authoritative resolver for Creator Module public paths.
 * Produces deterministic canonical paths without host:
 * e.g. /@siddipet-dandiya-night
 *      /portfolio/siddipet-dandiya-night
 *      /store/siddipet-dandiya-night
 *      /consult/siddipet-dandiya-night
 *      /events/siddipet-dandiya-night
 *      /quote/siddipet-dandiya-night
 *      /reviews/siddipet-dandiya-night
 *      /recommendations/siddipet-dandiya-night
 */
export function getCreatorModuleDisplayPath(
  businessOrSlug: any,
  moduleType: CreatorModuleId | CanonicalCreatorPublicRouteType | string,
  optionalEntitySlug?: string
): string {
  const handle = extractCreatorHandle(businessOrSlug);
  const normalizedKey = String(moduleType).toLowerCase();

  switch (normalizedKey) {
    case 'universal_links':
    case 'bio_links':
    case 'biolink':
    case 'bio':
      return `/@${encodeURIComponent(handle)}`;

    case 'portfolio':
    case 'work_portfolio':
      return `/portfolio/${encodeURIComponent(handle)}`;

    case 'consultations':
    case 'booking_appointments':
    case 'bookings':
    case 'consult':
    case 'book':
      return `/consult/${encodeURIComponent(handle)}`;

    case 'events_tickets':
    case 'events_ticketing':
    case 'events':
    case 'event':
      return `/events/${encodeURIComponent(handle)}${optionalEntitySlug ? `?event=${encodeURIComponent(optionalEntitySlug)}` : ''}`;

    case 'custom_quotes':
    case 'quotes':
    case 'quote':
      return `/quote/${encodeURIComponent(handle)}`;

    case 'reviews':
    case 'testimonials':
      return `/reviews/${encodeURIComponent(handle)}`;

    case 'affiliate_products':
    case 'recommendations':
    case 'affiliate':
    case 'recs':
      return `/recommendations/${encodeURIComponent(handle)}`;

    case 'digital_products':
    case 'digitalproducts':
    case 'digital':
    case 'catalog':
    case 'store':
    default:
      return `/store/${encodeURIComponent(handle)}${optionalEntitySlug ? `?item=${encodeURIComponent(optionalEntitySlug)}` : ''}`;
  }
}

/**
 * Central authoritative resolver for Creator Module public URLs.
 * Works seamlessly across local dev, staging, Vercel, and custom domains.
 * SINGLE SOURCE OF TRUTH for:
 * - Module Manager "Live" links
 * - Copy Link buttons
 * - QR Code generation
 * - Share modals
 * - Public navigation
 */
export function getCreatorModulePublicUrl(
  businessOrSlug: any,
  moduleType: CreatorModuleId | CanonicalCreatorPublicRouteType | string,
  optionalEntitySlug?: string
): string {
  const path = getCreatorModuleDisplayPath(businessOrSlug, moduleType, optionalEntitySlug);

  // If profile has custom domain configured and it's a root/bio/store path
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null && businessOrSlug.customDomain) {
    return `https://${businessOrSlug.customDomain}${path}`;
  }

  const base = getBaseUrl();
  return `${base}${path}`;
}

/**
 * Returns all active creator modules for a given profile
 */
export function getEnabledCreatorModules(
  business: BusinessProfile | null | undefined
): CreatorModuleRegistryEntry[] {
  if (!business) return [];
  return CREATOR_MODULES_REGISTRY.filter((entry) => isCreatorModuleEnabled(business, entry.id));
}

/**
 * Returns all active AND published creator modules for a given profile
 */
export function getPublishedCreatorModules(
  business: BusinessProfile | null | undefined
): CreatorModuleRegistryEntry[] {
  if (!business) return [];
  return CREATOR_MODULES_REGISTRY.filter((entry) => isCreatorModulePublished(business, entry.id));
}

/**
 * Atomic module state update service.
 * Updates both creatorModulesConfig and legacy modules object in Firestore.
 */
export async function setCreatorModuleState(
  business: BusinessProfile,
  moduleId: CreatorModuleId | string,
  state: { enabled?: boolean; published?: boolean }
): Promise<BusinessProfile> {
  const primaryId = normalizeCreatorModuleId(moduleId);
  const registryEntry = CREATOR_MODULES_REGISTRY.find((e) => e.id === primaryId);
  const currentState = getCreatorModuleState(business, primaryId);

  const nextEnabled = typeof state.enabled === 'boolean' ? state.enabled : currentState.enabled;
  const nextPublished = nextEnabled && (typeof state.published === 'boolean' ? state.published : currentState.published);

  const nextModuleState: CreatorModuleState = {
    enabled: nextEnabled,
    published: nextPublished,
    updatedAt: Date.now(),
  };

  const updatedCreatorModulesConfig = {
    ...(business.creatorModulesConfig || {}),
    [primaryId]: nextModuleState,
  };

  // Sync to legacy boolean flags for backward compatibility
  const updatedModules = { ...(business.modules || {}) };
  if (registryEntry) {
    for (const key of registryEntry.dbKeys) {
      (updatedModules as any)[key] = nextEnabled;
    }
  }

  const updates: Partial<BusinessProfile> = {
    creatorModulesConfig: updatedCreatorModulesConfig,
    moduleStates: updatedCreatorModulesConfig,
    modules: updatedModules,
  };

  await updateBusinessProfile(business.id, updates);

  return {
    ...business,
    ...updates,
  };
}
