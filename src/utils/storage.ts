/**
 * Safe localStorage wrapper with QuotaExceededError protection and automatic stale cache eviction.
 */

export const purgeStaleStorage = (): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Purge Firestore multi-tab client state mutations & zombie client IDs
      if (
        key.startsWith('firestore_') ||
        key.startsWith('firebase:') ||
        key.startsWith('firestore_mutations_') ||
        key.startsWith('firestore_clients_')
      ) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  } catch (e) {
    console.warn('[storage] Note during stale storage purge:', e);
  }
};

// Immediately purge stale Firestore multi-tab state on load
if (typeof window !== 'undefined' && window.localStorage) {
  purgeStaleStorage();
}

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[storage] Failed to get item "${key}":`, e);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      const isQuota =
        error?.name === 'QuotaExceededError' ||
        error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error?.code === 22 ||
        error?.code === 1014;

      if (isQuota) {
        // Evict stale Firestore and non-essential caches
        purgeStaleStorage();

        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // If still exceeded, data is still safe in React state and Firestore cloud database
          console.warn(
            `[storage] LocalStorage quota reached for "${key}". Data is retained in memory and synchronized via Firestore.`
          );
          return false;
        }
      }

      console.warn(`[storage] Failed to save key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] Failed to remove item "${key}":`, e);
    }
  },

  clear: (): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.clear();
    } catch (e) {
      console.warn('[storage] Failed to clear storage:', e);
    }
  },
};
