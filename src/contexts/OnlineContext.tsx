import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSyncQueue } from '../services/syncQueue';
import { refreshPublicData } from '../services/offlineData';

interface OnlineContextValue {
  isOnline: boolean;
  /** Best-effort signal from the service worker / fetch layer. */
  justBackOnline: boolean;
}

const OnlineContext = createContext<OnlineContextValue>({ isOnline: true, justBackOnline: false });

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  // Start optimistic (the value the pre-render emits) and reconcile with the
  // real browser state in an effect, so hydration always matches the server.
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [justBackOnline, setJustBackOnline] = useState(false);
  const lastStateRef = useRef(isOnline);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    lastStateRef.current = navigator.onLine;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      lastStateRef.current = true;
      setJustBackOnline(true);
      setTimeout(() => setJustBackOnline(false), 1500);
      // Re-sync anything queued while offline and refresh cached agency data.
      flushSyncQueue().catch(() => {});
      refreshPublicData().catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      lastStateRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = React.useMemo(
    () => ({ isOnline, justBackOnline }),
    [isOnline, justBackOnline]
  );

  return <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>;
}

export function useOnline(): OnlineContextValue {
  const ctx = useContext(OnlineContext);
  if (!ctx) return { isOnline: true, justBackOnline: false };
  return ctx;
}

export function isOnlineNow(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
