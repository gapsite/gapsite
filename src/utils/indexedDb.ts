/**
 * IndexedDB Persistent Storage Engine for CRM Data
 * 
 * IndexedDB provides several gigabytes of offline storage, bypassing
 * browser localStorage 5MB quota limitations and preventing data loss
 * from browser storage eviction or large document attachments.
 */

const DB_NAME = 'VerixCrmOfflineDB';
const DB_VERSION = 2;

export interface CrmStorageSnapshot {
  id: string;
  timestamp: string;
  description: string;
  data: {
    projects?: any[];
    dispositions?: any[];
    transactions?: any[];
    receivables?: any[];
    taxObligations?: any[];
    governmentProjects?: any[];
    retailProjects?: any[];
    overheadExpenses?: any[];
    officeRentContracts?: any[];
    payroll?: any[];
    teamMembers?: any[];
    [key: string]: any;
  };
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export const getIndexedDb = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for individual collections
      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'key' });
      }

      // Object store for rolling automated backups (snapshots)
      if (!db.objectStoreNames.contains('snapshots')) {
        const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
        snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      console.warn('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };
  });

  return dbInitPromise;
};

/**
 * Save collection data to IndexedDB
 */
export const saveCollectionToIndexedDb = async (key: string, data: any): Promise<boolean> => {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction('collections', 'readwrite');
      const store = tx.objectStore('collections');
      store.put({ key, data, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.warn(`[IndexedDB] Error saving ${key}:`, tx.error);
        resolve(false);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Save collection failed for ${key}:`, err);
    return false;
  }
};

/**
 * Load collection data from IndexedDB
 */
export const loadCollectionFromIndexedDb = async <T = any>(key: string): Promise<T | null> => {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction('collections', 'readonly');
      const store = tx.objectStore('collections');
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result && request.result.data !== undefined) {
          resolve(request.result.data as T);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Load collection failed for ${key}:`, err);
    return null;
  }
};

/**
 * Save a full rolling safety snapshot
 */
export const saveAutoSnapshotToIndexedDb = async (snapshotData: CrmStorageSnapshot['data']): Promise<void> => {
  try {
    const db = await getIndexedDb();
    const id = `snap-${Date.now()}`;
    const snapshot: CrmStorageSnapshot = {
      id,
      timestamp: new Date().toISOString(),
      description: `Auto-Backup ${new Date().toLocaleString('id-ID')}`,
      data: snapshotData,
    };

    return new Promise((resolve) => {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      store.put(snapshot);

      // Keep only the 10 most recent snapshots
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > 10) {
          const cursorReq = store.openCursor();
          let deletedCount = 0;
          const toDelete = countReq.result - 10;
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor && deletedCount < toDelete) {
              store.delete(cursor.primaryKey);
              deletedCount++;
              cursor.continue();
            }
          };
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to save auto snapshot:', err);
  }
};

/**
 * Get all available snapshots from IndexedDB
 */
export const getAllSnapshotsFromIndexedDb = async (): Promise<CrmStorageSnapshot[]> => {
  try {
    const db = await getIndexedDb();
    return new Promise((resolve) => {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []) as CrmStorageSnapshot[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};
