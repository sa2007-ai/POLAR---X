/**
 * POLAR-X Telemetry Provider Interface
 */

import { TelemetryRecord } from '../../types/telemetry';

export type TelemetryStreamCallback = (record: TelemetryRecord) => void;

export interface TelemetryProvider {
  readonly providerId: string;
  readonly name: string;
  readonly isSimulated: boolean;
  
  startStreaming(onRecord: TelemetryStreamCallback): Promise<void>;
  stopStreaming(): Promise<void>;
  getLatestRecords(): Promise<TelemetryRecord[]>;
  getAssetHistory(assetId: string, limitCount?: number): Promise<TelemetryRecord[]>;
}
