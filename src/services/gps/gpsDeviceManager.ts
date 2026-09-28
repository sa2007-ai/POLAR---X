/**
 * POLAR-X GPS Device Manager
 * Integrates Web Serial, NMEA quality evaluation, and live telemetry ingestion.
 */

import { gpsSerialService } from './gpsSerialService';
import { GpsQualityEvaluator } from './gpsConnectionState';
import { GpsBaudRate, GpsConnectionStatus, GpsDeviceInfo, GpsQualityReport } from './gpsTypes';
import { telemetryService } from '../telemetry/telemetryService';
import { TelemetryRecord } from '../../types/telemetry';
import { ParsedNmeaGga, ParsedNmeaRmc, ParsedNmeaSentence } from '../telemetry/nmea/nmeaTypes';
import { offlineDB, STORES } from '../offline/offlineDb';

export class GpsDeviceManager {
  private evaluator = new GpsQualityEvaluator();
  private latestQualityReport: GpsQualityReport | null = null;
  private rawNmeaHistory: string[] = [];
  private maxHistorySize = 50;
  private assignedAssetId = 'ast-gps-direct';
  private assignedExpeditionId = 'EXP-2026-MAITRI-01';

  private reportSubscribers: Set<(report: GpsQualityReport) => void> = new Set();
  private rawSubscribers: Set<(rawHistory: string[]) => void> = new Set();

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    gpsSerialService.subscribeSentences((parsed: ParsedNmeaSentence, raw: string) => {
      this.handleIncomingSentence(parsed, raw);
    });
  }

  public getSupportedBaudRates(): GpsBaudRate[] {
    return [4800, 9600, 38400, 115200];
  }

  public isSupported(): boolean {
    return gpsSerialService.isWebSerialSupported();
  }

  public getStatus(): GpsConnectionStatus {
    return gpsSerialService.getStatus();
  }

  public getDeviceInfo(): GpsDeviceInfo | null {
    return gpsSerialService.getDeviceInfo();
  }

  public getLatestReport(): GpsQualityReport | null {
    return this.latestQualityReport;
  }

  public getRawHistory(): string[] {
    return [...this.rawNmeaHistory];
  }

  public subscribeQualityReport(cb: (report: GpsQualityReport) => void): () => void {
    this.reportSubscribers.add(cb);
    if (this.latestQualityReport) {
      cb(this.latestQualityReport);
    }
    return () => this.reportSubscribers.delete(cb);
  }

  public subscribeRawStream(cb: (history: string[]) => void): () => void {
    this.rawSubscribers.add(cb);
    cb([...this.rawNmeaHistory]);
    return () => this.rawSubscribers.delete(cb);
  }

  public async connectDevice(baudRate: GpsBaudRate = 9600): Promise<boolean> {
    this.evaluator.reset();
    return gpsSerialService.connect(baudRate);
  }

  public async disconnectDevice(): Promise<void> {
    await gpsSerialService.disconnect();
    this.evaluator.reset();
  }

  public injectTestNmeaSentence(sentence: string): void {
    gpsSerialService.injectTestNmea(sentence);
  }

  private async handleIncomingSentence(parsed: ParsedNmeaSentence, raw: string): Promise<void> {
    // Append to raw stream buffer
    this.rawNmeaHistory.unshift(raw);
    if (this.rawNmeaHistory.length > this.maxHistorySize) {
      this.rawNmeaHistory.pop();
    }
    this.rawSubscribers.forEach((cb) => cb([...this.rawNmeaHistory]));

    // Evaluate Quality
    const quality = this.evaluator.evaluate(parsed);
    this.latestQualityReport = quality;
    this.reportSubscribers.forEach((cb) => cb(quality));

    // If valid or degraded fix, synthesize live TelemetryRecord
    if (parsed.isValidChecksum && (parsed.sentenceType === 'GGA' || parsed.sentenceType === 'RMC') && parsed.data) {
      let lat = 0;
      let lng = 0;
      let alt = 0;
      let spd = quality.speedKmh || 0;
      let hdg = quality.heading || 0;

      if (parsed.sentenceType === 'GGA') {
        const gga = parsed.data as ParsedNmeaGga;
        if (gga.fixQuality === 0) return; // No fix
        lat = gga.latitude;
        lng = gga.longitude;
        alt = gga.altitudeMeters;
      } else if (parsed.sentenceType === 'RMC') {
        const rmc = parsed.data as ParsedNmeaRmc;
        if (rmc.status !== 'A') return; // Void
        lat = rmc.latitude;
        lng = rmc.longitude;
        spd = rmc.speedKmh;
        hdg = rmc.trackAngleDegrees;
      }

      if (lat !== 0 || lng !== 0) {
        const telemetryRecord: TelemetryRecord = {
          telemetryId: `TEL-GPS-${Date.now()}`,
          assetId: this.assignedAssetId,
          assetName: 'Direct Hardware Serial GNSS',
          expeditionId: this.assignedExpeditionId,
          expeditionCode: 'EXP-MAITRI-01',
          deviceId: gpsSerialService.getDeviceInfo()?.portName || 'NMEA-GPS-SERIAL-01',
          timestamp: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          coordinates: {
            latitude: lat,
            longitude: lng,
            altitudeMeters: alt
          },
          speedKmh: spd,
          headingDegrees: hdg,
          batteryLevelPercent: 100, // External bus power
          signalStrengthDbm: -65,
          source: 'DIRECT_SERIAL_GPS',
          sourceType: 'GPS',
          accuracyMeters: quality.accuracyMeters || 5.0,
          isSimulated: false,
          status: quality.status === 'VALID' ? 'LIVE' : 'RECENT',
          satelliteCount: quality.satellites,
          hdop: quality.hdop
        };

        // Ingest into telemetry service
        await telemetryService.ingestManualRecord(telemetryRecord);

        // Cache into IndexedDB for offline resilience
        try {
          await offlineDB.put(STORES.ASSETS, {
            id: this.assignedAssetId,
            assetTag: 'GNSS-DIRECT-01',
            name: 'Direct Hardware Serial GNSS',
            category: 'Satellite Communications',
            model: 'u-blox NEO-M8N / Garmin NMEA',
            currentStation: 'Maitri Research Base',
            status: 'Operational',
            healthScore: 98,
            operatingHours: 120,
            subZeroRating: '-50°C Rated',
            lastServiceDate: new Date().toISOString(),
            nextServiceDue: new Date(Date.now() + 86400000 * 30).toISOString(),
            telemetry: {
              engineTemp: '-12°C',
              batteryHealth: '100%',
              gpsLock: true,
              lastPing: telemetryRecord.timestamp
            }
          });
        } catch {
          // IndexedDB fallback
        }
      }
    }
  }
}

export const gpsDeviceManager = new GpsDeviceManager();
