/**
 * POLAR-X Solar Activity Service
 */

import { SolarProvider } from './solarProvider';
import { demoSolarProvider } from './demoSolarProvider';
import { SolarActivitySnapshot } from './solarTypes';
import { offlineDB, STORES } from '../offline/offlineDb';

class SolarService {
  private activeProvider: SolarProvider = demoSolarProvider;
  private cachedSnapshot: { snapshot: SolarActivitySnapshot; fetchedAt: number } | null = null;
  private cacheTtlMs = 15 * 60 * 1000; // 15 mins

  public setProvider(provider: SolarProvider): void {
    this.activeProvider = provider;
    this.cachedSnapshot = null;
  }

  public getProviderName(): string {
    return this.activeProvider.name;
  }

  public isSimulated(): boolean {
    return this.activeProvider.isSimulated;
  }

  public async getSolarActivity(): Promise<SolarActivitySnapshot> {
    if (this.cachedSnapshot && Date.now() - this.cachedSnapshot.fetchedAt < this.cacheTtlMs) {
      return this.cachedSnapshot.snapshot;
    }

    try {
      const snap = await this.activeProvider.getCurrentSolarActivity();
      this.cachedSnapshot = { snapshot: snap, fetchedAt: Date.now() };
      await offlineDB.put(STORES.SOLAR, { key: 'current_solar', ...snap });
      return snap;
    } catch (err) {
      console.warn('[POLAR-X Solar] Failed to fetch solar activity, loading offline cache:', err);
      const fallback = await offlineDB.get<any>(STORES.SOLAR, 'current_solar');
      if (fallback) {
        return {
          ...fallback,
          source: 'CACHED'
        };
      }
      return demoSolarProvider.getCurrentSolarActivity();
    }
  }
}

export const solarService = new SolarService();
