/**
 * POLAR-X Unified Communication Orchestration Manager
 * Routes packets through priority bearers (LoRa ➔ VHF ➔ HF ➔ AFSK ➔ Satellite ➔ WebRTC).
 * Executes automatic failover with comprehensive audit logging.
 */

import { CommBearerType, CommBearerStatus, CommFailoverEvent, UnifiedMessageRequest } from './communicationTypes';

export const INITIAL_BEARERS: CommBearerStatus[] = [
  {
    type: 'LORA',
    name: 'Meshtastic Off-Grid LoRa Mesh',
    band: '865 - 868 MHz ISM / 250 kHz',
    status: 'SIMULATED',
    latencyMs: 140,
    bandwidthBps: 1200,
    successRatePercent: 96,
    isHardwareOnline: true,
    lastSuccessfulTxAt: new Date().toISOString()
  },
  {
    type: 'VHF',
    name: 'VHF AX.25 Packet Radio',
    band: '144.390 MHz / 1200 Baud AFSK',
    status: 'UNCONFIGURED',
    latencyMs: 350,
    bandwidthBps: 1200,
    successRatePercent: 0,
    isHardwareOnline: false
  },
  {
    type: 'HF',
    name: 'HF ALE Automatic Link Establishment',
    band: '3 - 30 MHz Ionospheric Skywave',
    status: 'UNCONFIGURED',
    latencyMs: 1200,
    bandwidthBps: 300,
    successRatePercent: 0,
    isHardwareOnline: false
  },
  {
    type: 'AFSK',
    name: 'Bell 202 Acoustic / Audio Jack Modem',
    band: '1200 / 2200 Hz Audio TRRS',
    status: 'AVAILABLE',
    latencyMs: 450,
    bandwidthBps: 1200,
    successRatePercent: 92,
    isHardwareOnline: true
  },
  {
    type: 'SATELLITE',
    name: 'Iridium Certus 700 Polar Broadband',
    band: '1616 - 1626.5 MHz L-Band (Simulated)',
    status: 'SIMULATED',
    latencyMs: 780,
    bandwidthBps: 352000,
    successRatePercent: 97,
    isHardwareOnline: true,
    lastSuccessfulTxAt: new Date().toISOString()
  },
  {
    type: 'WEBRTC',
    name: 'Direct Convoy P2P Mesh DataChannel',
    band: 'Local 2.4/5.8 GHz Tactical Wi-Fi',
    status: 'CONNECTED',
    latencyMs: 35,
    bandwidthBps: 250000,
    successRatePercent: 99,
    isHardwareOnline: true,
    lastSuccessfulTxAt: new Date().toISOString()
  }
];

export class CommunicationManager {
  private priorityOrder: CommBearerType[] = ['LORA', 'WEBRTC', 'AFSK', 'VHF', 'HF', 'SATELLITE'];
  private bearers: Map<CommBearerType, CommBearerStatus> = new Map();
  private failoverHistory: CommFailoverEvent[] = [];
  private subscribers: Set<() => void> = new Set();

  constructor() {
    INITIAL_BEARERS.forEach((b) => this.bearers.set(b.type, b));
  }

  public getBearers(): CommBearerStatus[] {
    return Array.from(this.bearers.values());
  }

  public getPriorityOrder(): CommBearerType[] {
    return [...this.priorityOrder];
  }

  public setPriorityOrder(order: CommBearerType[]): void {
    this.priorityOrder = order;
    this.notifySubscribers();
  }

  public getFailoverHistory(): CommFailoverEvent[] {
    return [...this.failoverHistory];
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    cb();
    return () => this.subscribers.delete(cb);
  }

  /**
   * Dispatch a message through the priority pipeline with automated failover
   */
  public async dispatchUnifiedMessage(request: UnifiedMessageRequest): Promise<{
    deliveredBearer: CommBearerType;
    latencyMs: number;
    failoversCount: number;
  }> {
    let failoversCount = 0;

    for (let i = 0; i < this.priorityOrder.length; i++) {
      const bearerType = this.priorityOrder[i];
      const bearer = this.bearers.get(bearerType);

      if (!bearer || bearer.status === 'UNCONFIGURED' || bearer.status === 'UNAVAILABLE') {
        const nextBearer = this.priorityOrder[i + 1] || 'SATELLITE';
        this.failoverHistory.unshift({
          eventId: `FAILOVER-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          attemptedBearer: bearerType,
          fallbackBearer: nextBearer,
          reason: `Bearer ${bearerType} is UNCONFIGURED / OFFLINE`,
          packetId: request.messageId,
          retryAttempt: i + 1,
          wasRecovered: true
        });
        failoversCount++;
        continue;
      }

      // Successful simulated/live transmission on active bearer
      await new Promise((r) => setTimeout(r, Math.min(600, bearer.latencyMs)));
      bearer.lastSuccessfulTxAt = new Date().toISOString();
      this.notifySubscribers();

      return {
        deliveredBearer: bearerType,
        latencyMs: bearer.latencyMs,
        failoversCount
      };
    }

    throw new Error('All communication bearers exhausted without delivery confirmation.');
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((cb) => cb());
  }
}

export const communicationManager = new CommunicationManager();
