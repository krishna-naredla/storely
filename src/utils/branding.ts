import { BusinessProfile } from '../types';

export function getAppLogo(): string {
  return '/main logo-1.jpg';
}

export function getBusinessLogo(business?: BusinessProfile | null): string | null {
  if (!business) return null;
  const b = business as any;
  return (
    b.logo ||
    b.profileImage ||
    b.avatar ||
    b.logoUrl ||
    b.photoURL ||
    b.coverImage ||
    b.banner ||
    null
  );
}

