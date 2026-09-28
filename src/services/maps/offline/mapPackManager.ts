/**
 * POLAR-X Offline Vector Map Pack Manager
 */

import { OfflineMapPack } from './mapPackTypes';

export const INITIAL_MAP_PACKS: OfflineMapPack[] = [
  {
    id: 'pack-qml',
    packCode: 'MAP-QML-01',
    name: 'Queen Maud Land / Schirmacher Oasis Sector',
    region: 'Maitri Station Operations Area',
    bounds: {
      minLat: -72.0,
      maxLat: -69.5,
      minLng: 9.0,
      maxLng: 15.0
    },
    sizeMb: 85.4,
    zoomLevels: 'z0 - z15',
    version: '2026.2',
    checksumSha256: '9a8f7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a',
    status: 'INSTALLED',
    installedAt: '2026-09-20T08:00:00Z',
    source: 'SCAR Antarctic Digital Database (ADD v7.4)',
    description: 'High-resolution topographic vector contours, nunatak outlines, and ice shelf coastlines for Maitri traverses.'
  },
  {
    id: 'pack-lh',
    packCode: 'MAP-LH-02',
    name: 'Larsemann Hills & Prydz Bay Coastal Sector',
    region: 'Bharati Station Operations Area',
    bounds: {
      minLat: -70.5,
      maxLat: -68.8,
      minLng: 74.5,
      maxLng: 78.0
    },
    sizeMb: 64.2,
    zoomLevels: 'z0 - z15',
    version: '2026.2',
    checksumSha256: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    status: 'INSTALLED',
    installedAt: '2026-09-22T10:15:00Z',
    source: 'SCAR Antarctic Digital Database (ADD v7.4)',
    description: 'Coastal bathymetry, ice margin cliffs, Grovenes peninsula ridges, and crevasse field boundary vector layers.'
  },
  {
    id: 'pack-sp',
    packCode: 'MAP-SP-03',
    name: 'Amundsen-Scott South Pole Polar Plateau',
    region: 'South Pole High Plateau',
    bounds: {
      minLat: -90.0,
      maxLat: -85.0,
      minLng: -180.0,
      maxLng: 180.0
    },
    sizeMb: 142.8,
    zoomLevels: 'z0 - z12',
    version: '2026.1',
    checksumSha256: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    status: 'NOT_DOWNLOADED',
    source: 'USGS Antarctic Surface Elevation Model',
    description: 'Deep polar plateau firn elevation contours and geomagnetic field magnetic declination grid.'
  },
  {
    id: 'pack-tam',
    packCode: 'MAP-TAM-04',
    name: 'Transantarctic Mountains & Dry Valleys Corridor',
    region: 'McMurdo Sound & Ross Sector',
    bounds: {
      minLat: -80.0,
      maxLat: -76.0,
      minLng: 155.0,
      maxLng: 172.0
    },
    sizeMb: 198.5,
    zoomLevels: 'z0 - z14',
    version: '2026.1',
    checksumSha256: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
    status: 'NOT_DOWNLOADED',
    source: 'BAS Antarctic Topographic Model',
    description: 'Glacial outlet corridors, blue ice runways, and mountain peak pass routes.'
  }
];

class MapPackManager {
  private packs: OfflineMapPack[] = [...INITIAL_MAP_PACKS];
  private listeners: Set<(packs: OfflineMapPack[]) => void> = new Set();

  public getPacks(): OfflineMapPack[] {
    return this.packs;
  }

  public getInstalledPacks(): OfflineMapPack[] {
    return this.packs.filter((p) => p.status === 'INSTALLED');
  }

  public getTotalStorageUsedMb(): number {
    return this.getInstalledPacks().reduce((sum, p) => sum + p.sizeMb, 0);
  }

  public async installPack(id: string): Promise<void> {
    const pack = this.packs.find((p) => p.id === id);
    if (!pack) return;

    pack.status = 'DOWNLOADING';
    pack.downloadProgressPercent = 10;
    this.notify();

    // Simulated progressive chunk caching
    for (let progress = 25; progress <= 100; progress += 25) {
      await new Promise((r) => setTimeout(r, 400));
      pack.downloadProgressPercent = progress;
      this.notify();
    }

    pack.status = 'INSTALLED';
    pack.installedAt = new Date().toISOString();
    pack.downloadProgressPercent = undefined;
    this.notify();
  }

  public removePack(id: string): void {
    const pack = this.packs.find((p) => p.id === id);
    if (!pack) return;

    pack.status = 'NOT_DOWNLOADED';
    pack.installedAt = undefined;
    this.notify();
  }

  public subscribe(listener: (packs: OfflineMapPack[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.packs);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l([...this.packs]));
  }
}

export const mapPackManager = new MapPackManager();
