/**
 * POLAR-X Polar Weather Risk Evaluation Engine
 * Evaluates polar meteorological parameters using Antarctic operational rules.
 * 
 * DISCLAIMER: This evaluation is an automated operational risk estimation aid
 * based on standard polar field safety models and is NOT a certified
 * scientific meteorological forecast or government safety guarantee.
 */

import { WeatherRiskLevel, WeatherRiskAssessment, WeatherRiskFactor, WeatherConditionType } from './weatherTypes';

export const calculateWindChill = (tempC: number, windSpeedKmh: number): number => {
  if (windSpeedKmh < 4.8 || tempC > 10) return tempC;
  // Standard Joint Action Group on Temperature Indices (JAG/TI) Antarctic wind chill formula
  const v016 = Math.pow(windSpeedKmh, 0.16);
  const wc = 13.12 + 0.6215 * tempC - 11.37 * v016 + 0.3965 * tempC * v016;
  return Math.round(wc);
};

export const assessWeatherRisk = (
  tempC: number,
  windSpeedKmh: number,
  windGustKmh: number,
  visibilityKm: number,
  condition: WeatherConditionType,
  pressureHpa: number
): WeatherRiskAssessment => {
  const factors: WeatherRiskFactor[] = [];
  let score = 0;

  // 1. Temperature & Wind Chill Assessment
  const apparentTemp = calculateWindChill(tempC, windSpeedKmh);
  if (apparentTemp <= -50) {
    factors.push({
      factor: 'Extreme Wind Chill',
      severity: 'EXTREME',
      description: 'Severe frostbite risk in under 2 minutes. Exposed skin rapidly suffers tissue freezing.',
      measuredValue: `${apparentTemp}°C (Air: ${tempC}°C)`,
      threshold: '<= -50°C'
    });
    score += 40;
  } else if (apparentTemp <= -35) {
    factors.push({
      factor: 'Severe Low Temperature',
      severity: 'HIGH',
      description: 'High frostbite and hypothermia hazard during motorized or pedestrian traverse.',
      measuredValue: `${apparentTemp}°C (Air: ${tempC}°C)`,
      threshold: '<= -35°C'
    });
    score += 25;
  } else if (apparentTemp <= -20) {
    factors.push({
      factor: 'Sub-Zero Operating Temperature',
      severity: 'MODERATE',
      description: 'Standard Antarctic winter operating protocols required.',
      measuredValue: `${apparentTemp}°C`,
      threshold: '<= -20°C'
    });
    score += 10;
  }

  // 2. Wind & Katabatic Gust Assessment
  if (windSpeedKmh >= 85 || windGustKmh >= 110) {
    factors.push({
      factor: 'Storm / Katabatic Gale',
      severity: 'EXTREME',
      description: 'Severe katabatic gale. PistonBully traverse and aviation operations prohibited.',
      measuredValue: `Sustained ${windSpeedKmh} km/h (Gusts: ${windGustKmh} km/h)`,
      threshold: '>= 85 km/h'
    });
    score += 45;
  } else if (windSpeedKmh >= 55 || windGustKmh >= 75) {
    factors.push({
      factor: 'High Polar Winds',
      severity: 'HIGH',
      description: 'Strong surface winds creating ground blizzards and high vehicle drift risk.',
      measuredValue: `${windSpeedKmh} km/h (Gusts: ${windGustKmh} km/h)`,
      threshold: '>= 55 km/h'
    });
    score += 25;
  } else if (windSpeedKmh >= 35) {
    factors.push({
      factor: 'Moderate Breeze',
      severity: 'MODERATE',
      description: 'Elevated snow drifting across traverse routes.',
      measuredValue: `${windSpeedKmh} km/h`,
      threshold: '>= 35 km/h'
    });
    score += 10;
  }

  // 3. Visibility & Whiteout Hazard
  if (visibilityKm <= 0.2 || condition === 'Whiteout' || condition === 'Blizzard') {
    factors.push({
      factor: 'Whiteout / Zero Visibility',
      severity: 'EXTREME',
      description: 'Loss of optical horizon and crevasse field edge definition. High collision risk.',
      measuredValue: `${visibilityKm} km (${condition})`,
      threshold: '<= 0.2 km'
    });
    score += 40;
  } else if (visibilityKm <= 1.0 || condition === 'Blowing Snow' || condition === 'Freezing Fog') {
    factors.push({
      factor: 'Restricted Visibility',
      severity: 'HIGH',
      description: 'Reduced visual navigation range. Waypoint tracking must rely on radar/GPS.',
      measuredValue: `${visibilityKm} km (${condition})`,
      threshold: '<= 1.0 km'
    });
    score += 20;
  } else if (visibilityKm <= 5.0) {
    factors.push({
      factor: 'Moderate Atmospheric Haze',
      severity: 'MODERATE',
      description: 'Slightly impaired distance viewing.',
      measuredValue: `${visibilityKm} km`,
      threshold: '<= 5.0 km'
    });
    score += 5;
  }

  // 4. Pressure Gradient Drop (Blizzard indicator)
  if (pressureHpa < 970) {
    factors.push({
      factor: 'Deep Polar Low Pressure',
      severity: 'HIGH',
      description: 'Severe cyclonic frontal depression approaching.',
      measuredValue: `${pressureHpa} hPa`,
      threshold: '< 970 hPa'
    });
    score += 15;
  }

  const boundedScore = Math.min(100, Math.max(0, score));

  let overallRisk: WeatherRiskLevel = 'LOW';
  let isTraverseRecommended = true;
  let advisoryText = 'Normal polar field operations permitted under standard safety protocol.';

  if (boundedScore >= 65 || factors.some((f) => f.severity === 'EXTREME')) {
    overallRisk = 'EXTREME';
    isTraverseRecommended = false;
    advisoryText = 'CRITICAL CODE RED: Traverse strictly prohibited. Personnel must shelter in station.';
  } else if (boundedScore >= 40 || factors.some((f) => f.severity === 'HIGH')) {
    overallRisk = 'HIGH';
    isTraverseRecommended = false;
    advisoryText = 'HIGH RISK WARNING: Non-essential traverses suspended. Heavy convoy equipment required.';
  } else if (boundedScore >= 20) {
    overallRisk = 'MODERATE';
    isTraverseRecommended = true;
    advisoryText = 'MODERATE ADVISORY: Traverse permitted with redundant comms and heated survival sledges.';
  }

  return {
    overallRisk,
    riskScore: boundedScore,
    factors,
    isTraverseRecommended,
    advisoryText,
    disclaimer: 'Calculated polar risk estimation aid; not a certified navigation or meteorological guarantee.'
  };
};
