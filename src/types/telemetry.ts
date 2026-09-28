/**
 * POLAR-X Telemetry Domain Model
 */

export type TelemetrySourceType =
  | 'GPS'
  | 'SATELLITE'
  | 'NMEA'
  | 'BEACON'
  | 'UAV'
  | 'MESH'
  | 'SIMULATED'
  | 'MANUAL';

export type TelemetryStatus =
  | 'LIVE'       // < 2 minutes
  | 'RECENT'     // 2 - 10 minutes
  | 'STALE'      // > 10 minutes
  | 'CACHED'     // Loaded from offline IndexedDB
  | 'SIMULATED'  // Synthetic test telemetry
  | 'INVALID'    // Failed coordinate or sanity validation
  | 'OFFLINE';   // Device non-responsive

export interface TelemetryCoordinates {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
}

export interface TelemetryRecord {
  telemetryId: string;
  assetId: string;
  assetName: string;
  expeditionId?: string;
  expeditionCode?: string;
  deviceId: string;
  timestamp: string; // ISO UTC
  receivedAt: string; // ISO UTC
  coordinates: TelemetryCoordinates;
  speedKmh: number;
  headingDegrees: number; // 0 - 359
  batteryLevelPercent: number; // 0 - 100
  signalStrengthDbm: number; // e.g. -65 dBm
  temperatureC?: number;
  source: string; // e.g. "Iridium SBD Gateway", "PistonBully GNSS-01"
  sourceType: TelemetrySourceType;
  accuracyMeters: number;
  isSimulated: boolean;
  status: TelemetryStatus;
  satelliteCount?: number;
  hdop?: number; // Horizontal Dilution of Precision
}

export interface TelemetryFilter {
  assetId?: string;
  expeditionCode?: string;
  sourceType?: TelemetrySourceType;
  status?: TelemetryStatus;
  startTime?: string;
  endTime?: string;
}

export interface DeviceTelemetrySummary {
  deviceId: string;
  assetId: string;
  assetName: string;
  lastRecord: TelemetryRecord;
  historyCount: number;
  status: TelemetryStatus;
  isOnline: boolean;
  routeDeviationStatus: 'ON_ROUTE' | 'NEAR_EDGE' | 'OFF_ROUTE' | 'UNKNOWN';
  deviationDistanceMeters?: number;
}
