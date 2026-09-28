/**
 * POLAR-X Cache Service
 * Bridges memory/cloud state and IndexedDB local store.
 */

import { offlineDB, STORES } from './offlineDb';
import {
  Expedition,
  Personnel,
  CargoItem,
  InventoryItem,
  PolarAsset,
  EmergencyIncident,
  PolarNotification,
  PolarActivityLog
} from '../../types';
import { GeofenceZone } from '../../types/geofence';

export const CACHE_KEYS = {
  LAST_SYNC: 'polarx_last_sync_timestamp',
  STALE_THRESHOLD_MS: 30 * 60 * 1000 // 30 minutes threshold for stale indicator
};

export interface CacheFreshnessInfo {
  lastSyncTimestamp: number | null;
  lastSyncFormatted: string;
  isStale: boolean;
  status: 'LIVE' | 'RECENT' | 'CACHED' | 'STALE' | 'SIMULATED' | 'UNAVAILABLE';
}

class CacheService {
  /**
   * Save full domain snapshot to IndexedDB cache
   */
  public async cacheDomainSnapshot(data: {
    expeditions?: Expedition[];
    personnel?: Personnel[];
    cargo?: CargoItem[];
    inventory?: InventoryItem[];
    assets?: PolarAsset[];
    emergencies?: EmergencyIncident[];
    geofences?: GeofenceZone[];
    notifications?: PolarNotification[];
    activityLogs?: PolarActivityLog[];
    routes?: any[];
  }): Promise<void> {
    try {
      if (data.expeditions && data.expeditions.length > 0) {
        await offlineDB.putAll(STORES.EXPEDITIONS, data.expeditions);
      }
      if (data.personnel && data.personnel.length > 0) {
        await offlineDB.putAll(STORES.PERSONNEL, data.personnel);
      }
      if (data.cargo && data.cargo.length > 0) {
        await offlineDB.putAll(STORES.CARGO, data.cargo);
      }
      if (data.inventory && data.inventory.length > 0) {
        await offlineDB.putAll(STORES.INVENTORY, data.inventory);
      }
      if (data.assets && data.assets.length > 0) {
        await offlineDB.putAll(STORES.ASSETS, data.assets);
      }
      if (data.emergencies && data.emergencies.length > 0) {
        await offlineDB.putAll(STORES.EMERGENCIES, data.emergencies);
      }
      if (data.geofences && data.geofences.length > 0) {
        await offlineDB.putAll(STORES.GEOFENCES, data.geofences);
      }
      if (data.notifications && data.notifications.length > 0) {
        await offlineDB.putAll(STORES.NOTIFICATIONS, data.notifications);
      }
      if (data.activityLogs && data.activityLogs.length > 0) {
        await offlineDB.putAll(STORES.ACTIVITY_LOGS, data.activityLogs);
      }
      if (data.routes && data.routes.length > 0) {
        await offlineDB.putAll(STORES.ROUTES, data.routes);
      }

      await this.setLastSyncTimestamp(Date.now());
    } catch (err) {
      console.warn('[POLAR-X Cache] Error writing snapshot to cache:', err);
    }
  }

  /**
   * Load full domain snapshot from IndexedDB cache
   */
  public async loadDomainSnapshot(): Promise<{
    expeditions: Expedition[];
    personnel: Personnel[];
    cargo: CargoItem[];
    inventory: InventoryItem[];
    assets: PolarAsset[];
    emergencies: EmergencyIncident[];
    geofences: GeofenceZone[];
    notifications: PolarNotification[];
    activityLogs: PolarActivityLog[];
    routes: any[];
  }> {
    const [
      expeditions,
      personnel,
      cargo,
      inventory,
      assets,
      emergencies,
      geofences,
      notifications,
      activityLogs,
      routes
    ] = await Promise.all([
      offlineDB.getAll<Expedition>(STORES.EXPEDITIONS),
      offlineDB.getAll<Personnel>(STORES.PERSONNEL),
      offlineDB.getAll<CargoItem>(STORES.CARGO),
      offlineDB.getAll<InventoryItem>(STORES.INVENTORY),
      offlineDB.getAll<PolarAsset>(STORES.ASSETS),
      offlineDB.getAll<EmergencyIncident>(STORES.EMERGENCIES),
      offlineDB.getAll<GeofenceZone>(STORES.GEOFENCES),
      offlineDB.getAll<PolarNotification>(STORES.NOTIFICATIONS),
      offlineDB.getAll<PolarActivityLog>(STORES.ACTIVITY_LOGS),
      offlineDB.getAll<any>(STORES.ROUTES)
    ]);

    return {
      expeditions,
      personnel,
      cargo,
      inventory,
      assets,
      emergencies,
      geofences,
      notifications,
      activityLogs,
      routes
    };
  }

  public async setLastSyncTimestamp(timestamp: number): Promise<void> {
    await offlineDB.setMetadata(CACHE_KEYS.LAST_SYNC, timestamp);
  }

  public async getLastSyncTimestamp(): Promise<number | null> {
    return await offlineDB.getMetadata<number>(CACHE_KEYS.LAST_SYNC);
  }

  public async getFreshnessInfo(isOnline: boolean, isCloudConnected: boolean): Promise<CacheFreshnessInfo> {
    const lastSync = await this.getLastSyncTimestamp();
    const now = Date.now();

    if (!lastSync) {
      return {
        lastSyncTimestamp: null,
        lastSyncFormatted: 'Never synchronized',
        isStale: true,
        status: !isOnline ? 'UNAVAILABLE' : 'SIMULATED'
      };
    }

    const diffMs = now - lastSync;
    const isStale = diffMs > CACHE_KEYS.STALE_THRESHOLD_MS;
    const minutesAgo = Math.floor(diffMs / 60000);
    const lastSyncFormatted =
      minutesAgo < 1
        ? 'Just now'
        : minutesAgo < 60
        ? `${minutesAgo}m ago (${new Date(lastSync).toUTCString().slice(17, 22)} UTC)`
        : `${Math.floor(minutesAgo / 60)}h ${minutesAgo % 60}m ago`;

    let status: CacheFreshnessInfo['status'] = 'CACHED';
    if (isOnline && isCloudConnected) {
      status = minutesAgo < 2 ? 'LIVE' : 'RECENT';
    } else if (isStale) {
      status = 'STALE';
    } else {
      status = 'CACHED';
    }

    return {
      lastSyncTimestamp: lastSync,
      lastSyncFormatted,
      isStale,
      status
    };
  }
}

export const cacheService = new CacheService();
