/**
 * POLAR-X Tactical Polar Grid Map Provider
 * Radar polar coordinates fallback map provider.
 */

import { MapProvider, MapProviderType, MapCoordinates, MapLayerConfig, MapTargetMarker } from './mapProvider';

export class TacticalPolarMapProvider implements MapProvider {
  public type: MapProviderType = 'TACTICAL_POLAR';
  public name = 'Tactical Polar Mesh Grid';
  public isOfflineCapable = true;
  public isSimulated = false;

  private containerId: string | null = null;
  private currentCenter: MapCoordinates = { latitude: -70.767, longitude: 11.733 };
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

  public setCenter(coords: MapCoordinates, _zoomLevel?: number): void {
    this.currentCenter = coords;
  }

  public updateLayers(config: Partial<MapLayerConfig>): void {
    this.layerConfig = { ...this.layerConfig, ...config };
  }

  public updateTargets(_targets: MapTargetMarker[]): void {}

  public destroy(): void {
    this.containerId = null;
  }
}

export const tacticalPolarMapProvider = new TacticalPolarMapProvider();
