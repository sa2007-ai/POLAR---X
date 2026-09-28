/**
 * POLAR-X Low-Bandwidth Emergency Radio Communication Types
 * Designed for VHF (AX.25), HF (ALE), Iridium SBD, and WebRTC fallback.
 */

export type EmergencyMessageType =
  | 'SOS'
  | 'POSITION'
  | 'MEDICAL'
  | 'WEATHER'
  | 'ROUTE'
  | 'EVACUATION'
  | 'ACK'
  | 'HEARTBEAT';

export type EmergencyPriority = 'ROUTINE' | 'PRIORITY' | 'CRITICAL' | 'FLASH';

export type RadioGatewayType = 'VHF' | 'HF' | 'SATELLITE' | 'WEBRTC' | 'LOCAL_WIFI' | 'SIMULATED';

export type TransmissionState =
  | 'QUEUED'
  | 'TRANSMITTING'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'FAILED'
  | 'RETRYING'
  | 'UNAVAILABLE';

export interface EmergencyPacket {
  packetVersion: number;
  messageId: string;
  senderId: string;
  expeditionId: string;
  timestamp: string;
  priority: EmergencyPriority;
  messageType: EmergencyMessageType;
  latitude: number;
  longitude: number;
  status: TransmissionState;
  payloadText?: string;
  checksumHex: string;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  gatewayUsed?: RadioGatewayType;
  rawEncodedHex?: string;
}

export interface RadioGatewayStatus {
  gatewayType: RadioGatewayType;
  name: string;
  frequencyOrBand: string;
  status: 'AVAILABLE' | 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE' | 'SIMULATED' | 'UNCONFIGURED';
  isHardwareAttached: boolean;
  lastTxAt?: string;
  lastRxAt?: string;
  signalQualityPercent: number;
  description: string;
}
