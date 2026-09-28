/**
 * POLAR-X LoRa & Meshtastic Device Manager
 * Manages mesh nodes, link states, hop counts, and decentralized packets.
 */

import { LoraNodeInfo, LoraMeshPacket, LoraConnectionStatus, LoraGatewayConfig } from './loraTypes';

export const INITIAL_MESH_NODES: LoraNodeInfo[] = [
  {
    nodeId: '!node_maitri_base',
    longName: 'Maitri Base Primary Node',
    shortName: 'BASE',
    role: 'BASE_STATION',
    batteryPercent: 100,
    voltage: 4.2,
    snrDb: 12.5,
    rssiDbm: -58,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    latitude: -70.767,
    longitude: 11.733,
    channel: 'LongFast-Antarctica',
    linkQuality: 'ACTIVE'
  },
  {
    nodeId: '!node_snowcat_01',
    longName: 'PistonBully PB-100 Convoy Lead',
    shortName: 'PB-1',
    role: 'ROUTER',
    batteryPercent: 94,
    voltage: 4.05,
    snrDb: 8.2,
    rssiDbm: -82,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    latitude: -70.825,
    longitude: 11.890,
    channel: 'LongFast-Antarctica',
    linkQuality: 'ACTIVE'
  },
  {
    nodeId: '!node_personnel_lead',
    longName: 'Field Party Alpha Wearable Node',
    shortName: 'FPA',
    role: 'CLIENT',
    batteryPercent: 78,
    voltage: 3.82,
    snrDb: 3.4,
    rssiDbm: -104,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    latitude: -70.910,
    longitude: 12.050,
    channel: 'LongFast-Antarctica',
    linkQuality: 'ACTIVE'
  },
  {
    nodeId: '!node_relay_nunatak',
    longName: 'Schirmacher Nunatak Solar Relay',
    shortName: 'RELAY',
    role: 'REPEATER',
    batteryPercent: 88,
    voltage: 3.98,
    snrDb: 9.8,
    rssiDbm: -74,
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    latitude: -70.795,
    longitude: 11.810,
    channel: 'LongFast-Antarctica',
    linkQuality: 'ACTIVE'
  }
];

export class LoraDeviceManager {
  private nodes: LoraNodeInfo[] = [...INITIAL_MESH_NODES];
  private packets: LoraMeshPacket[] = [];
  private status: LoraConnectionStatus = 'SIMULATED';
  private config: LoraGatewayConfig = {
    region: 'IN_865',
    channelName: 'LongFast-Antarctica',
    bandwidthKhz: 250,
    spreadingFactor: 11,
    codingRate: '4/8',
    txPowerDbm: 22
  };

  private nodeSubscribers: Set<(nodes: LoraNodeInfo[]) => void> = new Set();
  private packetSubscribers: Set<(packets: LoraMeshPacket[]) => void> = new Set();
  private statusSubscribers: Set<(status: LoraConnectionStatus) => void> = new Set();

  public getStatus(): LoraConnectionStatus {
    return this.status;
  }

  public getNodes(): LoraNodeInfo[] {
    return [...this.nodes];
  }

  public getPackets(): LoraMeshPacket[] {
    return [...this.packets];
  }

  public getConfig(): LoraGatewayConfig {
    return { ...this.config };
  }

  public subscribeNodes(cb: (nodes: LoraNodeInfo[]) => void): () => void {
    this.nodeSubscribers.add(cb);
    cb([...this.nodes]);
    return () => this.nodeSubscribers.delete(cb);
  }

  public subscribePackets(cb: (packets: LoraMeshPacket[]) => void): () => void {
    this.packetSubscribers.add(cb);
    cb([...this.packets]);
    return () => this.packetSubscribers.delete(cb);
  }

  public subscribeStatus(cb: (status: LoraConnectionStatus) => void): () => void {
    this.statusSubscribers.add(cb);
    cb(this.status);
    return () => this.statusSubscribers.delete(cb);
  }

  public async broadcastMeshMessage(text: string, toNode: string = 'BROADCAST'): Promise<LoraMeshPacket> {
    const packet: LoraMeshPacket = {
      packetId: `PKT-LORA-${Date.now()}`,
      fromNodeId: '!node_maitri_base',
      toNodeId: toNode,
      hopLimit: 3,
      hopStart: 3,
      ttlSeconds: 300,
      channelIndex: 0,
      payloadHex: Array.from(new TextEncoder().encode(text))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      decodedSummary: text,
      timestamp: new Date().toISOString(),
      acknowledged: true,
      acknowledgedBy: toNode === 'BROADCAST' ? 'MESH-RELAY-01' : toNode,
      isSimulated: this.status === 'SIMULATED'
    };

    this.packets.unshift(packet);
    this.notifySubscribers();
    return packet;
  }

  private notifySubscribers(): void {
    const n = [...this.nodes];
    const p = [...this.packets];
    this.nodeSubscribers.forEach((cb) => cb(n));
    this.packetSubscribers.forEach((cb) => cb(p));
    this.statusSubscribers.forEach((cb) => cb(this.status));
  }
}

export const loraDeviceManager = new LoraDeviceManager();
