/**
 * POLAR-X Weather Service
 * Pluggable weather architecture with IndexedDB local caching.
 */

import { WeatherProvider } from './weatherProvider';
import { demoWeatherProvider } from './demoWeatherProvider';
import { WeatherSnapshot } from './weatherTypes';
import { offlineDB, STORES } from '../offline/offlineDb';

class WeatherService {
  private activeProvider: WeatherProvider = demoWeatherProvider;
  private memoryCache: Map<string, { snapshot: WeatherSnapshot; fetchedAt: number }> = new Map();
  private cacheTtlMs = 15 * 60 * 1000; // 15 minutes

  public setProvider(provider: WeatherProvider): void {
    this.activeProvider = provider;
    this.memoryCache.clear();
  }

  public getProviderName(): string {
    return this.activeProvider.name;
  }

  public isSimulated(): boolean {
    return this.activeProvider.isSimulated;
  }

  public async getWeatherForStation(
    stationName: string,
    lat: number,
    lng: number
  ): Promise<WeatherSnapshot> {
    const cacheKey = `station_${stationName}`;
    const cached = this.memoryCache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return cached.snapshot;
    }

    try {
      const snapshot = await this.activeProvider.getWeatherForStation(stationName, lat, lng);
      this.memoryCache.set(cacheKey, { snapshot, fetchedAt: Date.now() });
      await offlineDB.put(STORES.WEATHER, { key: cacheKey, ...snapshot });
      return snapshot;
    } catch (err) {
      console.warn(`[POLAR-X Weather] Failed to fetch station weather for ${stationName}, falling back to offline cache:`, err);
      const fallback = await offlineDB.get<any>(STORES.WEATHER, cacheKey);
      if (fallback) {
        return {
          ...fallback,
          source: 'CACHED'
        };
      }
      return demoWeatherProvider.getWeatherForStation(stationName, lat, lng);
    }
  }

  public async getAllStationWeather(): Promise<WeatherSnapshot[]> {
    try {
      const results = await this.activeProvider.getAllStationWeather();
      for (const snap of results) {
        const key = `station_${snap.stationOrRegion}`;
        this.memoryCache.set(key, { snapshot: snap, fetchedAt: Date.now() });
        await offlineDB.put(STORES.WEATHER, { key, ...snap });
      }
      return results;
    } catch (err) {
      console.warn('[POLAR-X Weather] Error fetching all station weather:', err);
      const cached = await offlineDB.getAll<any>(STORES.WEATHER);
      if (cached.length > 0) {
        return cached.map((c) => ({ ...c, source: 'CACHED' }));
      }
      return demoWeatherProvider.getAllStationWeather();
    }
  }

  public async getWeatherForCoordinates(
    lat: number,
    lng: number,
    label?: string
  ): Promise<WeatherSnapshot> {
    return this.activeProvider.getWeatherForCoordinates(lat, lng, label);
  }
}

export const weatherService = new WeatherService();
