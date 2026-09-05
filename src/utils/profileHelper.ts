import { BusinessProfile, ProfileType } from '../types';
import { getBioLinkUrl, getPortfolioUrl, getDigitalStoreUrl } from '../services/firebaseService';

/**
 * Determine if a business profile is a Creator profile or a Vendor profile.
 * Source of truth:
 * 1. Explicit `profileType === 'creator'` or `storeType === 'creator'`
 * 2. Explicit `profileType === 'vendor'` or `storeType === 'vendor'`
 * 3. Fallback for legacy profiles:
 *    - type is 'digital_creator' or 'creator'
 *    - or has creator modules (portfolio, work_portfolio, universal_links) without physical store modules (products, menu, rooms, vehicles)
 */
export function isCreatorProfile(business?: BusinessProfile | null): boolean {
  if (!business) return false;

  if (business.profileType === 'creator' || business.storeType === 'creator') {
    return true;
  }
  if (business.profileType === 'vendor' || business.storeType === 'vendor') {
    return false;
  }

  // Legacy fallback heuristics
  if (business.type === 'digital_creator' || (business.type as string) === 'creator') {
    return true;
  }

  // If creator modules are enabled and physical vendor modules are disabled
  const hasCreatorModules = Boolean(
    business.modules?.work_portfolio ||
    business.modules?.portfolio ||
    business.modules?.universal_links ||
    business.modules?.digital_products
  );
  const hasVendorModules = Boolean(
    business.modules?.products ||
    business.modules?.menu ||
    business.modules?.rooms ||
    business.modules?.vehicles ||
    business.modules?.cart_ordering ||
    business.modules?.table_delivery
  );

  if (hasCreatorModules && !hasVendorModules) {
    return true;
  }

  return false;
}

/**
 * Determine if a profile is a Vendor profile.
 */
export function isVendorProfile(business?: BusinessProfile | null): boolean {
  return !isCreatorProfile(business);
}

/**
 * Get normalized profile type ('vendor' | 'creator')
 */
export function getProfileType(business?: BusinessProfile | null): ProfileType {
  return isCreatorProfile(business) ? 'creator' : 'vendor';
}

/**
 * Get human-readable badge label
 */
export function getProfileTypeLabel(business?: BusinessProfile | null): string {
  return isCreatorProfile(business) ? 'Creator Account' : 'Vendor Account';
}

export interface PublicDestination {
  id: string;
  moduleKey: string;
  title: string;
  badgeLabel: string;
  description: string;
  url: string;
  displayPath: string;
  isPrimary: boolean;
  enabled: boolean;
}

/**
 * Get all active public destinations for a given business/creator profile
 */
export function getPublicDestinations(business: BusinessProfile): PublicDestination[] {
  const isCreator = isCreatorProfile(business);
  const slug = business.slug;
  const destinations: PublicDestination[] = [];

  if (isCreator) {
    // 1. Portfolio
    const portfolioEnabled = Boolean(business.modules?.work_portfolio || business.modules?.portfolio);
    if (portfolioEnabled) {
      destinations.push({
        id: 'portfolio',
        moduleKey: 'work_portfolio',
        title: 'Portfolio Website',
        badgeLabel: 'Portfolio',
        description: 'Showcase your work, case studies, galleries, and client outcomes.',
        url: getPortfolioUrl(slug),
        displayPath: `/portfolio/${slug}`,
        isPrimary: true,
        enabled: true,
      });
    }

    // 2. Universal Bio Link
    const bioEnabled = Boolean(business.modules?.universal_links);
    if (bioEnabled) {
      destinations.push({
        id: 'biolink',
        moduleKey: 'universal_links',
        title: 'Universal Bio Link',
        badgeLabel: 'Bio Link',
        description: 'One professional link for all your socials, projects, and contact channels.',
        url: getBioLinkUrl(slug),
        displayPath: `/@${slug}`,
        isPrimary: !portfolioEnabled,
        enabled: true,
      });
    }

    // 3. Digital Store
    const digitalEnabled = Boolean(business.modules?.digital_products || business.modules?.digitalProducts);
    if (digitalEnabled) {
      destinations.push({
        id: 'digital_store',
        moduleKey: 'digital_products',
        title: 'Digital Products Store',
        badgeLabel: 'Digital Store',
        description: 'Sell downloadable PDFs, templates, code kits, and premium guides.',
        url: getDigitalStoreUrl(slug),
        displayPath: `/store/${slug}`,
        isPrimary: !portfolioEnabled && !bioEnabled,
        enabled: true,
      });
    }

    // Fallback if none explicitly enabled
    if (destinations.length === 0) {
      destinations.push({
        id: 'portfolio',
        moduleKey: 'work_portfolio',
        title: 'Portfolio Website',
        badgeLabel: 'Portfolio',
        description: 'Showcase your work, case studies, and client outcomes.',
        url: getPortfolioUrl(slug),
        displayPath: `/portfolio/${slug}`,
        isPrimary: true,
        enabled: true,
      });
    }
  } else {
    // Vendor Storefront
    destinations.push({
      id: 'storefront',
      moduleKey: 'products',
      title: 'Digital Storefront',
      badgeLabel: 'Storefront',
      description: 'Online catalog, digital ordering, and instant WhatsApp customer checkout.',
      url: getDigitalStoreUrl(slug),
      displayPath: `/store/${slug}`,
      isPrimary: true,
      enabled: true,
    });
  }

  return destinations;
}

/**
 * Get primary public URL for a business or creator profile
 */
export function getPrimaryPublicUrl(business: BusinessProfile): string {
  const destinations = getPublicDestinations(business);
  const primary = destinations.find((d) => d.isPrimary) || destinations[0];
  return primary ? primary.url : getPortfolioUrl(business.slug);
}

/**
 * Get primary public display path (e.g., /portfolio/slug or /store/slug or /@slug)
 */
export function getPrimaryPublicDisplayPath(business: BusinessProfile): string {
  const destinations = getPublicDestinations(business);
  const primary = destinations.find((d) => d.isPrimary) || destinations[0];
  return primary ? primary.displayPath : `/portfolio/${business.slug}`;
}

