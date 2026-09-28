/**
 * POLAR-X Solar & Geomagnetic Activity Types
 */

export type SolarStormLevel = 'QUIET' | 'UNSETTLED' | 'ACTIVE' | 'MINOR_STORM' | 'MAJOR_STORM' | 'SEVERE_STORM';
export type SolarDataSource = 'LIVE' | 'SIMULATED' | 'CACHED' | 'UNAVAILABLE';

export interface SolarImpactAdvisory {
  hfRadioPropagation: 'NORMAL' | 'DEGRADED' | 'BLACKOUT_RISK' | 'TOTAL_BLACKOUT';
  gpsAccuracyRisk: 'NOMINAL' | 'MINOR_DRIFT' | 'SEVERE_SCINTILLATION';
  satelliteUplinkHealth: 'OPTIMAL' | 'INTERMITTENT' | 'HIGH_LATENCY';
  summary: string;
}

export interface SolarActivitySnapshot {
  kpIndex: number; // 0 to 9
  stormLevel: SolarStormLevel;
  solarWindSpeedKms: number; // e.g. 420 km/s
  interplanetaryMagneticFieldBzNt: number; // e.g. -3.4 nT
  radioFlux107Cm: number; // Solar flux unit (sfu)
  timestamp: string;
  auroraVisibilityLikelihoodPercent: number; // 0 to 100%
  source: SolarDataSource;
  isSimulated: boolean;
  providerName: string;
  advisory: SolarImpactAdvisory;
  disclaimer: string;
}
