/**
 * POLAR-X Simulated Wearable Telemetry Provider
 * Generates realistic biometric safety telemetry for polar expedition personnel.
 */

import { WearableTelemetryRecord } from './bleTypes';

export const INITIAL_WEARABLE_RECORDS: WearableTelemetryRecord[] = [
  {
    recordId: 'WREC-01',
    deviceId: 'BLE-POLAR-01',
    deviceName: 'Polar Sense Bio-Strap #1',
    personnelId: 'PER-001',
    personnelName: 'Dr. Rajesh Sharma',
    timestamp: new Date().toISOString(),
    heartRateBpm: 84,
    skinTempC: 32.4,
    coreTempEstC: 36.8,
    activityLevel: 'WALKING',
    batteryPercent: 88,
    signalRssi: -72,
    isSimulated: true,
    hasHypothermiaRisk: false,
    hasExertionWarning: false,
    isImmobile: false,
    freshness: 'LIVE'
  },
  {
    recordId: 'WREC-02',
    deviceId: 'BLE-POLAR-02',
    deviceName: 'Garmin Tactix Polar #2',
    personnelId: 'PER-002',
    personnelName: 'Capt. Vikram Singh',
    timestamp: new Date().toISOString(),
    heartRateBpm: 118,
    skinTempC: 28.6,
    coreTempEstC: 36.4,
    activityLevel: 'HIGH_EXERTION',
    batteryPercent: 74,
    signalRssi: -84,
    isSimulated: true,
    hasHypothermiaRisk: false,
    hasExertionWarning: true,
    isImmobile: false,
    freshness: 'LIVE'
  },
  {
    recordId: 'WREC-03',
    deviceId: 'BLE-POLAR-03',
    deviceName: 'Polar Sense Bio-Strap #3',
    personnelId: 'PER-003',
    personnelName: 'Dr. Ananya Roy',
    timestamp: new Date().toISOString(),
    heartRateBpm: 72,
    skinTempC: 33.1,
    coreTempEstC: 37.0,
    activityLevel: 'RESTING',
    batteryPercent: 95,
    signalRssi: -65,
    isSimulated: true,
    hasHypothermiaRisk: false,
    hasExertionWarning: false,
    isImmobile: false,
    freshness: 'LIVE'
  }
];

export class WearableTelemetryService {
  private records: Map<string, WearableTelemetryRecord> = new Map();
  private subscribers: Set<(records: WearableTelemetryRecord[]) => void> = new Set();
  private timer: any = null;

  constructor() {
    INITIAL_WEARABLE_RECORDS.forEach((r) => this.records.set(r.personnelId, r));
    this.startSimulationStream();
  }

  public getRecords(): WearableTelemetryRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordForPersonnel(personnelId: string): WearableTelemetryRecord | undefined {
    return this.records.get(personnelId);
  }

  public subscribe(cb: (records: WearableTelemetryRecord[]) => void): () => void {
    this.subscribers.add(cb);
    cb(Array.from(this.records.values()));
    return () => this.subscribers.delete(cb);
  }

  private startSimulationStream(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.records.forEach((rec, id) => {
        // Realistic micro-variations in HR and Skin Temp
        const hrDelta = Math.round((Math.random() - 0.5) * 4);
        const newHr = Math.max(55, Math.min(160, rec.heartRateBpm + hrDelta));
        const tempDelta = Math.round((Math.random() - 0.5) * 0.2 * 10) / 10;
        const newSkinTemp = Math.round((rec.skinTempC + tempDelta) * 10) / 10;

        const updated: WearableTelemetryRecord = {
          ...rec,
          heartRateBpm: newHr,
          skinTempC: newSkinTemp,
          timestamp: new Date().toISOString(),
          hasHypothermiaRisk: newSkinTemp < 29.0,
          hasExertionWarning: newHr > 140
        };
        this.records.set(id, updated);
      });
      this.notifySubscribers();
    }, 4000);
  }

  private notifySubscribers(): void {
    const list = Array.from(this.records.values());
    this.subscribers.forEach((cb) => cb(list));
  }
}

export const wearableTelemetryService = new WearableTelemetryService();
