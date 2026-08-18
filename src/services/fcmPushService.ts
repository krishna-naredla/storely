export async function requestFcmNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop push notifications.');
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('Storelly FCM Enabled!', {
        body: 'You will receive real-time browser push notifications when new orders or bookings arrive.',
      });
      return true;
    } else {
      alert('Notification permission was denied.');
      return false;
    }
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return false;
  }
}

export function showMerchantNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
      });
      // Play alert chime
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Could not display push notification:', e);
    }
  }
}
