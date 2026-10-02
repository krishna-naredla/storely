import { BusinessProfile } from '../types';
import { PlatformBrandingConfig } from '../types/admin';

export const DEFAULT_BRANDING_CONFIG: PlatformBrandingConfig = {
  siteName: 'Storelly',
  logoUrl: '/main logo.jpg',
  faviconUrl: '/icons/icon.svg',
};

// In-memory branding cache initialized from localStorage (if any) or defaults
let cachedBranding: PlatformBrandingConfig = (() => {
  if (typeof window !== 'undefined') {
    try {
      const savedName = localStorage.getItem('storelly_branding_name');
      const savedLogo = localStorage.getItem('storelly_branding_logo');
      const savedFavicon = localStorage.getItem('storelly_branding_favicon');
      return {
        siteName: savedName || DEFAULT_BRANDING_CONFIG.siteName,
        logoUrl: savedLogo || DEFAULT_BRANDING_CONFIG.logoUrl,
        faviconUrl: savedFavicon || DEFAULT_BRANDING_CONFIG.faviconUrl,
      };
    } catch {}
  }
  return { ...DEFAULT_BRANDING_CONFIG };
})();

export function setCachedBranding(branding: Partial<PlatformBrandingConfig>) {
  cachedBranding = {
    ...cachedBranding,
    ...branding,
  };

  // Sync to DOM favicon if provided
  if (typeof document !== 'undefined' && cachedBranding.faviconUrl) {
    try {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = cachedBranding.faviconUrl;
    } catch {}
  }
}

export function getAppLogo(): string {
  return cachedBranding.logoUrl || DEFAULT_BRANDING_CONFIG.logoUrl;
}

export function getAppName(): string {
  return cachedBranding.siteName || DEFAULT_BRANDING_CONFIG.siteName;
}

export function getAppFavicon(): string {
  return cachedBranding.faviconUrl || DEFAULT_BRANDING_CONFIG.faviconUrl;
}

export function getBusinessLogo(business?: BusinessProfile | null): string | null {
  if (!business) return null;
  const b = business as any;
  const logo =
    b.logo ||
    b.profileImage ||
    b.branding?.logoUrl ||
    b.branding?.logo ||
    b.avatar ||
    b.avatarUrl ||
    b.photoURL ||
    b.logoUrl ||
    null;
  if (typeof logo === 'string' && logo.trim().length > 0) {
    return logo.trim();
  }
  return null;
}

