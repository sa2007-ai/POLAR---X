/**
 * POLAR-X GPS Types & Data Definitions
 * Direct Web Serial GNSS interfacing schemas
 */

export type GpsBaudRate = 4800 | 9600 | 38400 | 115200;

export type GpsConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR'
  | 'UNSUPPORTED';

export type GpsFixType = 'NO_FIX' | '2D' | '3D';

export type GpsQualityStatus = 'VALID' | 'DEGRADED' | 'STALE' | 'INVALID';

export interface GpsDeviceInfo {
  portName?: string;
  usbVendorId?: number;
  usbProductId?: number;
  manufacturer?: string;
  baudRate: GpsBaudRate;
  connectedAt?: string;
}

export interface GpsQualityReport {
  status: GpsQualityStatus;
  fixType: GpsFixType;
  satellites: number;
  hdop?: number;
  accuracyMeters?: number;
  lastSentenceAt?: string;
  speedKmh?: number;
  heading?: number;
  hasCoordinateJump: boolean;
  hasSpeedAnomaly: boolean;
  isStale: boolean;
  errors: string[];
}
