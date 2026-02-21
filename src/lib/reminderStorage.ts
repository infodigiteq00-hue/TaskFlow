/**
 * Persists reminder schedules to IndexedDB and notifies the service worker.
 * Used so reminders can fire when the tab is in background (SW) or show when
 * the user returns (missed-reminder check from IndexedDB).
 */

const DB_NAME = 'taskflow-reminders';
const DB_VERSION = 1;
const STORE_NAME = 'schedules';

export interface StoredReminder {
  id: string;
  fireAt: number;
  title: string;
  body: string;
  task: import('@/types/task').Task;
  reminder: import('@/types/task').TaskReminder;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
  });
}

/** Generate a unique id for a reminder schedule (task id + setAt). */
export function reminderScheduleId(taskId: string, setAt: string): string {
  return `${taskId}:${setAt}`;
}

/** Save a reminder schedule and tell the service worker to show it at fireAt. */
export function scheduleReminder(payload: StoredReminder): void {
  openDB()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(payload);
      db.close();
    })
    .catch(() => {});

  const sw = navigator.serviceWorker?.controller;
  if (sw) {
    sw.postMessage({
      type: 'SCHEDULE_REMINDER',
      payload: {
        id: payload.id,
        fireAt: payload.fireAt,
        title: payload.title,
        body: payload.body,
      },
    });
  }
}

/** Remove a reminder schedule and tell the service worker to cancel it. */
export function cancelReminder(id: string): void {
  openDB()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      db.close();
    })
    .catch(() => {});

  const sw = navigator.serviceWorker?.controller;
  if (sw) {
    sw.postMessage({ type: 'CANCEL_REMINDER', id });
  }
}

/** Get the next missed reminder (fireAt <= now), remove it from DB, and return it. */
export function getAndConsumeNextMissed(): Promise<StoredReminder | null> {
  const now = Date.now();
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();

      let found: StoredReminder | null = null;

      req.onsuccess = () => {
        const cursor = req.result;
        if (found != null) {
          db.close();
          resolve(found);
          return;
        }
        if (!cursor) {
          db.close();
          resolve(null);
          return;
        }
        const rec = cursor.value as StoredReminder;
        if (rec.fireAt <= now) {
          found = rec;
          store.delete(rec.id);
        }
        cursor.continue();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  });
}
