/**
 * POLAR-X Phase 9 — UAV Autonomy & Return-To-Home (RTL) Types
 * Strict Data Honesty • Link-Loss Detection • Corridor & Geofence Safety Validation
 */

import { CapabilityState } from '../../components/common/CapabilityStatusBadge';

export type UavFlightState =
  | 'IDLE'
  | 'PRE_FLIGHT'
  | 'TAKEOFF'
  | 'MISSION_ACTIVE'
  | 'LINK_DEGRADED'
  | 'LINK_LOST'
  | 'RTL_REQUESTED'
  | 'RTL_ACTIVE'
  | 'RTL_ABORTED'
  | 'LANDING'
  | 'LANDED'
  | 'RECOVERED'
  | 'FAULT'
  | 'HARDWARE_REQUIRED'
  | 'SIMULATED';

export type RtlBlockedReason =
  | 'HOME_POSITION_INVALID'
  | 'GPS_INVALID'
  | 'BATTERY_INSUFFICIENT'
  | 'GEOFENCE_CONFLICT'
  | 'RESTRICTED_ZONE'
  | 'HAZARD_CORRIDOR'
  | 'FLIGHT_CONTROLLER_UNAVAILABLE'
  | 'TELEMETRY_STALE';

export type HomePointType = 'BASE_STATION' | 'FIELD_CAMP' | 'OPERATOR_CUSTOM' | 'LAST_SAFE_LAUNCH';

export interface UavHomePoint {
  id: string;
  name: string;
  type: HomePointType;
  coordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  safetyRadiusMeters: number;
  maxLandingWindKmh: number;
  isVerified: boolean;
  stationOrRegion: string;
  createdAt: string;
}

export type UavFlightCommand =
  | 'REQUEST_RTL'
  | 'ABORT_RTL'
  | 'PAUSE_MISSION'
  | 'RESUME_MISSION'
  | 'RETURN_HOME'
  | 'LAND'
  | 'TAKEOFF';

export interface UavCommandAuditRecord {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  uavId: string;
  command: UavFlightCommand;
  reason: string;
  previousState: UavFlightState;
  resultingState: UavFlightState;
  provider: string;
  executionStatus: 'ACCEPTED' | 'BLOCKED' | 'SIMULATED_SUCCESS' | 'REJECTED_RBAC';
  dataState: CapabilityState;
}

export interface RtlReadinessAssessment {
  isReady: boolean;
  canExecuteRtl: boolean;
  blockedReasons: RtlBlockedReason[];
  batteryRequiredPercent: number;
  batteryAvailablePercent: number;
  distanceToHomeMeters: number;
  estimatedReturnTimeMinutes: number;
  gpsFixValid: boolean;
  geofenceCheckPassed: boolean;
  restrictedZoneViolations: string[];
  recommendedReturnAltitudeMeters: number;
  evaluationTimestamp: string;
  dataState: CapabilityState;
}

export interface UavAutonomyStatus {
  uavId: string;
  flightState: UavFlightState;
  dataState: CapabilityState;
  telemetryFreshnessMs: number;
  linkHealth: 'HEALTHY' | 'DEGRADED' | 'LOST';
  linkQualityPercent: number;
  linkTimeoutSeconds: number;
  selectedHomePoint: UavHomePoint | null;
  currentCoordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  batteryPercent: number;
  gpsSatellites: number;
  activeMissionId?: string;
  rtlReadiness: RtlReadinessAssessment;
  lastCommand?: UavCommandAuditRecord;
  flightControllerName: string;
  isHardwareConnected: boolean;
}
