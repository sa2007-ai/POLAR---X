/**
 * POLAR-X Phase 9 — Satellite Health & Metrics Service
 * Real-time monitoring of satellite transceiver latency, signal quality, packet loss, and queue depths
 */

import { satelliteSessionManager } from './satelliteSessionManager';
import { satelliteQueue } from './satelliteQueue';
import { SatelliteDiagnostics, SatelliteSessionInfo } from './satelliteTypes';

export interface SatelliteHealthSnapshot {
  session: SatelliteSessionInfo;
  diagnostics: SatelliteDiagnostics;
  queueDepth: number;
  pendingPriorityCount: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
    P4: number;
    P5: number;
  };
  linkHealthGrade: 'OPTIMAL' | 'DEGRADED' | 'POOR' | 'CRITICAL' | 'OFFLINE';
  lastHeartbeat: string;
}

export class SatelliteHealthService {
  private listeners: Set<(health: SatelliteHealthSnapshot) => void> = new Set();
  private timer: any = null;

  constructor() {
    this.timer = setInterval(() => {
      this.notify();
    }, 5000);
  }

  public getSnapshot(): SatelliteHealthSnapshot {
    const session = satelliteSessionManager.getSessionInfo();
    const diagnostics = satelliteSessionManager.getDiagnostics();
    const allMessages = satelliteQueue.getAll();

    const pendingPriorityCount = {
      P0: allMessages.filter((m) => m.priority === 'P0' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length,
      P1: allMessages.filter((m) => m.priority === 'P1' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length,
      P2: allMessages.filter((m) => m.priority === 'P2' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length,
      P3: allMessages.filter((m) => m.priority === 'P3' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length,
      P4: allMessages.filter((m) => m.priority === 'P4' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length,
      P5: allMessages.filter((m) => m.priority === 'P5' && (m.status === 'QUEUED' || m.status === 'RETRYING')).length
    };

    let linkHealthGrade: SatelliteHealthSnapshot['linkHealthGrade'] = 'OPTIMAL';
    if (session.connectionState === 'DISCONNECTED' || session.connectionState === 'LINK_LOST') {
      linkHealthGrade = 'OFFLINE';
    } else if (session.signalQualityPercent < 35 || session.roundTripLatencyMs > 1800) {
      linkHealthGrade = 'CRITICAL';
    } else if (session.signalQualityPercent < 60 || session.roundTripLatencyMs > 1200) {
      linkHealthGrade = 'POOR';
    } else if (session.signalQualityPercent < 75 || session.roundTripLatencyMs > 900) {
      linkHealthGrade = 'DEGRADED';
    }

    return {
      session,
      diagnostics: {
        ...diagnostics,
        queueDepth: satelliteQueue.getPendingCount()
      },
      queueDepth: satelliteQueue.getPendingCount(),
      pendingPriorityCount,
      linkHealthGrade,
      lastHeartbeat: new Date().toISOString()
    };
  }

  public subscribe(callback: (health: SatelliteHealthSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.getSnapshot());
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snapshot));
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}

export const satelliteHealthService = new SatelliteHealthService();
