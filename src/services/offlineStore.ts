const DB_NAME = 'Katisha-offline';
const DB_VERSION = 1;

export type OfflineStoreName = 'kv' | 'route-search' | 'agency' | 'agency-list' | 'sync-queue';

export interface RouteSearchEntry {
  key: string;
  routes: any[];
  fetchedAt: number;
}

export interface AgencyEntry {
  key: string;
  agency: any;
  fetchedAt: number;
}

export interface AgencyListEntry {
  key: string;
  agencies: any[];
  fetchedAt: number;
}

export interface VersionStamp {
  agencies: { count: number; maxUpdatedAt: string | null };
  routes: { count: number; maxUpdatedAt: string | null };
}

export interface SyncQueueItem {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
}

const STORES: OfflineStoreName[] = ['kv', 'route-search', 'agency', 'agency-list', 'sync-queue'];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'key' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecord(store: OfflineStoreName, key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const objStore = tx.objectStore(store);
    objStore.put({ key, value });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    return undefined;
  }
}

export async function getRecord<T = any>(store: OfflineStoreName, key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const objStore = tx.objectStore(store);
    const request = objStore.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result?.value ?? null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return null;
  }
}

export interface RecordEntry<T = any> {
  key: string;
  value: T;
}

export async function getAllRecords<T = any>(store: OfflineStoreName): Promise<RecordEntry<T>[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readonly');
    const objStore = tx.objectStore(store);
    const request = objStore.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve((request.result ?? []).map((r: any) => ({ key: r.key, value: r.value })));
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return [];
  }
}

export async function deleteRecord(store: OfflineStoreName, key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    const objStore = tx.objectStore(store);
    objStore.delete(key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    return undefined;
  }
}

export async function clearStore(store: OfflineStoreName): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch {
    return undefined;
  }
}

// ── Convenience accessors ─────────────────────────────────────────────────────

const VERSION_KEY = 'versions';

export async function getVersionStamp(): Promise<VersionStamp | null> {
  return getRecord<VersionStamp>('kv', VERSION_KEY);
}

export async function setVersionStamp(stamp: VersionStamp): Promise<void> {
  return putRecord('kv', VERSION_KEY, stamp);
}
