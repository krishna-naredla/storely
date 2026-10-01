import { BusinessProfile } from '../types';

export async function requestFcmNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop/PWA push notifications.');
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register standard notification permission (Service Worker registration removed for PWA-free SaaS architecture)
      try {
        new Notification('Storelly Notifications Enabled!', {
          body: 'You will now receive instant browser alerts for orders and bookings.',
          icon: '/icons/icon.svg',
          badge: '/icons/icon.svg',
        });
      } catch {
        // Fallback if Notification constructor fails in some mobile WebViews
      }
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

export function isStoreCurrentlyOpen(business: BusinessProfile): boolean {
  if (!business.businessHours) return true;
  if (business.businessHours.isAlwaysOpen) return true;
  const { openTime, closeTime, days } = business.businessHours;
  if (!openTime || !closeTime || !days || days.length === 0) return true;

  const now = new Date();
  const currentDayStr = now.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon"
  const isDayMatch = days.some(d => d.toLowerCase().startsWith(currentDayStr.toLowerCase()));
  if (!isDayMatch) return false;

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = (openH || 0) * 60 + (openM || 0);
  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

  return currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes;
}

export function showMerchantNotification(title: string, body: string, business?: BusinessProfile) {
  // Check store timings if business profile is provided
  if (business && !isStoreCurrentlyOpen(business)) {
    console.log(`Store ${business.name} is currently closed according to business hours. Skipping notification alert.`);
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: business?.logo || '/icons/icon.svg',
      });
    } catch (e) {
      console.warn('Could not display push notification:', e);
    }
  }
}

