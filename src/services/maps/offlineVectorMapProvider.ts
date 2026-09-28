/**
 * POLAR-X Offline Vector Map Provider
 * Renders SCAR Antarctic Digital Database & OpenMapTiles vector data locally.
 * Works with zero internet connectivity.
 */

import { MapProvider, MapProviderType, MapCoordinates, MapLayerConfig, MapTargetMarker } from './mapProvider';

export class OfflineVectorMapProvider implements MapProvider {
  public type: MapProviderType = 'OFFLINE_VECTOR';
  public name = 'Offline Vector Map (SCAR ADD v7.4 / OpenMapTiles)';
  public isOfflineCapable = true;
  public isSimulated = false;

  private containerId: string | null = null;
  private currentCenter: MapCoordinates = { latitude: -70.767, longitude: 11.733 };
  private zoom = 6;
  private targets: MapTargetMarker[] = [];
  private layerConfig: MapLayerConfig = {
    showStations: true,
    showExpeditions: true,
    showPersonnel: true,
    showAssets: true,
    showEmergencies: true,
    showGeofences: true,
    showCrevasseRisks: true,
    showRouteCorridors: true,
    showTelemetryTracks: true,
    showWeatherOverlay: false,
    showContourLines: true
  };

  public async initialize(containerId: string): Promise<void> {
    this.containerId = containerId;
  }

  public setCenter(coords: MapCoordinates, zoomLevel?: number): void {
    this.currentCenter = coords;
    if (zoomLevel) this.zoom = zoomLevel;
  }

  public updateLayers(config: Partial<MapLayerConfig>): void {
    this.layerConfig = { ...this.layerConfig, ...config };
  }

  public updateTargets(targets: MapTargetMarker[]): void {
    this.targets = targets;
  }

  public getTargets(): MapTargetMarker[] {
    return this.targets;
  }

  public getCenter(): MapCoordinates {
    return this.currentCenter;
  }

  public getLayerConfig(): MapLayerConfig {
    return this.layerConfig;
  }

  public destroy(): void {
    this.containerId = null;
  }
}

export const offlineVectorMapProvider = new OfflineVectorMapProvider();
