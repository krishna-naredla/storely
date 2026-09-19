import { BusinessProfile } from '../types';

export function getAppLogo(): string {
  return '/main logo.jpg';
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

