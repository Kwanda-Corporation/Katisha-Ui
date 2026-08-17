import api from '../api';
import {
  getRecord, putRecord, setVersionStamp, getVersionStamp,
  VersionStamp, getAllRecords, deleteRecord, OfflineStoreName,
} from './offlineStore';

const API_BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:5001/api';

export interface CachedResult<T> {
  data: T;
  fromCache: boolean;
}

export async function isOnlineNow(): Promise<boolean> {
  if (typeof navigator === 'undefined' || navigator.onLine === false) return false;
  try {
    await fetch(`${API_BASE}/data/offline-version`, { method: 'HEAD' });
    return true;
  } catch {
    return false;
  }
}

export async function fetchVersionStamp(): Promise<VersionStamp | null> {
  try {
    const res = await fetch(`${API_BASE}/data/offline-version`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data;
    if (!data?.agencies || !data?.routes) return null;
    return {
      agencies: data.agencies,
      routes: data.routes,
    };
  } catch {
    return null;
  }
}

function versionChanged(remote: VersionStamp, local: VersionStamp): boolean {
  return JSON.stringify(remote) !== JSON.stringify(local);
}

// Bump this whenever the shape of cached route data changes so stale entries
// written by older builds are never served (e.g. agency objects that only
// carried an abbreviated name).
const ROUTE_SEARCH_SCHEMA = 'v3';

function searchKey(origin: string, destination: string): string {
  return `${ROUTE_SEARCH_SCHEMA}|${origin.toLowerCase().trim()}|${destination.toLowerCase().trim()}`;
}

export async function searchRoutesOffline(
  origin: string,
  destination: string
): Promise<CachedResult<any[]>> {
  const key = searchKey(origin, destination);

  if (navigator.onLine === false) {
    const cached = await getRecord<any>('route-search', key);
    return { data: cached?.routes ?? [], fromCache: !!cached };
  }

  // Route results include dynamic data (prices, service fees). Always hit the
  // network when online so the latest values are shown; the cache is only a
  // fallback for offline use or request failures.
  try {
    const res = await api.searchRoutes({ origin, destination });
    const routes = res.data?.routes || [];
    await putRecord('route-search', key, { routes, fetchedAt: Date.now() });
    return { data: routes, fromCache: false };
  } catch {
    const cached = await getRecord<any>('route-search', key);
    return { data: cached?.routes ?? [], fromCache: !!cached };
  }
}

export async function getPublicAgencyOffline(
  agencyId: string
): Promise<CachedResult<any>> {
  const cached = await getRecord<any>('agency', agencyId);
  if (navigator.onLine === false) {
    return { data: cached?.agency ?? null, fromCache: !!cached };
  }

  try {
    const remoteStamp = await fetchVersionStamp();
    const localStamp = await getVersionStamp();
    const shouldRefetch =
      !cached ||
      !localStamp ||
      (remoteStamp !== null && versionChanged(remoteStamp, localStamp));

    if (shouldRefetch && remoteStamp !== null) {
      const res = await api.getPublicAgency(agencyId);
      const agency = res.data?.agency ?? null;
      await putRecord('agency', agencyId, { agency, fetchedAt: Date.now() });
      await setVersionStamp(remoteStamp);
      return { data: agency, fromCache: false };
    }

    if (cached) return { data: cached.agency, fromCache: true };
  } catch {
    if (cached) return { data: cached.agency, fromCache: true };
  }

  try {
    const res = await api.getPublicAgency(agencyId);
    const agency = res.data?.agency ?? null;
    await putRecord('agency', agencyId, { agency, fetchedAt: Date.now() });
    return { data: agency, fromCache: false };
  } catch {
    return { data: cached?.agency ?? null, fromCache: !!cached };
  }
}

export async function getPublicAgenciesOffline(): Promise<CachedResult<any[]>> {
  const LIST_KEY = 'public';
  const cached = await getRecord<any>('agency-list', LIST_KEY);
  if (navigator.onLine === false) {
    return { data: cached?.agencies ?? [], fromCache: !!cached };
  }

  try {
    const remoteStamp = await fetchVersionStamp();
    const localStamp = await getVersionStamp();
    const shouldRefetch =
      !cached ||
      !localStamp ||
      (remoteStamp !== null && versionChanged(remoteStamp, localStamp));

    if (shouldRefetch && remoteStamp !== null) {
      const res = await api.getPublicAgencies();
      const agencies = res.data?.agencies || [];
      await putRecord('agency-list', LIST_KEY, { agencies, fetchedAt: Date.now() });
      await setVersionStamp(remoteStamp);
      return { data: agencies, fromCache: false };
    }

    if (cached) return { data: cached.agencies, fromCache: true };
  } catch {
    if (cached) return { data: cached.agencies, fromCache: true };
  }

  try {
    const res = await api.getPublicAgencies();
    const agencies = res.data?.agencies || [];
    await putRecord('agency-list', LIST_KEY, { agencies, fetchedAt: Date.now() });
    return { data: agencies, fromCache: false };
  } catch {
    return { data: cached?.agencies ?? [], fromCache: !!cached };
  }
}

/**
 * Re-validates the local agency/route cache against the server version stamp.
 * Called automatically when the browser comes back online.
 */
export async function refreshPublicData(): Promise<void> {
  if (navigator.onLine === false) return;
  try {
    const remoteStamp = await fetchVersionStamp();
    if (!remoteStamp) return;
    const localStamp = await getVersionStamp();
    if (localStamp && !versionChanged(remoteStamp, localStamp)) return;

    const listEntry = await getRecord<any>('agency-list', 'public');
    const agencyEntries = await getAllRecords<any>('agency');
    const searchEntries = await getAllRecords<any>('route-search');
    const tasks: Promise<any>[] = [];
    if (listEntry) {
      tasks.push(
        api.getPublicAgencies().then(res => {
          const agencies = res.data?.agencies || [];
          return putRecord('agency-list', 'public', { agencies, fetchedAt: Date.now() });
        }).catch(() => {})
      );
    }
    for (const entry of agencyEntries) {
      tasks.push(
        api.getPublicAgency(entry.key).then(res => {
          const agency = res.data?.agency ?? null;
          return putRecord('agency', entry.key, { agency, fetchedAt: Date.now() });
        }).catch(() => {})
      );
    }
    for (const entry of searchEntries) {
      const parts = String(entry.key).split('|');
      if (parts.length !== 3 || parts[0] !== ROUTE_SEARCH_SCHEMA) {
        await deleteRecord('route-search', entry.key).catch(() => {});
        continue;
      }
      const [, origin, destination] = parts;
      if (!origin || !destination) continue;
      tasks.push(
        api.searchRoutes({ origin, destination }).then(res => {
          const routes = res.data?.routes || [];
          return putRecord('route-search', entry.key, { routes, fetchedAt: Date.now() });
        }).catch(() => {})
      );
    }

    await Promise.allSettled(tasks);
    await setVersionStamp(remoteStamp);
  } catch {
    // Ignore — retried on the next reconnect.
  }
}

export async function clearOfflineAgencyData(): Promise<void> {
  const keys: OfflineStoreName[] = ['route-search', 'agency', 'agency-list'];
  for (const store of keys) {
    const entries = await getAllRecords<any>(store);
    await Promise.all(entries.map((e: any) => deleteRecord(store, e.key)));
  }
  await deleteRecord('kv', 'versions').catch(() => {});
}
