/**
 * POLAR-X Phase 9 — UAV Flight Controller Provider Interface
 * Interface for MAVLink / Dronecode / WebSerial / UDP hardware flight controllers and simulators
 */

import { UavFlightCommand, UavFlightState, UavHomePoint } from './uavAutonomyTypes';

export interface IUavFlightControllerProvider {
  readonly id: string;
  readonly name: string;
  readonly isHardwareConnected: boolean;

  /** Initialize connection to flight controller */
  connect(): Promise<boolean>;

  /** Disconnect */
  disconnect(): Promise<void>;

  /** Send flight command to autopilot */
  sendCommand(
    command: UavFlightCommand,
    params?: Record<string, any>
  ): Promise<{ success: boolean; newState: UavFlightState; error?: string }>;

  /** Upload or update target return-to-home waypoint */
  setHomePoint(homePoint: UavHomePoint): Promise<boolean>;

  /** Subscribe to flight controller status updates */
  subscribe(
    callback: (telemetry: {
      flightState: UavFlightState;
      batteryPercent: number;
      lat: number;
      lng: number;
      altitudeMeters: number;
      speedKmh: number;
      headingDeg: number;
      gpsSats: number;
      timestamp: string;
    }) => void
  ): () => void;
}
