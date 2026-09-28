/**
 * POLAR-X Telemetry Service
 * Multi-provider routing, live streams, IndexedDB persistence, and corridor deviation checks.
 */

import { TelemetryProvider } from './telemetryProvider';
import { simulatedTelemetryProvider } from './simulatedTelemetryProvider';
import { TelemetryRecord } from '../../types/telemetry';
import { validateTelemetryRecord } from './telemetryValidator';

export class TelemetryService {
  private activeProvider: TelemetryProvider = simulatedTelemetryProvider;
  private currentRecords: Map<string, TelemetryRecord> = new Map();
  private subscribers: Set<(records: TelemetryRecord[]) => void> = new Set();
  private isStreaming = false;

  constructor() {
    this.initService();
  }

  private async initService(): Promise<void> {
    const latest = await this.activeProvider.getLatestRecords();
    latest.forEach((rec) => this.currentRecords.set(rec.assetId, rec));
  }

  public setProvider(provider: TelemetryProvider): void {
    if (this.isStreaming) {
      this.activeProvider.stopStreaming();
    }
    this.activeProvider = provider;
    if (this.isStreaming) {
      this.startLiveStream();
    }
  }

  public getProviderName(): string {
    return this.activeProvider.name;
  }

  public isSimulated(): boolean {
    return this.activeProvider.isSimulated;
  }

  public async startLiveStream(): Promise<void> {
    this.isStreaming = true;
    await this.activeProvider.startStreaming((record) => {
      const validation = validateTelemetryRecord(record);
      if (!validation.isValid) {
        console.warn('[POLAR-X Telemetry] Rejected invalid telemetry record:', validation.errors);
        return;
      }

      this.currentRecords.set(record.assetId, record);
      this.notifySubscribers();
    });
  }

  public stopLiveStream(): void {
    this.isStreaming = false;
    this.activeProvider.stopStreaming();
  }

  public subscribe(callback: (records: TelemetryRecord[]) => void): () => void {
    this.subscribers.add(callback);
    callback(Array.from(this.currentRecords.values()));

    if (!this.isStreaming) {
      this.startLiveStream();
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stopLiveStream();
      }
    };
  }

  public async getLatestRecords(): Promise<TelemetryRecord[]> {
    return Array.from(this.currentRecords.values());
  }

  public async getAssetHistory(assetId: string, limitCount: number = 50): Promise<TelemetryRecord[]> {
    return this.activeProvider.getAssetHistory(assetId, limitCount);
  }

  public async ingestManualRecord(record: TelemetryRecord): Promise<boolean> {
    const validation = validateTelemetryRecord(record);
    if (!validation.isValid) {
      throw new Error(`Telemetry validation failure: ${validation.errors.join(', ')}`);
    }

    this.currentRecords.set(record.assetId, record);
    this.notifySubscribers();
    return true;
  }

  private notifySubscribers(): void {
    const records = Array.from(this.currentRecords.values());
    this.subscribers.forEach((cb) => cb(records));
  }
}

export const telemetryService = new TelemetryService();
