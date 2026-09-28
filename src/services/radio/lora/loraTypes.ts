/**
 * POLAR-X LoRa / Meshtastic Off-Grid Mesh Gateway Types
 */

export type LoraConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'SIMULATED'
  | 'ERROR';

export type MeshLinkQuality = 'ACTIVE' | 'DEGRADED' | 'LOST' | 'UNKNOWN';

export interface LoraNodeInfo {
  nodeId: string;
  longName: string;
  shortName: string;
  role: 'ROUTER' | 'CLIENT' | 'REPEATER' | 'TRACKER' | 'BASE_STATION';
  batteryPercent: number;
  voltage: number;
  snrDb: number;
  rssiDbm: number;
  lastSeen: string;
  isSimulated: boolean;
  latitude: number;
  longitude: number;
  channel: string;
  linkQuality: MeshLinkQuality;
}

export interface LoraMeshPacket {
  packetId: string;
  fromNodeId: string;
  toNodeId: string; // 'BROADCAST' or specific node
  hopLimit: number;
  hopStart: number;
  ttlSeconds: number;
  channelIndex: number;
  payloadHex: string;
  decodedSummary?: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  isSimulated: boolean;
}

export interface LoraGatewayConfig {
  region: 'EU_868' | 'US_915' | 'IN_865' | 'ANZ_915';
  channelName: string;
  bandwidthKhz: number;
  spreadingFactor: number;
  codingRate: string;
  txPowerDbm: number;
}
