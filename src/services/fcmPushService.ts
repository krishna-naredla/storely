import { BusinessProfile } from '../types';

export async function requestFcmNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop/PWA push notifications.');
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        new Notification('Storelly Push Notifications Enabled!', {
          body: 'You will now receive instant push alerts for orders and bookings even when your app is in the background.',
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

export function recordNotificationHistory(businessId: string, businessName: string, title: string, body: string, type: 'order' | 'booking') {
  try {
    const key = `storelly_notification_history_${businessId}`;
    const existing = localStorage.getItem(key);
    const list: any[] = existing ? JSON.parse(existing) : [];
    const newItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      businessId,
      businessName,
      title,
      body,
      type,
      timestamp: Date.now(),
      read: false,
    };
    list.unshift(newItem);
    const trimmed = list.slice(0, 20);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to record notification history:', e);
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

export function showMerchantNotification(title: string, body: string, business?: BusinessProfile, type: 'order' | 'booking' = 'order') {
  if (business) {
    recordNotificationHistory(business.id, business.name, title, body, type);
  }

  // Check store timings if business profile is provided
  if (business && !isStoreCurrentlyOpen(business)) {
    console.log(`Store ${business.name} is currently closed according to business hours. Skipping notification alert.`);
    return;
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      // Try displaying via Service Worker registration if available for robust PWA background delivery
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: business?.logo || '/icons/icon.svg',
            badge: '/icons/icon.svg',
            tag: 'storelly-realtime-alert',
            renotify: true,
            data: { url: window.location.href }
          } as any);
        }).catch(() => {
          new Notification(title, {
            body,
            icon: business?.logo || '/icons/icon.svg',
          });
        });
      } else {
        new Notification(title, {
          body,
          icon: business?.logo || '/icons/icon.svg',
        });
      }

      // Play alert chime
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Could not display push notification:', e);
    }
  }
}

