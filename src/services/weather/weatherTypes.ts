/**
 * POLAR-X Weather Intelligence Types
 */

export type WeatherRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
export type WeatherConditionType =
  | 'Clear'
  | 'Partly Cloudy'
  | 'Overcast'
  | 'Blowing Snow'
  | 'Blizzard'
  | 'Whiteout'
  | 'Freezing Fog'
  | 'Katabatic Storm';

export type WeatherDataSource = 'LIVE' | 'SIMULATED' | 'CACHED' | 'UNAVAILABLE';

export interface WeatherRiskFactor {
  factor: string;
  severity: WeatherRiskLevel;
  description: string;
  measuredValue: string;
  threshold: string;
}

export interface WeatherRiskAssessment {
  overallRisk: WeatherRiskLevel;
  riskScore: number; // 0 to 100
  factors: WeatherRiskFactor[];
  isTraverseRecommended: boolean;
  advisoryText: string;
  disclaimer: string;
}

export interface WeatherSnapshot {
  stationOrRegion: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  temperatureC: number;
  apparentTemperatureC: number; // Wind chill
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDeg: number;
  windDirectionCardinal: string;
  pressureHpa: number;
  visibilityKm: number;
  humidityPercent: number;
  condition: WeatherConditionType;
  uvIndex: number;
  source: WeatherDataSource;
  isSimulated: boolean;
  providerName: string;
  assessment: WeatherRiskAssessment;
}
