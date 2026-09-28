/**
 * POLAR-X Convoy Telemetry & WebRTC Peer Mesh Types
 */

export type ConvoyStatus = 'FORMING' | 'ACTIVE' | 'PAUSED' | 'DISBANDED' | 'OFFLINE';

export type MeshPeerConnectionState = 'CONNECTED' | 'CONNECTING' | 'DEGRADED' | 'DISCONNECTED' | 'SIMULATED';

export interface ConvoyMemberVehicle {
  vehicleId: string;
  vehicleName: string;
  driverOrCommander: string;
  roleInConvoy: 'LEAD_SCOUT' | 'MAIN_CARRIER' | 'FUEL_DEPOT_SLEDGE' | 'REAR_RESCUE_ESCORT';
  coordinates: {
    lat: number;
    lng: number;
  };
  speedKmh: number;
  headingDegrees: number;
  distanceToLeadMeters: number;
  batteryLevelPercent: number;
  meshConnectionState: MeshPeerConnectionState;
  lastHeartbeat: string;
  latencyMs: number;
}

export interface PolarConvoy {
  id: string;
  code: string; // e.g. CNV-2026-ALPHA
  name: string;
  expeditionCode: string;
  routeCode?: string;
  status: ConvoyStatus;
  leadVehicleId: string;
  members: ConvoyMemberVehicle[];
  maxIntraConvoyGapMeters: number;
  meshHealthScorePercent: number;
  communicationMode: 'WEBRTC_DIRECT_PEER' | 'LOCAL_RF_MESH' | 'SATELLITE_UPLINK' | 'SIMULATED_MESH';
  isSimulated: boolean;
  createdAt: string;
  lastSyncTimestamp: string;
}

export interface ConvoyBroadcastMessage {
  id: string;
  convoyId: string;
  senderVehicleId: string;
  senderName: string;
  timestamp: string;
  type: 'HAZARD_ALERT' | 'SPEED_COMMAND' | 'FORMATION_HOLD' | 'SOS_RELAY' | 'CHAT';
  content: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}
