/**
 * POLAR-X Unified Map Provider Service
 * Orchestrates mode selection between Google Maps, Offline Vector Maps, and Tactical Polar Grid.
 */

import { MapProvider, MapProviderType } from './mapProvider';
import { onlineMapProvider } from './onlineMapProvider';
import { offlineVectorMapProvider } from './offlineVectorMapProvider';
import { tacticalPolarMapProvider } from './tacticalPolarMapProvider';

export class MapProviderService {
  private currentMode: MapProviderType = 'GOOGLE_MAPS';
  private subscribers: Set<(mode: MapProviderType) => void> = new Set();

  public getActiveMode(): MapProviderType {
    return this.currentMode;
  }

  public setMode(mode: MapProviderType): void {
    this.currentMode = mode;
    this.subscribers.forEach((cb) => cb(this.currentMode));
  }

  public getActiveProvider(): MapProvider {
    switch (this.currentMode) {
      case 'OFFLINE_VECTOR':
        return offlineVectorMapProvider;
      case 'TACTICAL_POLAR':
        return tacticalPolarMapProvider;
      case 'GOOGLE_MAPS':
      default:
        return onlineMapProvider;
    }
  }

  public subscribeMode(cb: (mode: MapProviderType) => void): () => void {
    this.subscribers.add(cb);
    cb(this.currentMode);
    return () => this.subscribers.delete(cb);
  }
}

export const mapProviderService = new MapProviderService();
