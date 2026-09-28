/**
 * POLAR-X IndexedDB Local Offline Cache Architecture
 * Database Name: polarx-offline-db
 * Version: 2
 */

export const DB_NAME = 'polarx_offline_db';
export const DB_VERSION = 2;

export const STORES = {
  EXPEDITIONS: 'expeditions',
  PERSONNEL: 'personnel',
  CARGO: 'cargo',
  INVENTORY: 'inventory',
  ASSETS: 'assets',
  EMERGENCIES: 'emergencies',
  GEOFENCES: 'geofences',
  ROUTES: 'routes',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
  WEATHER: 'weather',
  SOLAR: 'solar',
  MUTATION_QUEUE: 'mutationQueue',
  CONFLICTS: 'conflicts',
  METADATA: 'metadata'
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

export interface QueuedMutation {
  mutationId: string;
  entityType: StoreName | 'expeditions' | 'personnel' | 'cargo' | 'inventory' | 'assets' | 'emergencies' | 'geofences' | 'routes' | 'notifications';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: string;
  createdBy: string;
  retryCount: number;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  clientTimestamp: number;
  errorMessage?: string;
  version?: number;
}

export interface SyncConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: number;
  serverVersion: number;
  localPayload: any;
  serverPayload: any;
  localUpdatedAt: string;
  serverUpdatedAt: string;
  localUpdatedBy: string;
  serverUpdatedBy: string;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'DISCARDED';
  resolution?: {
    resolvedBy: string;
    resolvedAt: string;
    chosenPayload: any;
    strategy: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'CUSTOM';
  };
}

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not supported in this environment.');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (_event) => {
          const db = request.result;
          Object.values(STORES).forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              if (storeName === STORES.MUTATION_QUEUE) {
                const store = db.createObjectStore(storeName, { keyPath: 'mutationId' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
              } else if (storeName === STORES.CONFLICTS) {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('entityId', 'entityId', { unique: false });
              } else if (storeName === STORES.METADATA) {
                db.createObjectStore(storeName, { keyPath: 'key' });
              } else if (storeName === STORES.WEATHER || storeName === STORES.SOLAR) {
                db.createObjectStore(storeName, { keyPath: 'key' });
              } else {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                if (storeName === STORES.EXPEDITIONS || storeName === STORES.CARGO) {
                  store.createIndex('status', 'status', { unique: false });
                }
              }
            }
          });
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to getAll from ${storeName}:`, err);
      return [];
    }
  }

  public async get<T>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to get ${String(key)} from ${storeName}:`, err);
      return null;
    }
  }

  public async put<T>(storeName: StoreName, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to put into ${storeName}:`, err);
    }
  }

  public async putAll<T>(storeName: StoreName, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        items.forEach((item) => store.put(item));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to putAll into ${storeName}:`, err);
    }
  }

  public async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to delete from ${storeName}:`, err);
    }
  }

  public async clear(storeName: StoreName): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn(`[POLAR-X IDB] Failed to clear ${storeName}:`, err);
    }
  }

  public async setMetadata(key: string, value: any): Promise<void> {
    await this.put(STORES.METADATA, { key, value, timestamp: Date.now() });
  }

  public async getMetadata<T = any>(key: string): Promise<T | null> {
    const record = await this.get<{ key: string; value: T; timestamp: number }>(STORES.METADATA, key);
    return record ? record.value : null;
  }
}

export const offlineDB = new OfflineDB();
