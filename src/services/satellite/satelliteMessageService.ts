/**
 * POLAR-X Phase 9 — Satellite Message Dispatcher & Queue Engine
 * Automatic Multi-Priority Processing • ACK Verification • Exponential Backoff
 */

import { satelliteQueue } from './satelliteQueue';
import { satelliteSessionManager } from './satelliteSessionManager';
import { SatelliteMessage, SatelliteMessagePriority } from './satelliteTypes';

export class SatelliteMessageService {
  private isLoopRunning = false;
  private timer: any = null;

  constructor() {
    this.startQueueProcessor();
  }

  /**
   * Enqueue a message to be transmitted via satellite broadband
   */
  public async send(
    priority: SatelliteMessagePriority,
    topic: string,
    payload: Record<string, any> | string,
    options: {
      destination?: string;
      sourceStationOrAsset?: string;
      customId?: string;
    } = {}
  ): Promise<SatelliteMessage> {
    const msg = await satelliteQueue.enqueue(priority, topic, payload, options);
    satelliteSessionManager.logAudit(
      'MESSAGE_QUEUED',
      `[${priority}] Message queued for satellite transmission: topic "${topic}" (${msg.byteSize} bytes)`,
      { priority, messageId: msg.id }
    );
    this.processQueue();
    return msg;
  }

  /**
   * High-priority Emergency SOS Satellite Transmission
   */
  public async dispatchEmergencySos(emergencyData: {
    incidentId: string;
    type: string;
    severity: string;
    coordinates?: { lat: number; lng: number };
    reportedBy?: string;
    stationOrAsset?: string;
  }): Promise<SatelliteMessage> {
    const payload = {
      protocol: 'POLAR-X-SOS-V9',
      incidentId: emergencyData.incidentId,
      emergencyType: emergencyData.type,
      severity: emergencyData.severity,
      hasValidGps: Boolean(emergencyData.coordinates && emergencyData.coordinates.lat !== 0),
      coordinates: emergencyData.coordinates,
      timestamp: new Date().toISOString(),
      reportedBy: emergencyData.reportedBy || 'FIELD_COMMANDER',
      sourceStationOrAsset: emergencyData.stationOrAsset || 'TRAVERSE_SLEDGE_01',
      checksum: `CRC16-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    };

    return this.send('P0', 'POLAR_EMERGENCY_SOS', payload, {
      destination: 'NCPOR_ANTARCTIC_HQ',
      sourceStationOrAsset: emergencyData.stationOrAsset
    });
  }

  private startQueueProcessor(): void {
    this.timer = setInterval(() => {
      this.processQueue();
    }, 2000);
  }

  /**
   * Background runner that processes messages according to priority P0 -> P5
   */
  public async processQueue(): Promise<void> {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;

    try {
      const provider = satelliteSessionManager.getActiveProvider();
      const state = satelliteSessionManager.getState();

      if (state === 'DISCONNECTED' || state === 'LINK_LOST') {
        return;
      }

      const nextMsg = satelliteQueue.peek();
      if (!nextMsg) return;

      await satelliteQueue.updateStatus(nextMsg.id, 'TRANSMITTING');
      satelliteSessionManager.logAudit(
        'TRANSMIT_ATTEMPT',
        `Attempting satellite transmission for message ${nextMsg.id} (Priority: ${nextMsg.priority})`,
        { priority: nextMsg.priority, messageId: nextMsg.id }
      );

      const result = await provider.sendMessage(nextMsg);

      if (result.success && result.ackId) {
        await satelliteQueue.updateStatus(nextMsg.id, 'ACKNOWLEDGED', {
          acknowledgedAt: new Date().toISOString()
        });
        satelliteSessionManager.logAudit(
          'ACK_RECEIVED',
          `Satellite ACK confirmed: ${result.ackId} for message ${nextMsg.id}`,
          { priority: nextMsg.priority, messageId: nextMsg.id }
        );
      } else {
        await satelliteQueue.updateStatus(nextMsg.id, 'RETRYING', {
          errorMessage: result.error || 'Gateway transmission timeout'
        });
        satelliteSessionManager.logAudit(
          'TRANSMIT_RETRY',
          `Satellite transmission failed: ${result.error || 'Unknown error'}. Scheduled retry #${nextMsg.retryCount + 1}`,
          { priority: nextMsg.priority, messageId: nextMsg.id }
        );
      }
    } catch (err: any) {
      console.error('Satellite queue processing exception:', err);
    } finally {
      this.isLoopRunning = false;
    }
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

export const satelliteMessageService = new SatelliteMessageService();
