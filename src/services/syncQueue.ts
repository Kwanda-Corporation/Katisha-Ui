import { API_BASE } from '../config/apiBase';
import { deleteRecord, getAllRecords, putRecord, SyncQueueItem } from './offlineStore';


export async function enqueueSync(type: string, payload: any): Promise<void> {
  const item: SyncQueueItem = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
  };
  return putRecord('sync-queue', item.id, item);
}

export async function getPendingSync(): Promise<SyncQueueItem[]> {
  const entries = await getAllRecords<SyncQueueItem>('sync-queue');
  return entries.map(e => e.value);
}

async function runHandler(item: SyncQueueItem): Promise<boolean> {
  // Returns true when the item should be removed from the queue.
  try {
    if (item.type === 'auth:register') {
      const { username, password, name, phone } = item.payload;
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, phone }),
      });
      // Server responded (any status) -> the item has been delivered; drop it
      // to avoid retrying forever. Network failure (throw) keeps it queued.
      return true;
    }
    // Unknown type: drop it so it never blocks the queue.
    return true;
  } catch {
    return false;
  }
}

export async function flushSyncQueue(): Promise<void> {
  try {
    const pending = await getPendingSync();
    for (const item of pending) {
      const done = await runHandler(item);
      if (done) {
        await deleteRecord('sync-queue', item.id).catch(() => {});
      }
    }
  } catch {
    // Nothing to do — try again next time we come back online.
  }
}
