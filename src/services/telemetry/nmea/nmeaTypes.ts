/**
 * POLAR-X NMEA 0183 Telemetry Parser Types
 */

export interface ParsedNmeaGga {
  type: 'GGA';
  utcTime: string;
  latitude: number;
  longitude: number;
  fixQuality: number; // 0=invalid, 1=GPS fix, 2=DGPS fix
  satellitesCount: number;
  hdop: number;
  altitudeMeters: number;
}

export interface ParsedNmeaRmc {
  type: 'RMC';
  utcTime: string;
  status: 'A' | 'V'; // A = Active (Valid), V = Void
  latitude: number;
  longitude: number;
  speedKnots: number;
  speedKmh: number;
  trackAngleDegrees: number;
  date: string;
}

export interface ParsedNmeaSentence {
  raw: string;
  talker: string; // e.g. "GP", "GN", "GL"
  sentenceType: 'GGA' | 'RMC' | 'GSA' | 'GSV' | 'UNKNOWN';
  isValidChecksum: boolean;
  data?: ParsedNmeaGga | ParsedNmeaRmc | any;
}
