/**
 * POLAR-X Phase 9 — Simulated Flight Controller Provider
 * ArduPilot / PX4 MAVLink Autopilot Emulation with Realistic Polar Aerodynamics
 */

import { IUavFlightControllerProvider } from './uavFlightControllerProvider';
import { UavFlightCommand, UavFlightState, UavHomePoint } from './uavAutonomyTypes';

export class SimulatedFlightControllerProvider implements IUavFlightControllerProvider {
  public readonly id = 'provider-simulated-px4-sitl';
  public readonly name = 'PX4 / ArduPilot Polar SITL Autopilot (Simulated)';
  public readonly isHardwareConnected = false;

  private flightState: UavFlightState = 'MISSION_ACTIVE';
  private batteryPercent = 76.5;
  private currentLat = -70.92;
  private currentLng = 11.85;
  private currentAlt = 145;
  private speedKmh = 48.0;
  private headingDeg = 160;
  private gpsSats = 14;

  private homePoint: UavHomePoint | null = null;
  private subscribers: Set<(telem: any) => void> = new Set();
  private loopTimer: any = null;

  constructor() {
    this.startFlightLoop();
  }

  public async connect(): Promise<boolean> {
    return true;
  }

  public async disconnect(): Promise<void> {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
    }
  }

  public async setHomePoint(homePoint: UavHomePoint): Promise<boolean> {
    this.homePoint = homePoint;
    return true;
  }

  public async sendCommand(
    command: UavFlightCommand,
    _params?: Record<string, any>
  ): Promise<{ success: boolean; newState: UavFlightState; error?: string }> {
    switch (command) {
      case 'REQUEST_RTL':
      case 'RETURN_HOME':
        if (!this.homePoint) {
          return {
            success: false,
            newState: this.flightState,
            error: 'No verified home point registered in autopilot'
          };
        }
        this.flightState = 'RTL_ACTIVE';
        this.headingDeg = this.calculateHeadingTo(this.homePoint.coordinates.lat, this.homePoint.coordinates.lng);
        this.notify();
        return { success: true, newState: 'RTL_ACTIVE' };

      case 'ABORT_RTL':
        this.flightState = 'MISSION_ACTIVE';
        this.notify();
        return { success: true, newState: 'MISSION_ACTIVE' };

      case 'PAUSE_MISSION':
        this.flightState = 'IDLE';
        this.speedKmh = 0;
        this.notify();
        return { success: true, newState: 'IDLE' };

      case 'RESUME_MISSION':
        this.flightState = 'MISSION_ACTIVE';
        this.speedKmh = 48;
        this.notify();
        return { success: true, newState: 'MISSION_ACTIVE' };

      case 'LAND':
        this.flightState = 'LANDING';
        this.notify();
        return { success: true, newState: 'LANDING' };

      case 'TAKEOFF':
        this.flightState = 'MISSION_ACTIVE';
        this.currentAlt = 100;
        this.notify();
        return { success: true, newState: 'MISSION_ACTIVE' };

      default:
        return { success: false, newState: this.flightState, error: `Unsupported command ${command}` };
    }
  }

  public subscribe(callback: (telem: any) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getTelemetrySnapshot());
    return () => this.subscribers.delete(callback);
  }

  private getTelemetrySnapshot() {
    return {
      flightState: this.flightState,
      batteryPercent: Math.round(this.batteryPercent * 10) / 10,
      lat: Number(this.currentLat.toFixed(5)),
      lng: Number(this.currentLng.toFixed(5)),
      altitudeMeters: Math.round(this.currentAlt),
      speedKmh: Math.round(this.speedKmh),
      headingDeg: Math.round(this.headingDeg),
      gpsSats: this.gpsSats,
      timestamp: new Date().toISOString()
    };
  }

  private notify(): void {
    const snap = this.getTelemetrySnapshot();
    this.subscribers.forEach((cb) => cb(snap));
  }

  private startFlightLoop(): void {
    this.loopTimer = setInterval(() => {
      // Consume battery
      if (this.flightState !== 'LANDED' && this.flightState !== 'RECOVERED') {
        this.batteryPercent = Math.max(5, this.batteryPercent - 0.05);
      }

      if (this.flightState === 'MISSION_ACTIVE') {
        // Patrol forward
        this.currentLat -= 0.0004;
        this.currentLng += 0.0006;
      } else if (this.flightState === 'RTL_ACTIVE' && this.homePoint) {
        // Fly directly toward home point
        const targetLat = this.homePoint.coordinates.lat;
        const targetLng = this.homePoint.coordinates.lng;

        const dLat = targetLat - this.currentLat;
        const dLng = targetLng - this.currentLng;
        const dist = Math.hypot(dLat, dLng);

        if (dist < 0.002) {
          // Arrived at home point, initiate landing
          this.flightState = 'LANDING';
        } else {
          this.currentLat += (dLat / dist) * 0.0012;
          this.currentLng += (dLng / dist) * 0.0012;
          this.headingDeg = this.calculateHeadingTo(targetLat, targetLng);
        }
      } else if (this.flightState === 'LANDING') {
        this.currentAlt = Math.max(0, this.currentAlt - 5);
        this.speedKmh = Math.max(0, this.speedKmh - 4);
        if (this.currentAlt <= 0) {
          this.flightState = 'LANDED';
        }
      }

      this.notify();
    }, 2000);
  }

  private calculateHeadingTo(targetLat: number, targetLng: number): number {
    const y = Math.sin(targetLng - this.currentLng) * Math.cos(targetLat);
    const x =
      Math.cos(this.currentLat) * Math.sin(targetLat) -
      Math.sin(this.currentLat) * Math.cos(targetLat) * Math.cos(targetLng - this.currentLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  public setFlightStateDirect(state: UavFlightState): void {
    this.flightState = state;
    this.notify();
  }
}
