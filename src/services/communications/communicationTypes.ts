/**
 * POLAR-X Unified Communications Orchestration Types
 */

export type CommBearerType = 'LORA' | 'VHF' | 'HF' | 'AFSK' | 'SATELLITE' | 'WEBRTC' | 'LOCAL_WIFI';

export interface CommBearerStatus {
  type: CommBearerType;
  name: string;
  band: string;
  status: 'AVAILABLE' | 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE' | 'SIMULATED' | 'UNCONFIGURED';
  latencyMs: number;
  bandwidthBps: number;
  successRatePercent: number;
  isHardwareOnline: boolean;
  lastSuccessfulTxAt?: string;
}

export interface CommFailoverEvent {
  eventId: string;
  timestamp: string;
  attemptedBearer: CommBearerType;
  fallbackBearer: CommBearerType;
  reason: string;
  packetId: string;
  retryAttempt: number;
  wasRecovered: boolean;
}

export interface UnifiedMessageRequest {
  messageId: string;
  recipient: string;
  priority: 'ROUTINE' | 'PRIORITY' | 'CRITICAL' | 'FLASH';
  payloadText: string;
  latitude?: number;
  longitude?: number;
}
