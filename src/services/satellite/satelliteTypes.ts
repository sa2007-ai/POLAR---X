/**
 * POLAR-X Phase 9 — Satellite Broadband & Iridium Certus Types
 * Strict Data Honesty • Multi-Priority Queue (P0-P5) • Multi-Provider Architecture
 */

import { CapabilityState } from '../../components/common/CapabilityStatusBadge';

export type SatelliteConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'LINK_LOST'
  | 'CONFIGURATION_REQUIRED'
  | 'HARDWARE_REQUIRED'
  | 'SIMULATED';

export type SatelliteMessagePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface PriorityDefinition {
  level: SatelliteMessagePriority;
  name: string;
  description: string;
  maxRetries: number;
  timeoutMs: number;
  bandwidthCapBytes: number;
}

export const SATELLITE_PRIORITIES: Record<SatelliteMessagePriority, PriorityDefinition> = {
  P0: {
    level: 'P0',
    name: 'Emergency / SOS',
    description: 'Life-critical Mayday, SAR beacon, distress packet',
    maxRetries: 10,
    timeoutMs: 30000,
    bandwidthCapBytes: 512
  },
  P1: {
    level: 'P1',
    name: 'Personnel Safety',
    description: 'Biometric vitals alerts, hypothermia triggers, man-down status',
    maxRetries: 7,
    timeoutMs: 45000,
    bandwidthCapBytes: 1024
  },
  P2: {
    level: 'P2',
    name: 'Critical Telemetry',
    description: 'Real-time GNSS positional fix, vehicle rollover / collision',
    maxRetries: 5,
    timeoutMs: 60000,
    bandwidthCapBytes: 2048
  },
  P3: {
    level: 'P3',
    name: 'Route & Geofence Alerts',
    description: 'Crevasse breaches, corridor deviations, weather storm advisories',
    maxRetries: 4,
    timeoutMs: 90000,
    bandwidthCapBytes: 4096
  },
  P4: {
    level: 'P4',
    name: 'Operational Telemetry',
    description: 'Fuel reserve level, battery voltage, solar array efficiency',
    maxRetries: 3,
    timeoutMs: 180000,
    bandwidthCapBytes: 8192
  },
  P5: {
    level: 'P5',
    name: 'Sync & Background Data',
    description: 'Inventory audits, scientific survey logs, cached database mutations',
    maxRetries: 2,
    timeoutMs: 300000,
    bandwidthCapBytes: 32768
  }
};

export type SatelliteMessageStatus =
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'RETRYING'
  | 'FAILED'
  | 'UNAVAILABLE';

export interface SatelliteMessage {
  id: string;
  priority: SatelliteMessagePriority;
  topic: string;
  payload: Record<string, any> | string;
  byteSize: number;
  createdAt: string;
  status: SatelliteMessageStatus;
  retryCount: number;
  lastAttemptAt?: string;
  acknowledgedAt?: string;
  errorMessage?: string;
  traceId: string;
  destination: string;
  sourceStationOrAsset: string;
  offlineQueued?: boolean;
}

export interface SatelliteSessionInfo {
  sessionId: string;
  providerType: 'IRIDIUM_CERTUS' | 'STARLINK_POLAR' | 'INMARSAT_BGAN' | 'SIMULATED_CERTUS' | 'CUSTOM_BRIDGE';
  providerName: string;
  connectionState: SatelliteConnectionState;
  dataState: CapabilityState;
  ipAddress?: string;
  gatewayHost?: string;
  connectedAt?: string;
  lastContactAt: string;
  signalStrengthDbm: number; // e.g. -85 dBm to -115 dBm
  signalQualityPercent: number; // 0 to 100%
  uplinkBandwidthKbps: number;
  downlinkBandwidthKbps: number;
  roundTripLatencyMs: number;
  beamId?: string;
  satelliteElevationDeg?: number;
  constellation: 'Iridium NEXT' | 'Starlink' | 'Inmarsat-4' | 'Simulated Polar Constellation';
}

export interface SatelliteDiagnostics {
  modemModel: string;
  firmwareVersion: string;
  imeiOrSerial: string;
  temperatureCelsius: number;
  inputVoltage: number;
  totalTransmittedPackets: number;
  totalReceivedPackets: number;
  totalFailedPackets: number;
  totalRetries: number;
  totalBytesTransferred: number;
  activeIpSession: boolean;
  queueDepth: number;
  hardwareDetected: boolean;
}

export interface SatelliteAuditRecord {
  id: string;
  timestamp: string;
  eventType:
    | 'SESSION_START'
    | 'SESSION_TERMINATE'
    | 'STATE_CHANGE'
    | 'MESSAGE_QUEUED'
    | 'TRANSMIT_ATTEMPT'
    | 'TRANSMIT_SUCCESS'
    | 'ACK_RECEIVED'
    | 'TRANSMIT_RETRY'
    | 'TRANSMIT_FAIL'
    | 'FAILOVER_TRIGGERED';
  priority?: SatelliteMessagePriority;
  messageId?: string;
  details: string;
  operatorId?: string;
  dataState: CapabilityState;
}
