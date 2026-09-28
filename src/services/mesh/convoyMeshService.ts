/**
 * POLAR-X Convoy Mesh & WebRTC Telemetry Service
 */

import { PolarConvoy, ConvoyBroadcastMessage } from '../../types/convoy';

export const INITIAL_CONVOY: PolarConvoy = {
  id: 'convoy-01',
  code: 'CNV-2026-ALPHA',
  name: 'Maitri-Wohlthat Heavy Research Convoy',
  expeditionCode: 'EXP-2026-088',
  routeCode: 'TRV-2026-001',
  status: 'ACTIVE',
  leadVehicleId: 'v-01',
  maxIntraConvoyGapMeters: 450,
  meshHealthScorePercent: 96,
  communicationMode: 'WEBRTC_DIRECT_PEER',
  isSimulated: true,
  createdAt: '2026-09-22T08:00:00Z',
  lastSyncTimestamp: new Date().toISOString(),
  members: [
    {
      vehicleId: 'v-01',
      vehicleName: 'PistonBully PB100 (Lead Recon)',
      driverOrCommander: 'Capt. Marcus Vance',
      roleInConvoy: 'LEAD_SCOUT',
      coordinates: { lat: -71.12, lng: 12.05 },
      speedKmh: 18.2,
      headingDegrees: 145,
      distanceToLeadMeters: 0,
      batteryLevelPercent: 94,
      meshConnectionState: 'CONNECTED',
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 12
    },
    {
      vehicleId: 'v-02',
      vehicleName: 'Heavy Snowcat Module #02',
      driverOrCommander: 'Dmitri Voronov',
      roleInConvoy: 'MAIN_CARRIER',
      coordinates: { lat: -71.118, lng: 12.045 },
      speedKmh: 18.0,
      headingDegrees: 145,
      distanceToLeadMeters: 280,
      batteryLevelPercent: 88,
      meshConnectionState: 'CONNECTED',
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 18
    },
    {
      vehicleId: 'v-03',
      vehicleName: 'Fuel Depot Sledge Carrier #03',
      driverOrCommander: 'Dr. Sarah Jenkins',
      roleInConvoy: 'FUEL_DEPOT_SLEDGE',
      coordinates: { lat: -71.115, lng: 12.04 },
      speedKmh: 17.8,
      headingDegrees: 145,
      distanceToLeadMeters: 520,
      batteryLevelPercent: 91,
      meshConnectionState: 'DEGRADED',
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 85
    }
  ]
};

export const INITIAL_CONVOY_MESSAGES: ConvoyBroadcastMessage[] = [
  {
    id: 'msg-01',
    convoyId: 'convoy-01',
    senderVehicleId: 'v-01',
    senderName: 'Capt. Marcus Vance (Lead Scout)',
    timestamp: '5 mins ago',
    type: 'SPEED_COMMAND',
    content: 'Approaching blue ice transition. Reduce convoy velocity to 15 km/h and maintain 300m spacing.',
    severity: 'INFO'
  },
  {
    id: 'msg-02',
    convoyId: 'convoy-01',
    senderVehicleId: 'v-03',
    senderName: 'Dr. Sarah Jenkins (Fuel Sledge)',
    timestamp: '2 mins ago',
    type: 'HAZARD_ALERT',
    content: 'Mesh link latency fluctuating over ridge terrain. WebRTC Direct Peer Channel re-established.',
    severity: 'WARNING'
  }
];

class ConvoyMeshService {
  private convoys: PolarConvoy[] = [INITIAL_CONVOY];
  private messages: ConvoyBroadcastMessage[] = [...INITIAL_CONVOY_MESSAGES];
  private subscribers: Set<(convoy: PolarConvoy, msgs: ConvoyBroadcastMessage[]) => void> = new Set();
  private intervalId: any = null;

  constructor() {
    this.startSimulation();
  }

  public getActiveConvoy(): PolarConvoy {
    return this.convoys[0];
  }

  public getMessages(): ConvoyBroadcastMessage[] {
    return this.messages;
  }

  public subscribe(callback: (convoy: PolarConvoy, msgs: ConvoyBroadcastMessage[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.convoys[0], this.messages);
    return () => this.subscribers.delete(callback);
  }

  public async broadcastMessage(
    senderVehicleId: string,
    senderName: string,
    type: ConvoyBroadcastMessage['type'],
    content: string,
    severity: ConvoyBroadcastMessage['severity'] = 'INFO'
  ): Promise<ConvoyBroadcastMessage> {
    const newMsg: ConvoyBroadcastMessage = {
      id: `msg-${Date.now()}`,
      convoyId: this.convoys[0].id,
      senderVehicleId,
      senderName,
      timestamp: 'Just now',
      type,
      content,
      severity
    };
    this.messages = [newMsg, ...this.messages];
    this.notify();
    return newMsg;
  }

  private startSimulation(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      const convoy = this.convoys[0];
      if (convoy.status !== 'ACTIVE') return;

      const updatedMembers = convoy.members.map((m) => {
        const deltaLat = -0.0005;
        const deltaLng = 0.0008;

        return {
          ...m,
          coordinates: {
            lat: Math.round((m.coordinates.lat + deltaLat) * 100000) / 100000,
            lng: Math.round((m.coordinates.lng + deltaLng) * 100000) / 100000
          },
          lastHeartbeat: new Date().toISOString()
        };
      });

      this.convoys[0] = {
        ...convoy,
        members: updatedMembers,
        lastSyncTimestamp: new Date().toISOString()
      };
      this.notify();
    }, 4000);
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb(this.convoys[0], [...this.messages]));
  }
}

export const convoyMeshService = new ConvoyMeshService();
