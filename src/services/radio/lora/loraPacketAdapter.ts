/**
 * POLAR-X LoRa Mesh Packet Adapter
 * Adapts emergency packets and telemetry into LoRa frames with TTL and duplicate suppression.
 */

import { EmergencyPacket } from '../../emergency-comms/emergencyMessageTypes';
import { LoraMeshPacket } from './loraTypes';

export class LoraPacketAdapter {
  private seenPacketIds: Set<string> = new Set();
  private maxSeenHistory = 200;

  public isDuplicate(packetId: string): boolean {
    if (this.seenPacketIds.has(packetId)) {
      return true;
    }
    this.seenPacketIds.add(packetId);
    if (this.seenPacketIds.size > this.maxSeenHistory) {
      const oldest = Array.from(this.seenPacketIds)[0];
      this.seenPacketIds.delete(oldest);
    }
    return false;
  }

  public adaptEmergencyToMesh(packet: EmergencyPacket, fromNodeId: string = '!polar_base_01'): LoraMeshPacket {
    return {
      packetId: `LORA-${packet.messageId}`,
      fromNodeId,
      toNodeId: 'BROADCAST',
      hopLimit: 3,
      hopStart: 3,
      ttlSeconds: 300,
      channelIndex: 0,
      payloadHex: packet.rawEncodedHex || 'PX1_RAW',
      decodedSummary: `[${packet.messageType}] (${packet.latitude.toFixed(3)}°, ${packet.longitude.toFixed(3)}°) ${packet.payloadText}`,
      timestamp: packet.timestamp,
      acknowledged: packet.status === 'ACKNOWLEDGED',
      acknowledgedBy: packet.acknowledgedBy,
      isSimulated: false
    };
  }
}

export const loraPacketAdapter = new LoraPacketAdapter();
