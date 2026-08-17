import { useCallback, useEffect, useRef } from 'react';

export function usePushNotifications() {
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        swRegistration.current = reg;
      }).catch(() => {});
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const showNotification = useCallback(async (title: string, body: string, tag?: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await requestPermission();
    }
    if (Notification.permission === 'granted') {
      if (swRegistration.current) {
        swRegistration.current.active?.postMessage({
          type: 'show_notification',
          title,
          body,
          tag: tag || 'default',
        });
      } else {
        try {
          const n = new Notification(title, {
            body,
            tag: tag || 'default',
            icon: '/2.png',
          } as any);
          n.onclick = () => { window.focus(); n.close(); };
        } catch {}
      }
    }
  }, [requestPermission]);

  return { requestPermission, showNotification };
}
