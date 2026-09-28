/**
 * POLAR-X Phase 9 — Satellite Session Manager
 * Orchestrates physical and simulated satellite providers with strict data honesty
 */

import { ISatelliteBroadbandProvider } from './satelliteProvider';
import { SimulatedSatelliteProvider } from './simulatedSatelliteProvider';
import {
  SatelliteConnectionState,
  SatelliteSessionInfo,
  SatelliteDiagnostics,
  SatelliteAuditRecord
} from './satelliteTypes';

export class SatelliteSessionManager {
  private activeProvider: ISatelliteBroadbandProvider;
  private state: SatelliteConnectionState = 'SIMULATED';
  private session: SatelliteSessionInfo;
  private auditHistory: SatelliteAuditRecord[] = [];
  private listeners: Set<(state: SatelliteConnectionState, session: SatelliteSessionInfo) => void> = new Set();
  private auditListeners: Set<(history: SatelliteAuditRecord[]) => void> = new Set();

  constructor() {
    // Default to Simulated Provider with strict SIMULATED labeling
    this.activeProvider = new SimulatedSatelliteProvider();
    this.session = this.activeProvider.getSessionInfo();
    this.state = this.session.connectionState;

    this.activeProvider.subscribeState((st, sess) => {
      this.state = st;
      this.session = sess;
      this.notify();
    });

    this.logAudit('SESSION_START', 'Iridium Certus broadband session initialized in simulated polar mode.');
  }

  public setProvider(provider: ISatelliteBroadbandProvider): void {
    this.activeProvider = provider;
    this.session = provider.getSessionInfo();
    this.state = this.session.connectionState;
    this.logAudit(
      'STATE_CHANGE',
      `Satellite provider switched to: ${provider.name} (Hardware Connected: ${provider.isHardwareConnected})`
    );
    this.notify();
  }

  public getActiveProvider(): ISatelliteBroadbandProvider {
    return this.activeProvider;
  }

  public getState(): SatelliteConnectionState {
    return this.state;
  }

  public getSessionInfo(): SatelliteSessionInfo {
    return this.activeProvider.getSessionInfo();
  }

  public getDiagnostics(): SatelliteDiagnostics {
    return this.activeProvider.getDiagnostics();
  }

  public async connect(): Promise<SatelliteSessionInfo> {
    this.logAudit('STATE_CHANGE', 'Establishing satellite broadband connection...');
    const result = await this.activeProvider.connectSession();
    this.logAudit('STATE_CHANGE', `Satellite broadband session active (State: ${result.connectionState})`);
    return result;
  }

  public async disconnect(): Promise<void> {
    await this.activeProvider.disconnectSession();
    this.logAudit('SESSION_TERMINATE', 'Satellite broadband session gracefully terminated by operator.');
  }

  public subscribe(
    callback: (state: SatelliteConnectionState, session: SatelliteSessionInfo) => void
  ): () => void {
    this.listeners.add(callback);
    callback(this.state, this.session);
    return () => this.listeners.delete(callback);
  }

  public subscribeAudit(callback: (history: SatelliteAuditRecord[]) => void): () => void {
    this.auditListeners.add(callback);
    callback([...this.auditHistory]);
    return () => this.auditListeners.delete(callback);
  }

  public logAudit(
    eventType: SatelliteAuditRecord['eventType'],
    details: string,
    meta: { priority?: any; messageId?: string; operatorId?: string } = {}
  ): void {
    const record: SatelliteAuditRecord = {
      id: `SAT-AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      details,
      priority: meta.priority,
      messageId: meta.messageId,
      operatorId: meta.operatorId || 'SYSTEM_DAEMON',
      dataState: this.session.dataState
    };

    this.auditHistory.unshift(record);
    if (this.auditHistory.length > 200) {
      this.auditHistory = this.auditHistory.slice(0, 200);
    }
    this.auditListeners.forEach((cb) => cb([...this.auditHistory]));
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.state, { ...this.session }));
  }
}

export const satelliteSessionManager = new SatelliteSessionManager();
