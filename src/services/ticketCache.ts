const DB_NAME = 'Katisha-tickets';
const DB_VERSION = 1;
const STORE_NAME = 'tickets';

interface CachedTicket {
  bookingId: string;
  ticketImageUrl: string;
  ticketImageBlob?: Blob;
  bookingData: any;
  cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'bookingId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheTicket(
  bookingId: string,
  ticketImageUrl: string,
  bookingData: any,
  ticketImageBlob?: Blob
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: CachedTicket = {
      bookingId,
      ticketImageUrl,
      bookingData,
      ticketImageBlob,
      cachedAt: Date.now(),
    };

    store.put(record);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}

/**
 * Fetches the ticket image bytes and stores them locally so the ticket can be
 * viewed offline (a plain URL is useless once the network is gone).
 */
export async function cacheTicketWithImage(
  bookingId: string,
  ticketImageUrl: string,
  bookingData: any
): Promise<void> {
  try {
    const blob = await fetch(ticketImageUrl).then(r => (r.ok ? r.blob() : null));
    await cacheTicket(bookingId, ticketImageUrl, bookingData, blob ?? undefined);
  } catch {
    await cacheTicket(bookingId, ticketImageUrl, bookingData);
  }
}

export async function getAllCachedTickets(): Promise<CachedTicket[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? []);
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

export async function getCachedTicket(
  bookingId: string
): Promise<CachedTicket | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(bookingId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result ?? null);
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

export async function removeCachedTicket(
  bookingId: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(bookingId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}

export async function clearExpiredTickets(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    const now = Date.now();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          db.close();
          resolve();
          return;
        }

        const ticket = cursor.value as CachedTicket;
        const travelDate = ticket.bookingData?.travelDate;

        if (travelDate) {
          const travelTime = new Date(travelDate).getTime();
          if (!isNaN(travelTime) && travelTime < now) {
            cursor.delete();
          }
        }

        cursor.continue();
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}

export async function clearAllTickets(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}
