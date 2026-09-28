/**
 * POLAR-X Traverse Route Optimization & Validation Engine
 * 
 * DISCLAIMER:
 * This algorithm provides operational planning estimates and risk analyses.
 * It is NOT certified navigation software and does NOT guarantee safety
 * in unpredictable polar conditions.
 */

import {
  RouteWaypoint,
  RouteSegment,
  RouteCostBreakdown,
  RouteWarning
} from '../../types/route';
import { GeofenceZone } from '../../types/geofence';
import { WeatherRiskAssessment } from '../weather/weatherTypes';
import { SolarActivitySnapshot } from '../solar/solarTypes';

// Convert degrees to radians
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance using Haversine formula (km)
 */
export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Check if a point is within radius meters of center
 */
const isPointInRadius = (
  pLat: number,
  pLng: number,
  cLat: number,
  cLng: number,
  radiusMeters: number
): boolean => {
  const distKm = calculateDistanceKm(pLat, pLng, cLat, cLng);
  return distKm * 1000 <= radiusMeters;
};

/**
 * Line segment distance to circle center check for geofence intersections
 */
const doesSegmentIntersectCircle = (
  p1Lat: number,
  p1Lng: number,
  p2Lat: number,
  p2Lng: number,
  cLat: number,
  cLng: number,
  radiusMeters: number
): boolean => {
  // Sample 10 points along the segment
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const curLat = p1Lat + (p2Lat - p1Lat) * frac;
    const curLng = p1Lng + (p2Lng - p1Lng) * frac;
    if (isPointInRadius(curLat, curLng, cLat, cLng, radiusMeters)) {
      return true;
    }
  }
  return false;
};

export interface RouteOptimizationOptions {
  avoidHazards?: boolean;
  avoidRestrictedZones?: boolean;
  speedKmh?: number; // default ~18 km/h for polar snowcats
}

export class RouteOptimizationService {
  private defaultSpeedKmh = 18; // Average Antarctic PistonBully traverse speed

  /**
   * Optimize and analyze a sequence of waypoints
   */
  public analyzeRoute(
    waypoints: RouteWaypoint[],
    geofences: GeofenceZone[],
    weatherAssessment?: WeatherRiskAssessment,
    solarSnapshot?: SolarActivitySnapshot,
    options: RouteOptimizationOptions = {}
  ): {
    segments: RouteSegment[];
    totalDistanceKm: number;
    estimatedTravelHours: number;
    costAnalysis: RouteCostBreakdown;
    warnings: RouteWarning[];
  } {
    if (waypoints.length < 2) {
      return {
        segments: [],
        totalDistanceKm: 0,
        estimatedTravelHours: 0,
        costAnalysis: {
          baseDistanceCost: 0,
          terrainDifficultyPenalty: 0,
          hazardZonePenalty: 0,
          restrictedZonePenalty: 0,
          weatherRiskPenalty: 0,
          solarRadioDegradationPenalty: 0,
          totalCalculatedRiskCost: 0
        },
        warnings: [
          {
            code: 'MISSING_TELEMETRY',
            severity: 'WARNING',
            message: 'Route requires at least an Origin and Destination waypoint.'
          }
        ]
      };
    }

    const segments: RouteSegment[] = [];
    const warnings: RouteWarning[] = [];
    let totalDistanceKm = 0;
    let hazardIntersectionsCount = 0;
    let restrictedIntersectionsCount = 0;

    const speed = options.speedKmh || this.defaultSpeedKmh;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromWp = waypoints[i];
      const toWp = waypoints[i + 1];

      const segDist = calculateDistanceKm(fromWp.lat, fromWp.lng, toWp.lat, toWp.lng);
      totalDistanceKm += segDist;

      const segHours = Math.round((segDist / speed) * 10) / 10;

      const hazardZonesHit: string[] = [];
      const restrictedZonesHit: string[] = [];

      // Evaluate geofence intersections along this segment
      geofences.forEach((zone) => {
        if (zone.status !== 'active') return;

        const intersects = doesSegmentIntersectCircle(
          fromWp.lat,
          fromWp.lng,
          toWp.lat,
          toWp.lng,
          zone.center.lat,
          zone.center.lng,
          zone.radiusMeters || 5000
        );

        if (intersects) {
          if (zone.type === 'hazard') {
            hazardZonesHit.push(zone.name);
            hazardIntersectionsCount++;
            warnings.push({
              code: 'HAZARD_INTERSECTION',
              severity: 'CRITICAL',
              message: `Segment ${i + 1} (${fromWp.name} → ${toWp.name}) intersects Crevasse Hazard Zone: ${zone.name}`,
              zoneId: zone.id,
              segmentIndex: i
            });
          } else if (zone.type === 'restricted' || zone.type === 'scientific' || zone.type === 'wildlife') {
            restrictedZonesHit.push(zone.name);
            restrictedIntersectionsCount++;
            warnings.push({
              code: 'RESTRICTED_ZONE',
              severity: 'WARNING',
              message: `Segment ${i + 1} enters ${zone.type.toUpperCase()} Zone: ${zone.name}. Special mission authorization required.`,
              zoneId: zone.id,
              segmentIndex: i
            });
          }
        }
      });

      segments.push({
        index: i,
        fromWaypointId: fromWp.id,
        toWaypointId: toWp.id,
        fromName: fromWp.name,
        toName: toWp.name,
        distanceKm: segDist,
        estimatedTravelHours: segHours,
        terrainType: hazardZonesHit.length > 0 ? 'Crevasse Margin' : segDist > 80 ? 'Deep Snow Firn' : 'Glacial Ice Sheet',
        weatherRiskLevel: weatherAssessment ? weatherAssessment.overallRisk : 'LOW',
        hazardIntersections: hazardZonesHit,
        restrictedIntersections: restrictedZonesHit
      });
    }

