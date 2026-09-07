import { useEffect } from 'react';
import { BusinessProfile } from '../types';
import { isCreatorProfile } from './profileHelper';

/**
 * Generate a dynamic SVG data URL favicon with the store/creator's initial and brand color
 */
export function generateSvgFavicon(letter: string, bgColor = '#059669', textColor = '#ffffff'): string {
  const char = (letter || 'S').slice(0, 1).toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}"/>
          <stop offset="100%" stop-color="${bgColor}ee"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#g)"/>
      <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="${textColor}">
        ${char}
      </text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Updates document title, meta tags, and dynamic favicon for strict white-labeling (Zero-Storelly Policy)
 */
export function setDynamicBranding(
  business: BusinessProfile | null,
  routeType: 'store' | 'portfolio' | 'bio' | 'dashboard' | 'loading' = 'store',
  fallbackHandle?: string | null
) {
  if (typeof document === 'undefined') return;

  const isCreator = business ? isCreatorProfile(business) : false;

  // 1. Update Title (Strictly vendor/creator centric, zero platform mentions)
  if (business?.name) {
    let suffix = '';
    if (routeType === 'portfolio' || isCreator) {
      suffix = business.portfolioSettings?.headline || business.tagline || 'Official Creator Portfolio & Showcase';
    } else if (routeType === 'bio') {
      suffix = 'Official Links';
    } else if (routeType === 'dashboard') {
      suffix = 'Merchant Hub';
    } else {
      suffix = business.tagline || 'Official Storefront';
    }
    document.title = `${business.name} — ${suffix}`;
  } else if (fallbackHandle) {
    document.title = `@${fallbackHandle} | Official Store & Portfolio`;
  }

  // 2. Update Favicon directly from business logo / profileImage or dynamically generated monogram
  let faviconUrl = business?.logo || business?.profileImage;

  if (!faviconUrl && (business?.name || fallbackHandle)) {
    const name = business?.name || fallbackHandle || 'S';
    const themeBg = isCreator
      ? business?.accentColor || '#4f46e5'
      : business?.themeColor || '#059669';
    faviconUrl = generateSvgFavicon(name, themeBg);
  }

  if (faviconUrl) {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }
}

/**
 * React Hook for automatic white-label document branding
 */
export function useDynamicBranding(
  business: BusinessProfile | null,
  routeType: 'store' | 'portfolio' | 'bio' | 'dashboard' | 'loading' = 'store',
  fallbackHandle?: string | null
) {
  useEffect(() => {
    setDynamicBranding(business, routeType, fallbackHandle);
  }, [business, routeType, fallbackHandle]);
}
