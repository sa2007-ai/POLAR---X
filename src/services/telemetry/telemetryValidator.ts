/**
 * POLAR-X Telemetry Sanity & Coordinate Validator
 */

import { TelemetryRecord } from '../../types/telemetry';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCoordinates = (lat: number, lng: number): boolean => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
};

export const validateTelemetryRecord = (record: Partial<TelemetryRecord>): ValidationResult => {
  const errors: string[] = [];

  if (!record.deviceId?.trim()) {
    errors.push('Device ID is required.');
  }

  if (!record.assetId?.trim()) {
    errors.push('Asset ID is required.');
  }

  if (!record.coordinates || !validateCoordinates(record.coordinates.latitude, record.coordinates.longitude)) {
    errors.push(`Invalid geographic coordinates: (${record.coordinates?.latitude}, ${record.coordinates?.longitude})`);
  }

  if (record.speedKmh !== undefined && (record.speedKmh < 0 || record.speedKmh > 300)) {
    errors.push(`Speed out of realistic polar operating range: ${record.speedKmh} km/h`);
  }

  if (record.headingDegrees !== undefined && (record.headingDegrees < 0 || record.headingDegrees >= 360)) {
    errors.push(`Heading must be between 0 and 359 degrees: ${record.headingDegrees}`);
  }

  if (record.batteryLevelPercent !== undefined && (record.batteryLevelPercent < 0 || record.batteryLevelPercent > 100)) {
    errors.push(`Battery percentage must be between 0 and 100: ${record.batteryLevelPercent}`);
  }

  if (!record.timestamp || isNaN(Date.parse(record.timestamp))) {
    errors.push('Invalid ISO UTC timestamp.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateFreshnessStatus = (
  timestamp: string,
  isSimulated: boolean = false
): TelemetryRecord['status'] => {
  if (isSimulated) return 'SIMULATED';

  const timeMs = Date.parse(timestamp);
  if (isNaN(timeMs)) return 'INVALID';

  const ageMs = Date.now() - timeMs;
  if (ageMs < 2 * 60 * 1000) {
    return 'LIVE'; // Under 2 minutes
  }
  if (ageMs < 10 * 60 * 1000) {
    return 'RECENT'; // 2 to 10 minutes
  }
  return 'STALE'; // > 10 minutes
};
