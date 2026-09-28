/**
 * POLAR-X Map Provider Abstraction
 * Supports Google Maps, Offline Vector Maps (MBTiles/SCAR Vector), and Tactical Polar Grid.
 */

export type MapProviderType = 'GOOGLE_MAPS' | 'OFFLINE_VECTOR' | 'TACTICAL_POLAR';

export interface MapLayerConfig {
  showStations: boolean;
  showExpeditions: boolean;
  showPersonnel: boolean;
  showAssets: boolean;
  showEmergencies: boolean;
  showGeofences: boolean;
  showCrevasseRisks: boolean;
  showRouteCorridors: boolean;
  showTelemetryTracks: boolean;
  showWeatherOverlay: boolean;
  showContourLines: boolean;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface MapTargetMarker {
  id: string;
  type: 'STATION' | 'EXPEDITION' | 'PERSONNEL' | 'ASSET' | 'EMERGENCY' | 'UAV' | 'GEOFENCE' | 'CREVASSE';
  title: string;
  coordinates: MapCoordinates;
  status?: string;
  isSimulated?: boolean;
  metadata?: Record<string, any>;
}

export interface MapProvider {
  type: MapProviderType;
  name: string;
  isOfflineCapable: boolean;
  isSimulated: boolean;
  initialize(containerId: string): Promise<void>;
  setCenter(coords: MapCoordinates, zoomLevel?: number): void;
  updateLayers(config: Partial<MapLayerConfig>): void;
  updateTargets(targets: MapTargetMarker[]): void;
  destroy(): void;
}
