/**
 * POLAR-X Phase 9 — Simulated Iridium Certus Satellite Broadband Provider
 * Explicit SIMULATED Data State • Real-world Polar LEO Constellation Dynamics
 */

import { ISatelliteBroadbandProvider } from './satelliteProvider';
import {
  SatelliteSessionInfo,
  SatelliteDiagnostics,
  SatelliteMessage,
  SatelliteConnectionState
} from './satelliteTypes';

export class SimulatedSatelliteProvider implements ISatelliteBroadbandProvider {
  public readonly id = 'provider-simulated-certus-9770';
  public readonly name = 'Iridium Certus 700 / Polar Broadband (Simulated)';
  public readonly isHardwareConnected = false;

  private state: SatelliteConnectionState = 'SIMULATED';
  private session: SatelliteSessionInfo;
  private diagnostics: SatelliteDiagnostics;
  private stateListeners: Set<(state: SatelliteConnectionState, session: SatelliteSessionInfo) => void> = new Set();
  private incomingListeners: Set<(msg: SatelliteMessage) => void> = new Set();
  private telemetryInterval: any = null;

  constructor() {
    this.session = {
      sessionId: `CERTUS-SIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      providerType: 'SIMULATED_CERTUS',
      providerName: 'Simulated Iridium NEXT Polar Broadband',
      connectionState: 'SIMULATED',
      dataState: 'SIMULATED',
      ipAddress: '10.244.78.14',
      gatewayHost: 'gw-polar-01.iridium.telecom.sim',
      lastContactAt: new Date().toISOString(),
      signalStrengthDbm: -92,
      signalQualityPercent: 88,
      uplinkBandwidthKbps: 352,
      downlinkBandwidthKbps: 704,
      roundTripLatencyMs: 780,
      beamId: 'BEAM-POLAR-SOUTH-4A',
      satelliteElevationDeg: 42,
      constellation: 'Iridium NEXT'
    };

    this.diagnostics = {
      modemModel: 'Simulated Iridium Certus 9770 Transceiver',
      firmwareVersion: 'v2.14.0-SIM',
      imeiOrSerial: '300234068991200',
      temperatureCelsius: -14.5,
      inputVoltage: 24.2,
      totalTransmittedPackets: 0,
      totalReceivedPackets: 0,
      totalFailedPackets: 0,
      totalRetries: 0,
      totalBytesTransferred: 0,
      activeIpSession: true,
      queueDepth: 0,
      hardwareDetected: false
    };

    this.startPolarOrbitSimulation();
  }

  public async initialize(_config?: Record<string, any>): Promise<boolean> {
    this.state = 'SIMULATED';
    this.session.dataState = 'SIMULATED';
    this.session.connectionState = 'SIMULATED';
    this.notifyState();
    return true;
  }

  public async connectSession(): Promise<SatelliteSessionInfo> {
    this.state = 'CONNECTING';
    this.notifyState();
    await new Promise((res) => setTimeout(res, 800));

    this.state = 'SIMULATED';
    this.session.connectedAt = new Date().toISOString();
    this.session.lastContactAt = new Date().toISOString();
    this.session.connectionState = 'SIMULATED';
    this.diagnostics.activeIpSession = true;
    this.notifyState();
    return this.session;
  }

  public async disconnectSession(): Promise<void> {
    this.state = 'DISCONNECTED';
    this.session.connectionState = 'DISCONNECTED';
    this.diagnostics.activeIpSession = false;
    this.notifyState();
  }

  public getSessionInfo(): SatelliteSessionInfo {
    return { ...this.session };
  }

  public getDiagnostics(): SatelliteDiagnostics {
    return { ...this.diagnostics };
  }

  public async sendMessage(
    msg: SatelliteMessage
  ): Promise<{ success: boolean; ackId?: string; error?: string }> {
    if (this.state === 'DISCONNECTED' || this.state === 'LINK_LOST') {
      this.diagnostics.totalFailedPackets += 1;
      return { success: false, error: 'Satellite broadband bearer link unavailable' };
    }

    // Realistic propagation latency for LEO polar satellite (600ms - 1200ms)
    const simulatedLatency = 600 + Math.floor(Math.random() * 500);
    await new Promise((res) => setTimeout(res, simulatedLatency));

    // Simulate 97% delivery success rate under polar tropospheric conditions
    const isSuccessful = Math.random() < 0.97 || msg.priority === 'P0';

    if (isSuccessful) {
      this.diagnostics.totalTransmittedPackets += 1;
      this.diagnostics.totalBytesTransferred += msg.byteSize;
      this.session.lastContactAt = new Date().toISOString();
      const ackId = `ACK-${msg.id.slice(-6)}-${Date.now().toString().slice(-4)}`;
      return { success: true, ackId };
    } else {
      this.diagnostics.totalFailedPackets += 1;
      return { success: false, error: 'Atmospheric ionospheric flutter caused packet drop' };
    }
  }

  public subscribeState(
    callback: (state: SatelliteConnectionState, session: SatelliteSessionInfo) => void
  ): () => void {
    this.stateListeners.add(callback);
    callback(this.state, this.session);
    return () => this.stateListeners.delete(callback);
  }

  public subscribeIncoming(callback: (msg: SatelliteMessage) => void): () => void {
    this.incomingListeners.add(callback);
    return () => this.incomingListeners.delete(callback);
  }

  private notifyState(): void {
    this.stateListeners.forEach((cb) => cb(this.state, { ...this.session }));
  }

  private startPolarOrbitSimulation(): void {
    this.telemetryInterval = setInterval(() => {
      if (this.state !== 'SIMULATED' && this.state !== 'CONNECTED') return;

      // Realistic orbital pass signal modulation
      const jitter = (Math.random() - 0.5) * 4;
      this.session.signalStrengthDbm = Math.min(-75, Math.max(-115, Math.round(-90 + jitter)));
      this.session.signalQualityPercent = Math.min(100, Math.max(10, Math.round(85 + jitter * 2)));
      this.session.roundTripLatencyMs = Math.round(720 + Math.random() * 160);
      this.session.lastContactAt = new Date().toISOString();
      this.session.satelliteElevationDeg = Math.round(30 + Math.sin(Date.now() / 60000) * 45);

      this.diagnostics.temperatureCelsius = Number((-14 + (Math.random() - 0.5) * 1.5).toFixed(1));
      this.diagnostics.inputVoltage = Number((24.0 + (Math.random() - 0.5) * 0.4).toFixed(2));
      this.notifyState();
    }, 10000);
  }

  public destroy(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
  }
}
