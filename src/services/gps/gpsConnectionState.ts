/**
 * POLAR-X GPS Quality & Connection State Evaluator
 * Validates coordinate limits, satellite counts, HDOP, speed anomalies, and coordinate jumps.
 */

import { GpsQualityReport, GpsFixType, GpsQualityStatus } from './gpsTypes';
import { ParsedNmeaSentence, ParsedNmeaGga, ParsedNmeaRmc } from '../telemetry/nmea/nmeaTypes';

export class GpsQualityEvaluator {
  private lastValidLat: number | null = null;
  private lastValidLng: number | null = null;
  private lastSentenceTime: number | null = null;
  private maxAllowedSpeedKmh = 160; // Polar overland vehicles / Twin Otter max ground speed limit
  private maxAllowedJumpMeters = 2000; // 2km instantaneous jump without speed justification

  public evaluate(sentence: ParsedNmeaSentence): GpsQualityReport {
    const errors: string[] = [];
    let fixType: GpsFixType = 'NO_FIX';
    let satellites = 0;
    let hdop = 99.9;
    let speedKmh = 0;
    let heading = 0;
    let hasCoordinateJump = false;
    let hasSpeedAnomaly = false;
    const now = Date.now();

    if (!sentence.isValidChecksum) {
      errors.push('NMEA checksum verification failed');
    }

    if (sentence.sentenceType === 'GGA' && sentence.data) {
      const gga = sentence.data as ParsedNmeaGga;
      satellites = gga.satellitesCount;
      hdop = gga.hdop;
      
      if (gga.fixQuality === 1 || gga.fixQuality === 2) {
        fixType = satellites >= 4 ? '3D' : '2D';
      } else {
        fixType = 'NO_FIX';
        errors.push('No valid GNSS fix acquired');
      }

      if (gga.latitude < -90 || gga.latitude > 90) {
        errors.push(`Latitude ${gga.latitude}° out of bounds (-90 to +90)`);
      }
      if (gga.longitude < -180 || gga.longitude > 180) {
        errors.push(`Longitude ${gga.longitude}° out of bounds (-180 to +180)`);
      }

      // Check coordinate jump if previous fix existed
      if (this.lastValidLat !== null && this.lastValidLng !== null && fixType !== 'NO_FIX') {
        const distanceM = this.calculateDistanceMeters(this.lastValidLat, this.lastValidLng, gga.latitude, gga.longitude);
        const timeDiffSeconds = this.lastSentenceTime ? (now - this.lastSentenceTime) / 1000 : 1;
        const impliedSpeedKmh = (distanceM / Math.max(1, timeDiffSeconds)) * 3.6;

        if (distanceM > this.maxAllowedJumpMeters && impliedSpeedKmh > this.maxAllowedSpeedKmh) {
          hasCoordinateJump = true;
          errors.push(`Sudden coordinate jump detected: ${Math.round(distanceM)}m in ${timeDiffSeconds.toFixed(1)}s`);
        } else {
          this.lastValidLat = gga.latitude;
          this.lastValidLng = gga.longitude;
        }
      } else if (fixType !== 'NO_FIX') {
        this.lastValidLat = gga.latitude;
        this.lastValidLng = gga.longitude;
      }
    } else if (sentence.sentenceType === 'RMC' && sentence.data) {
      const rmc = sentence.data as ParsedNmeaRmc;
      speedKmh = rmc.speedKmh;
      heading = rmc.trackAngleDegrees;

      if (rmc.status === 'A') {
        fixType = '2D';
      } else {
        fixType = 'NO_FIX';
        errors.push('RMC Status void (V)');
      }

      if (speedKmh > this.maxAllowedSpeedKmh) {
        hasSpeedAnomaly = true;
        errors.push(`Speed anomaly detected: ${speedKmh.toFixed(1)} km/h exceeds maximum envelope`);
      }
    }

    this.lastSentenceTime = now;

    // Freshness check
    const isStale = this.lastSentenceTime ? now - this.lastSentenceTime > 10000 : true;

    // Quality status determination
    let status: GpsQualityStatus = 'VALID';
    if (errors.length > 0 || fixType === 'NO_FIX' || hasCoordinateJump) {
      status = fixType === 'NO_FIX' ? 'INVALID' : 'DEGRADED';
    } else if (satellites < 4 || hdop > 4.0) {
      status = 'DEGRADED';
    } else if (isStale) {
      status = 'STALE';
    }

    return {
      status,
      fixType,
      satellites,
      hdop,
      accuracyMeters: hdop * 2.5,
      lastSentenceAt: new Date(now).toISOString(),
      speedKmh,
      heading,
      hasCoordinateJump,
      hasSpeedAnomaly,
      isStale,
      errors
    };
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  public reset(): void {
    this.lastValidLat = null;
    this.lastValidLng = null;
    this.lastSentenceTime = null;
  }
}
