/**
 * POLAR-X Satellite Telemetry Gateway Provider
 * Hardware interface for Iridium Short Burst Data (SBD) / RockBLOCK hardware gateways.
 */

import { TelemetryProvider, TelemetryStreamCallback } from '../telemetryProvider';
import { TelemetryRecord } from '../../../types/telemetry';

export class SatelliteHardwareProvider implements TelemetryProvider {
  public readonly providerId = 'satellite-iridium-gateway';
  public readonly name = 'Iridium SBD Satellite Transceiver Gateway';
  public readonly isSimulated = false;

  private isHardwareConnected = false;

  public async startStreaming(_onRecord: TelemetryStreamCallback): Promise<void> {
    console.info('[POLAR-X Satellite] Satellite hardware gateway polling initialized. Hardware status: STANDBY/UNCONFIGURED.');
  }

  public async stopStreaming(): Promise<void> {
    // No-op
  }

  public async getLatestRecords(): Promise<TelemetryRecord[]> {
    // Returns empty array because external hardware bridge is unconfigured
    return [];
  }

  public async getAssetHistory(_assetId: string): Promise<TelemetryRecord[]> {
    return [];
  }

  public isAvailable(): boolean {
    return this.isHardwareConnected;
  }
}

export const satelliteHardwareProvider = new SatelliteHardwareProvider();
