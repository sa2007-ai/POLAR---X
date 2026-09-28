/**
 * POLAR-X Personnel Field Safety & Correlation Types
 */

import { WearableTelemetryRecord } from '../wearables/bleTypes';

export type PersonnelSafetyState =
  | 'NORMAL'
  | 'ATTENTION'
  | 'STALE_TELEMETRY'
  | 'COMMUNICATION_LOST'
  | 'GPS_LOST'
  | 'DEVICE_LOW_BATTERY'
  | 'SOS_ACTIVE';

export interface FieldSafetyAlert {
  alertId: string;
  dedupKey: string;
  personnelId: string;
  personnelName: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  title: string;
  description: string;
  source: 'GPS' | 'WEARABLE' | 'LORA_MESH' | 'RADIO' | 'GEOFENCE' | 'AI_HAZARD';
  timestamp: string;
  isResolved: boolean;
}

export interface PersonnelSafetyStatusSummary {
  personnelId: string;
  personnelName: string;
  role: string;
  expeditionCode: string;
  safetyState: PersonnelSafetyState;
  lastKnownCoordinates: { lat: number; lng: number };
  gpsStatus: 'LIVE' | 'RECENT' | 'STALE' | 'LOST';
  commsStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  wearable?: WearableTelemetryRecord;
  activeAlerts: FieldSafetyAlert[];
  lastSeenAt: string;
}

export interface FieldSafetyRule {
  ruleId: string;
  name: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  thresholdText: string;
  enabled: boolean;
}
