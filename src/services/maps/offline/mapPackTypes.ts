/**
 * POLAR-X Offline Vector Map Packs Types
 */

export type MapPackStatus = 'NOT_DOWNLOADED' | 'DOWNLOADING' | 'INSTALLED' | 'UPDATE_AVAILABLE' | 'UNAVAILABLE';

export interface OfflineMapPack {
  id: string;
  packCode: string;
  name: string;
  region: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  sizeMb: number;
  zoomLevels: string; // e.g. "z0 - z14"
  version: string;
  checksumSha256: string;
  status: MapPackStatus;
  downloadProgressPercent?: number;
  installedAt?: string;
  source: string; // e.g. "SCAR Antarctic Digital Database / OpenMapTiles"
  description: string;
}
