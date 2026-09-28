/**
 * POLAR-X Simulated Polar Telemetry Provider
 * Generates deterministic Antarctic field vehicle trajectories with explicit honesty badges.
 */

import { TelemetryProvider, TelemetryStreamCallback } from './telemetryProvider';
import { TelemetryRecord } from '../../types/telemetry';

interface TrackedUnitSimulation {
  assetId: string;
  assetName: string;
  expeditionCode: string;
  deviceId: string;
  baseLat: number;
  baseLng: number;
  targetLat: number;
  targetLng: number;
  currentProgress: number; // 0 to 1
  speedKmh: number;
  altitudeMeters: number;
  batteryLevel: number;
  heading: number;
}

export class SimulatedTelemetryProvider implements TelemetryProvider {
  public readonly providerId = 'simulated-gnss-v6';
  public readonly name = 'Antarctic Polar GNSS Simulation Engine';
  public readonly isSimulated = true;

  private activeUnits: TrackedUnitSimulation[] = [
    {
      assetId: 'ast-1',
      assetName: 'PistonBully PB-100 #04',
      expeditionCode: 'EXP-2026-088',
      deviceId: 'PB-GNSS-0988',
      baseLat: -70.7667,
      baseLng: 11.7333,
      targetLat: -71.55,
      targetLng: 12.45,
      currentProgress: 0.35,
      speedKmh: 18.5,
      altitudeMeters: 850,
      batteryLevel: 92,
      heading: 145
    },
    {
      assetId: 'ast-2',
      assetName: 'Heavy Snowcat Convoy Alpha',
      expeditionCode: 'EXP-2026-091',
      deviceId: 'SC-CONVOY-01',
      baseLat: -69.4072,
      baseLng: 76.1953,
      targetLat: -69.48,
      targetLng: 76.4,
      currentProgress: 0.6,
      speedKmh: 14.2,
      altitudeMeters: 110,
      batteryLevel: 87,
      heading: 120
    },
    {
      assetId: 'ast-3',
      assetName: 'DHC-6 Twin Otter Aircraft (Airdrop Recon)',
      expeditionCode: 'EXP-2026-090',
      deviceId: 'AV-TWINOTTER-88',
      baseLat: -75.1,
      baseLng: 123.3333,
      targetLat: -82.0,
      targetLng: 0.0,
      currentProgress: 0.48,
      speedKmh: 240.0,
      altitudeMeters: 3200,
      batteryLevel: 98,
      heading: 210
    },
    {
      assetId: 'ast-4',
      assetName: 'Ski-Doo High-Speed Field Scout',
      expeditionCode: 'EXP-2026-088',
      deviceId: 'SD-SCOUT-07',
      baseLat: -70.75,
      baseLng: 11.6,
      targetLat: -71.2,
      targetLng: 12.1,
      currentProgress: 0.75,
      speedKmh: 38.0,
      altitudeMeters: 620,
      batteryLevel: 79,
      heading: 135
    }
  ];

  private intervalId: any = null;
  private subscribers: Set<TelemetryStreamCallback> = new Set();
  private historyBuffer: Map<string, TelemetryRecord[]> = new Map();
  private simulationSpeedMultiplier = 1.0;

  constructor() {
    // Generate initial historical breadcrumbs for each unit
    this.activeUnits.forEach((unit) => {
      const records: TelemetryRecord[] = [];
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const frac = (unit.currentProgress * i) / steps;
        const lat = unit.baseLat + (unit.targetLat - unit.baseLat) * frac;
        const lng = unit.baseLng + (unit.targetLng - unit.baseLng) * frac;
        const timeAgoMs = (steps - i) * 60 * 1000;

        records.push({
          telemetryId: `hist-${unit.deviceId}-${i}`,
          assetId: unit.assetId,
          assetName: unit.assetName,
          expeditionCode: unit.expeditionCode,
          deviceId: unit.deviceId,
          timestamp: new Date(Date.now() - timeAgoMs).toISOString(),
          receivedAt: new Date(Date.now() - timeAgoMs + 500).toISOString(),
          coordinates: {
            latitude: Math.round(lat * 100000) / 100000,
            longitude: Math.round(lng * 100000) / 100000,
            altitudeMeters: Math.round(unit.altitudeMeters * (0.8 + frac * 0.4))
          },
          speedKmh: unit.speedKmh,
          headingDegrees: unit.heading,
          batteryLevelPercent: unit.batteryLevel,
          signalStrengthDbm: -68,
          temperatureC: -22,
          source: 'DEMO SATELLITE GNSS EMULATOR',
          sourceType: 'SIMULATED',
          accuracyMeters: 4.5,
          isSimulated: true,
          status: 'SIMULATED',
          satelliteCount: 11,
          hdop: 0.9
        });
      }
      this.historyBuffer.set(unit.assetId, records);
    });
  }

  public async startStreaming(onRecord: TelemetryStreamCallback): Promise<void> {
    this.subscribers.add(onRecord);

    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.stepSimulation(), 3000);
    }
  }

  public async stopStreaming(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.subscribers.clear();
  }

  public setSpeedMultiplier(multiplier: number): void {
    this.simulationSpeedMultiplier = Math.max(0.2, Math.min(10, multiplier));
  }

  public async getLatestRecords(): Promise<TelemetryRecord[]> {
    const results: TelemetryRecord[] = [];
    this.historyBuffer.forEach((records) => {
      if (records.length > 0) {
        results.push(records[records.length - 1]);
      }
    });
    return results;
  }

  public async getAssetHistory(assetId: string, limitCount: number = 50): Promise<TelemetryRecord[]> {
    const history = this.historyBuffer.get(assetId) || [];
    return history.slice(-limitCount);
  }

  private stepSimulation(): void {
    this.activeUnits.forEach((unit) => {
      // Advance progress smoothly
      unit.currentProgress += 0.005 * this.simulationSpeedMultiplier;
      if (unit.currentProgress > 1.0) {
        unit.currentProgress = 0.05; // Loop trajectory
      }

      const curLat = unit.baseLat + (unit.targetLat - unit.baseLat) * unit.currentProgress;
      const curLng = unit.baseLng + (unit.targetLng - unit.baseLng) * unit.currentProgress;

      const record: TelemetryRecord = {
        telemetryId: `tel-${unit.deviceId}-${Date.now()}`,
        assetId: unit.assetId,
        assetName: unit.assetName,
        expeditionCode: unit.expeditionCode,
        deviceId: unit.deviceId,
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        coordinates: {
          latitude: Math.round(curLat * 100000) / 100000,
          longitude: Math.round(curLng * 100000) / 100000,
          altitudeMeters: unit.altitudeMeters
        },
        speedKmh: unit.speedKmh,
        headingDegrees: unit.heading,
        batteryLevelPercent: unit.batteryLevel,
        signalStrengthDbm: -65,
        temperatureC: -24,
        source: 'DEMO SATELLITE GNSS EMULATOR',
        sourceType: 'SIMULATED',
        accuracyMeters: 3.8,
        isSimulated: true,
        status: 'SIMULATED',
        satelliteCount: 12,
        hdop: 0.85
      };

      // Push to history buffer
      const history = this.historyBuffer.get(unit.assetId) || [];
      history.push(record);
      if (history.length > 100) history.shift();
      this.historyBuffer.set(unit.assetId, history);

      // Broadcast to subscribers
      this.subscribers.forEach((cb) => cb(record));
    });
  }
}

export const simulatedTelemetryProvider = new SimulatedTelemetryProvider();
