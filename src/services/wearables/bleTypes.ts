/**
 * POLAR-X BLE Wearable Biometrics & Telemetry Types
 * Polar environmental field biometric telemetry (Heart Rate, Peripheral Skin Temperature, Exertion).
 * DISCLAIMER: Designed for expedition environmental safety monitoring, NOT for clinical medical diagnosis.
 */

export type BleConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'UNAVAILABLE'
  | 'PERMISSION_REQUIRED'
  | 'SIMULATED'
  | 'ERROR';

export type PersonnelActivityLevel =
  | 'RESTING'
  | 'WALKING'
  | 'TRAVERSING'
  | 'HIGH_EXERTION'
  | 'IMMOBILE';

export interface WearableTelemetryRecord {
  recordId: string;
  deviceId: string;
  deviceName: string;
  personnelId: string;
  personnelName: string;
  timestamp: string;
  heartRateBpm: number;
  skinTempC: number;
  coreTempEstC?: number;
  activityLevel: PersonnelActivityLevel;
  batteryPercent: number;
  signalRssi: number;
  isSimulated: boolean;
  hasHypothermiaRisk: boolean;
  hasExertionWarning: boolean;
  isImmobile: boolean;
  freshness: 'LIVE' | 'RECENT' | 'STALE';
}

export interface BleDeviceInfo {
  id: string;
  name: string;
  status: BleConnectionStatus;
  batteryPercent?: number;
  pairedPersonnelId?: string;
  pairedPersonnelName?: string;
  connectedAt?: string;
}
