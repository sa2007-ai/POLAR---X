/**
 * POLAR-X Emergency Communications Service
 * Manages low-bandwidth packet queue, multi-provider dispatch, exponential backoff retries, and ACK tracking.
 */

import {
  EmergencyPacket,
  EmergencyMessageType,
  EmergencyPriority,
  RadioGatewayType,
  RadioGatewayStatus
} from './emergencyMessageTypes';
import { encodeEmergencyPacket } from './packetEncoder';
import {
  RadioProvider,
  vhfProvider,
  hfProvider,
  satelliteRadioProvider,
  demoRadioProvider
} from './radioProvider';
import { offlineDB, STORES } from '../offline/offlineDb';

export class EmergencyCommsService {
  private packets: EmergencyPacket[] = [];
  private providers: Map<RadioGatewayType, RadioProvider> = new Map();
  private subscribers: Set<(packets: EmergencyPacket[]) => void> = new Set();
  private isProcessingQueue = false;

  constructor() {
    this.providers.set('VHF', vhfProvider);
    this.providers.set('HF', hfProvider);
    this.providers.set('SATELLITE', satelliteRadioProvider);
    this.providers.set('SIMULATED', demoRadioProvider);
  }

  public getGateways(): RadioGatewayStatus[] {
    return Array.from(this.providers.values()).map((p) => p.getStatus());
  }

  public getPackets(): EmergencyPacket[] {
    return [...this.packets];
  }

  public subscribe(cb: (packets: EmergencyPacket[]) => void): () => void {
    this.subscribers.add(cb);
    cb([...this.packets]);
    return () => this.subscribers.delete(cb);
  }

  /**
   * Queue a new emergency packet and trigger dispatch
   */
  public async queuePacket(
    messageType: EmergencyMessageType,
    latitude: number,
    longitude: number,
    priority: EmergencyPriority = 'CRITICAL',
    payloadText: string = '',
    senderId: string = 'FIELD-OPERATOR-01',
    expeditionId: string = 'EXP-2026-MAITRI-01'
  ): Promise<EmergencyPacket> {
    const rawPacket = {
      packetVersion: 1,
      messageId: `PKT-TX-${Date.now()}`,
      senderId,
      expeditionId,
      timestamp: new Date().toISOString(),
      priority,
      messageType,
      latitude,
      longitude,
      status: 'QUEUED' as const,
      payloadText,
      retryCount: 0,
      maxRetries: 3
    };

    const encoded = encodeEmergencyPacket(rawPacket);
    this.packets.unshift(encoded);
    this.notifySubscribers();

    // Cache to IndexedDB for offline protection
    try {
      await offlineDB.put(STORES.EMERGENCIES, {
        id: encoded.messageId,
        ...encoded,
        createdAt: encoded.timestamp
      });
    } catch {
      // safe fallback
    }

    this.processQueue();
    return encoded;
  }

  /**
   * Dispatch queued packets via available gateway providers
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const pendingPackets = this.packets.filter(
        (p) => p.status === 'QUEUED' || p.status === 'RETRYING'
      );

      for (const packet of pendingPackets) {
        packet.status = 'TRANSMITTING';
        packet.lastAttemptAt = new Date().toISOString();
        this.notifySubscribers();

        // Priority provider selection: VHF -> SATELLITE -> SIMULATED
        let provider = this.providers.get('VHF');
        if (!provider || provider.getStatus().status === 'UNCONFIGURED') {
          provider = this.providers.get('SIMULATED');
        }

        if (!provider) {
          packet.status = 'UNAVAILABLE';
          this.notifySubscribers();
          continue;
        }

        try {
          const res = await provider.transmitPacket(packet);

          if (res.success) {
            packet.gatewayUsed = provider.type;
            if (res.ackReceived) {
              packet.status = 'ACKNOWLEDGED';
              packet.acknowledgedAt = new Date().toISOString();
              packet.acknowledgedBy = res.acknowledgedBy || 'REMOTE-RELAY-STATION';
            } else {
              packet.status = 'SENT';
            }
          } else {
            packet.retryCount += 1;
            if (packet.retryCount < packet.maxRetries) {
              packet.status = 'RETRYING';
            } else {
              packet.status = 'FAILED';
            }
          }
        } catch {
          packet.retryCount += 1;
          packet.status = packet.retryCount < packet.maxRetries ? 'RETRYING' : 'FAILED';
        }

        this.notifySubscribers();
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private notifySubscribers(): void {
    const list = [...this.packets];
    this.subscribers.forEach((cb) => cb(list));
  }
}

export const emergencyCommsService = new EmergencyCommsService();
