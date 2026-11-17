import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'godrive_order_notifications_enabled';

export type OrderNotificationPermission = NotificationPermission | 'unsupported';

function getInitialPermission(): OrderNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function getInitialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'false') return false;
    if (saved === 'true') return true;
    return 'Notification' in window && Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export async function dispatchOrderBrowserNotification(
  title: string,
  body: string,
  tag?: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag,
    renotify: Boolean(tag),
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await Promise.race<ServiceWorkerRegistration | null>([
        navigator.serviceWorker.ready,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 800)),
      ]);
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, options);
        return true;
      }
    }
  } catch {
    // Fall back to standard Notification constructor below
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function useOrderNotifications() {
  const [permission, setPermission] = useState<OrderNotificationPermission>(
    getInitialPermission
  );
  const [enabled, setEnabled] = useState<boolean>(getInitialEnabled);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const persistEnabled = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const requestAndEnable = useCallback(async (): Promise<OrderNotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        persistEnabled(true);
        void dispatchOrderBrowserNotification(
          'Notifikasi GoDrive Aktif',
          'Anda akan menerima pembaruan status pesanan secara otomatis.',
          'godrive-notif-ready'
        );
      } else {
        persistEnabled(false);
      }
      return result;
    } catch {
      const current = Notification.permission;
      setPermission(current);
      return current;
    }
  }, [persistEnabled]);

  const toggleEnabled = useCallback(() => {
    if (permission !== 'granted') return;
    persistEnabled(!enabled);
  }, [enabled, permission, persistEnabled]);

  const notifyOrderStage = useCallback(
    (title: string, body: string, tag?: string) => {
      if (permission !== 'granted' || !enabled) return;
      void dispatchOrderBrowserNotification(title, body, tag);
    },
    [enabled, permission]
  );

  return {
    isSupported: permission !== 'unsupported',
    permission,
    enabled: permission === 'granted' && enabled,
    requestAndEnable,
    toggleEnabled,
    notifyOrderStage,
  };
}
