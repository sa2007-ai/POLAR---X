/**
 * POLAR-X Phase 9 — Satellite Broadband Provider Interface
 * Vendor-agnostic abstraction for physical Iridium / Inmarsat modems, backend bridges, and simulators.
 */

import {
  SatelliteSessionInfo,
  SatelliteDiagnostics,
  SatelliteMessage,
  SatelliteConnectionState
} from './satelliteTypes';

export interface ISatelliteBroadbandProvider {
  readonly id: string;
  readonly name: string;
  readonly isHardwareConnected: boolean;

  /** Initialize modem hardware / backend bridge */
  initialize(config?: Record<string, any>): Promise<boolean>;

  /** Establish IP or circuit connection */
  connectSession(): Promise<SatelliteSessionInfo>;

  /** Terminate session */
  disconnectSession(): Promise<void>;

  /** Get live session snapshot */
  getSessionInfo(): SatelliteSessionInfo;

  /** Get live hardware/link diagnostics */
  getDiagnostics(): SatelliteDiagnostics;

  /** Transmit a message and await acknowledgment from satellite gateway */
  sendMessage(msg: SatelliteMessage): Promise<{ success: boolean; ackId?: string; error?: string }>;

  /** Subscribe to connection state and incoming messages */
  subscribeState(callback: (state: SatelliteConnectionState, session: SatelliteSessionInfo) => void): () => void;
  subscribeIncoming(callback: (msg: SatelliteMessage) => void): () => void;
}