    // Weather Risk Warnings
    let weatherPenalty = 0;
    if (weatherAssessment) {
      if (weatherAssessment.overallRisk === 'EXTREME') {
        weatherPenalty = 80;
        warnings.push({
          code: 'SEVERE_WEATHER',
          severity: 'CRITICAL',
          message: `Extreme Meteorological Alert: ${weatherAssessment.advisoryText}`
        });
      } else if (weatherAssessment.overallRisk === 'HIGH') {
        weatherPenalty = 45;
        warnings.push({
          code: 'SEVERE_WEATHER',
          severity: 'WARNING',
          message: `High Weather Risk: Reduced visibility / severe wind chill along traverse corridor.`
        });
      } else if (weatherAssessment.overallRisk === 'MODERATE') {
        weatherPenalty = 20;
      }
    }

    // Solar Risk Warnings
    let solarPenalty = 0;
    if (solarSnapshot && solarSnapshot.kpIndex >= 5) {
      solarPenalty = 25;
      warnings.push({
        code: 'SOLAR_BLACKOUT',
        severity: 'WARNING',
        message: `Geomagnetic Storm Kp=${solarSnapshot.kpIndex}: Potential HF emergency radio blackout during traverse.`
      });
    }

    if (totalDistanceKm > 400) {
      warnings.push({
        code: 'EXTREME_DISTANCE',
        severity: 'WARNING',
        message: `Long-distance traverse (${totalDistanceKm} km). Ensure secondary fuel depot caching and heated survival units.`
      });
    }

    // Cost Breakdown Formula
    const baseDistanceCost = Math.round(totalDistanceKm * 0.5);
    const hazardZonePenalty = hazardIntersectionsCount * 50;
    const restrictedZonePenalty = restrictedIntersectionsCount * 25;
    const terrainDifficultyPenalty = Math.round(totalDistanceKm * 0.15);

    const totalCalculatedRiskCost =
      baseDistanceCost +
      hazardZonePenalty +
      restrictedZonePenalty +
      weatherPenalty +
      solarPenalty +
      terrainDifficultyPenalty;

    return {
      segments,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      estimatedTravelHours: Math.round((totalDistanceKm / speed) * 10) / 10,
      costAnalysis: {
        baseDistanceCost,
        terrainDifficultyPenalty,
        hazardZonePenalty,
        restrictedZonePenalty,
        weatherRiskPenalty: weatherPenalty,
        solarRadioDegradationPenalty: solarPenalty,
        totalCalculatedRiskCost
      },
      warnings
    };
  }
}

export const routeOptimizationService = new RouteOptimizationService();
