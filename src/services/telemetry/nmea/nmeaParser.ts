/**
 * POLAR-X NMEA 0183 Sentence Parser
 * Decodes GNSS serial streams ($GPGGA, $GPRMC) into validated coordinate records.
 */

import { ParsedNmeaSentence, ParsedNmeaGga, ParsedNmeaRmc } from './nmeaTypes';

/**
 * Verify NMEA XOR checksum
 */
export const verifyNmeaChecksum = (sentence: string): boolean => {
  const trimmed = sentence.trim();
  const asteriskIndex = trimmed.indexOf('*');
  if (asteriskIndex === -1) return true; // Accept sentences without explicit checksum in demo streams

  const payload = trimmed.slice(trimmed.startsWith('$') ? 1 : 0, asteriskIndex);
  const expectedChecksumHex = trimmed.slice(asteriskIndex + 1);

  let calculatedChecksum = 0;
  for (let i = 0; i < payload.length; i++) {
    calculatedChecksum ^= payload.charCodeAt(i);
  }

  const expectedChecksum = parseInt(expectedChecksumHex, 16);
  return calculatedChecksum === expectedChecksum;
};

/**
 * Convert NMEA coordinate format (DDMM.MMMM or DDDMM.MMMM) to decimal degrees
 */
export const nmeaDegreesToDecimal = (coordinateStr: string, direction: 'N' | 'S' | 'E' | 'W'): number => {
  if (!coordinateStr || !direction) return 0;

  const dotIndex = coordinateStr.indexOf('.');
  if (dotIndex === -1) return 0;

  const degreeDigits = direction === 'N' || direction === 'S' ? 2 : 3;
  const degrees = parseFloat(coordinateStr.slice(0, degreeDigits)) || 0;
  const minutes = parseFloat(coordinateStr.slice(degreeDigits)) || 0;

  let decimal = degrees + minutes / 60;
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return Math.round(decimal * 1000000) / 1000000;
};

export const parseNmeaSentence = (rawSentence: string): ParsedNmeaSentence => {
  const clean = rawSentence.trim();
  const isValidChecksum = verifyNmeaChecksum(clean);

  const parts = clean.replace(/^\$/, '').split('*')[0].split(',');
  const header = parts[0] || '';
  const talker = header.slice(0, 2);
  const sentenceType = header.slice(2) as 'GGA' | 'RMC' | 'GSA' | 'GSV';

  if (sentenceType === 'GGA') {
    // $GPGGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx
    const utcTime = parts[1] || '';
    const latStr = parts[2] || '';
    const latDir = (parts[3] || 'S') as 'N' | 'S';
    const lonStr = parts[4] || '';
    const lonDir = (parts[5] || 'E') as 'E' | 'W';
    const fixQuality = parseInt(parts[6] || '0', 10);
    const satellitesCount = parseInt(parts[7] || '0', 10);
    const hdop = parseFloat(parts[8] || '1.0');
    const altitudeMeters = parseFloat(parts[9] || '0');

    const latitude = nmeaDegreesToDecimal(latStr, latDir);
    const longitude = nmeaDegreesToDecimal(lonStr, lonDir);

    const ggaData: ParsedNmeaGga = {
      type: 'GGA',
      utcTime,
      latitude,
      longitude,
      fixQuality,
      satellitesCount,
      hdop,
      altitudeMeters
    };

    return {
      raw: clean,
      talker,
      sentenceType: 'GGA',
      isValidChecksum,
      data: ggaData
    };
  }

  if (sentenceType === 'RMC') {
    // $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,,,A
    const utcTime = parts[1] || '';
    const status = (parts[2] || 'V') as 'A' | 'V';
    const latStr = parts[3] || '';
    const latDir = (parts[4] || 'S') as 'N' | 'S';
    const lonStr = parts[5] || '';
    const lonDir = (parts[6] || 'E') as 'E' | 'W';
    const speedKnots = parseFloat(parts[7] || '0');
    const trackAngleDegrees = parseFloat(parts[8] || '0');
    const date = parts[9] || '';

    const latitude = nmeaDegreesToDecimal(latStr, latDir);
    const longitude = nmeaDegreesToDecimal(lonStr, lonDir);
    const speedKmh = Math.round(speedKnots * 1.852 * 10) / 10;

    const rmcData: ParsedNmeaRmc = {
      type: 'RMC',
      utcTime,
      status,
      latitude,
      longitude,
      speedKnots,
      speedKmh,
      trackAngleDegrees,
      date
    };

    return {
      raw: clean,
      talker,
      sentenceType: 'RMC',
      isValidChecksum,
      data: rmcData
    };
  }

  return {
    raw: clean,
    talker,
    sentenceType: 'UNKNOWN',
    isValidChecksum
  };
};
