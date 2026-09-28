/**
 * POLAR-X Demo Solar Activity Provider
 * Simulates polar ionospheric and geomagnetic space weather with honest telemetry indicators.
 */

import { SolarProvider } from './solarProvider';
import { SolarActivitySnapshot, SolarStormLevel, SolarImpactAdvisory } from './solarTypes';

export class DemoSolarProvider implements SolarProvider {
  public readonly name = 'Polar Space Weather Simulation Model';
  public readonly isSimulated = true;

  public async getCurrentSolarActivity(): Promise<SolarActivitySnapshot> {
    // Realistic cyclical variation
    const minute = new Date().getUTCMinutes();
    const kpRaw = 2.3 + Math.sin(minute / 12) * 1.8; // oscillates roughly between 0.5 and 4.1
    const kpIndex = Math.min(9, Math.max(0, Math.round(kpRaw * 10) / 10));

    let stormLevel: SolarStormLevel = 'QUIET';
    let advisory: SolarImpactAdvisory;

    if (kpIndex >= 7) {
      stormLevel = 'MAJOR_STORM';
      advisory = {
        hfRadioPropagation: 'TOTAL_BLACKOUT',
        gpsAccuracyRisk: 'SEVERE_SCINTILLATION',
        satelliteUplinkHealth: 'HIGH_LATENCY',
        summary: 'G3 Strong Geomagnetic Storm in progress. HF trans-polar radio blackouts expected across all Antarctic sectors.'
      };
    } else if (kpIndex >= 5) {
      stormLevel = 'MINOR_STORM';
      advisory = {
        hfRadioPropagation: 'BLACKOUT_RISK',
        gpsAccuracyRisk: 'MINOR_DRIFT',
        satelliteUplinkHealth: 'INTERMITTENT',
        summary: 'G1 Minor Geomagnetic Storm. Polar cap absorption affecting high-frequency long-range radio links.'
      };
    } else if (kpIndex >= 3.5) {
      stormLevel = 'ACTIVE';
      advisory = {
        hfRadioPropagation: 'DEGRADED',
        gpsAccuracyRisk: 'NOMINAL',
        satelliteUplinkHealth: 'OPTIMAL',
        summary: 'Unsettled to active geomagnetic field. Auroral oval expanding toward Maitri and Bharati latitudes.'
      };
    } else {
      stormLevel = 'QUIET';
      advisory = {
        hfRadioPropagation: 'NORMAL',
        gpsAccuracyRisk: 'NOMINAL',
        satelliteUplinkHealth: 'OPTIMAL',
        summary: 'Geomagnetic field quiet. Optimal trans-polar HF radio propagation and GPS positioning.'
      };
    }

    const solarWindSpeed = Math.round(380 + kpIndex * 35);
    const auroraLikelihood = Math.min(100, Math.round(kpIndex * 15 + 20));

    return {
      kpIndex,
      stormLevel,
      solarWindSpeedKms: solarWindSpeed,
      interplanetaryMagneticFieldBzNt: Math.round((-1.2 - kpIndex * 0.8) * 10) / 10,
      radioFlux107Cm: 145,
      timestamp: new Date().toISOString(),
      auroraVisibilityLikelihoodPercent: auroraLikelihood,
      source: 'SIMULATED',
      isSimulated: true,
      providerName: this.name,
      advisory,
      disclaimer: 'Simulated polar space weather model for SIH demonstration. Not certified NOAA/SWPC space telemetry.'
    };
  }
}

export const demoSolarProvider = new DemoSolarProvider();
