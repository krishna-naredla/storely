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

  // Authoritative check
  if (business.profileType === 'creator' || business.storeType === 'creator') {
    return true;
  }
  if (business.profileType === 'vendor' || business.storeType === 'vendor') {
    return false;
  }

  // Legacy fallback - only for migration/normalization
  if (business.type === 'digital_creator' || (business.type as string) === 'creator') {
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
    const portfolioEnabled = Boolean(
      business.modules?.work_portfolio || business.modules?.portfolio
    );
    const bioEnabled = Boolean(
      business.modules?.universal_links || business.modules?.bio_links || business.modules?.biolink
    );
    const digitalEnabled = Boolean(
      business.modules?.digital_products ||
      business.modules?.digitalProducts ||
      business.modules?.products ||
      business.modules?.catalog
    );

    const userPreferredPrimary = business.primaryDestination;

    // 1. Work Portfolio
    if (portfolioEnabled) {
      destinations.push({
        id: 'portfolio',
        moduleKey: 'work_portfolio',
        title: 'Work Portfolio',
        badgeLabel: 'Portfolio',
        description: 'Showcase your work samples, case studies, galleries, and client outcomes.',
        url: getPortfolioUrl(slug),
        displayPath: `/portfolio/${slug}`,
        isPrimary: false,
        enabled: true,
      });
    }

    // 2. Universal Bio Link
    if (bioEnabled) {
      destinations.push({
        id: 'biolink',
        moduleKey: 'universal_links',
        title: 'Universal Bio Link',
        badgeLabel: 'Bio Link',
        description: 'One professional link for all your socials, projects, and contact channels.',
        url: getBioLinkUrl(slug),
        displayPath: `/@${slug}`,
        isPrimary: false,
        enabled: true,
      });
    }

    // 3. Digital Store
    if (digitalEnabled) {
      destinations.push({
        id: 'digital_store',
        moduleKey: 'digital_products',
        title: 'Digital Products Store',
        badgeLabel: 'Digital Store',
        description: 'Sell downloadable PDFs, templates, software, and products on WhatsApp.',
        url: getDigitalStoreUrl(slug),
        displayPath: `/store/${slug}`,
        isPrimary: false,
        enabled: true,
      });
    }

    // Fallback if none explicitly enabled
    if (destinations.length === 0) {
      destinations.push({
        id: 'portfolio',
        moduleKey: 'work_portfolio',
        title: 'Work Portfolio',
        badgeLabel: 'Portfolio',
        description: 'Showcase your work samples, projects, and creative services.',
        url: getPortfolioUrl(slug),
        displayPath: `/portfolio/${slug}`,
        isPrimary: true,
        enabled: true,
      });
    }

    // Resolve primary destination:
    let primarySet = false;
    if (userPreferredPrimary) {
      const match = destinations.find((d) => 
        (userPreferredPrimary === 'portfolio' && d.id === 'portfolio') ||
        (userPreferredPrimary === 'biolink' && d.id === 'biolink') ||
        (userPreferredPrimary === 'store' && d.id === 'digital_store')
      );
      if (match) {
        match.isPrimary = true;
        primarySet = true;
      }
    }

    if (!primarySet) {
      // Default priority for creator: Portfolio -> BioLink -> Digital Store
      destinations[0].isPrimary = true;
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

/**
 * Helper to get a social link value safely regardless of whether socialLinks is stored as an object or an array
 */
export function getSocialLinkValue(business?: BusinessProfile | null, platform?: string): string {
  if (!business || !platform) return '';
  const p = platform.toLowerCase();

  // 1. Check array format
  if (Array.isArray(business.socialLinks)) {
    const found = (business.socialLinks as Array<{ platform: string; url: string }>).find(
      (item) => item.platform && item.platform.toLowerCase() === p
    );
    if (found?.url) return found.url;
  }

  // 2. Check object format in socialLinks
  if (business.socialLinks && typeof business.socialLinks === 'object' && !Array.isArray(business.socialLinks)) {
    const val = (business.socialLinks as Record<string, string>)[p];
    if (val) return val;
  }

  // 3. Check legacy socials object
  if (business.socials && typeof business.socials === 'object') {
    const val = (business.socials as Record<string, string>)[p];
    if (val) return val;
  }

  return '';
}

/**
 * Normalize any social links structure into a standard array for forms
 */
export function normalizeSocialLinksToArray(
  socialLinks?: any,
  socials?: any
): Array<{ platform: string; url: string }> {
  if (Array.isArray(socialLinks)) {
    return socialLinks
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        platform: String(item.platform || 'website').toLowerCase(),
        url: String(item.url || ''),
      }));
  }

  const mergedObj: Record<string, string> = {};
  if (socials && typeof socials === 'object') {
    Object.entries(socials).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim()) mergedObj[k.toLowerCase()] = v.trim();
    });
  }
  if (socialLinks && typeof socialLinks === 'object') {
    Object.entries(socialLinks).forEach(([k, v]) => {
      if (typeof v === 'string' && v.trim()) mergedObj[k.toLowerCase()] = v.trim();
    });
  }

  return Object.entries(mergedObj).map(([platform, url]) => ({
    platform,
    url,
  }));
}

/**
 * Normalize any social links structure into a standard object
 */
export function normalizeSocialLinksToObject(
  socialLinks?: any,
  socials?: any
): Record<string, string> {
  const result: Record<string, string> = {};

  if (Array.isArray(socialLinks)) {
    socialLinks.forEach((item) => {
      if (item && item.platform && typeof item.url === 'string') {
        result[item.platform.toLowerCase()] = item.url.trim();
      }
    });
    return result;
  }

  if (socials && typeof socials === 'object') {
    Object.entries(socials).forEach(([k, v]) => {
      if (typeof v === 'string') result[k.toLowerCase()] = v.trim();
    });
  }
  if (socialLinks && typeof socialLinks === 'object') {
    Object.entries(socialLinks).forEach(([k, v]) => {
      if (typeof v === 'string') result[k.toLowerCase()] = v.trim();
    });
  }

  return result;
}

