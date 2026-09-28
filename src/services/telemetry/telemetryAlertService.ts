/**
 * POLAR-X Telemetry Alert & Route Deviation Engine
 */

import { TelemetryRecord } from '../../types/telemetry';
import { TraverseRoute } from '../../types/route';
import { calculateDistanceKm } from '../routing/routeOptimizationService';

export interface RouteDeviationCheck {
  status: 'ON_ROUTE' | 'NEAR_EDGE' | 'OFF_ROUTE' | 'UNKNOWN';
  distanceFromCorridorMeters: number;
  nearestSegmentIndex?: number;
  message: string;
}

export const evaluateRouteDeviation = (
  record: TelemetryRecord,
  route?: TraverseRoute,
  corridorToleranceMeters: number = 1000 // 1 km corridor threshold
): RouteDeviationCheck => {
  if (!route || !route.waypoints || route.waypoints.length < 2) {
    return {
      status: 'UNKNOWN',
      distanceFromCorridorMeters: 0,
      message: 'No active approved traverse corridor assigned.'
    };
  }

  const { latitude: pLat, longitude: pLng } = record.coordinates;
  let minDistanceMeters = Infinity;
  let nearestSegmentIndex = 0;

  // Compute minimum distance to any waypoint segment
  for (let i = 0; i < route.waypoints.length - 1; i++) {
    const wp1 = route.waypoints[i];
    const wp2 = route.waypoints[i + 1];

    // Sample distance across segment
    const sampleSteps = 5;
    for (let s = 0; s <= sampleSteps; s++) {
      const frac = s / sampleSteps;
      const sLat = wp1.lat + (wp2.lat - wp1.lat) * frac;
      const sLng = wp1.lng + (wp2.lng - wp1.lng) * frac;
      const distKm = calculateDistanceKm(pLat, pLng, sLat, sLng);
      const distM = distKm * 1000;

      if (distM < minDistanceMeters) {
        minDistanceMeters = distM;
        nearestSegmentIndex = i;
      }
    }
  }

  const roundedDistance = Math.round(minDistanceMeters);

  if (minDistanceMeters <= corridorToleranceMeters) {
    return {
      status: 'ON_ROUTE',
      distanceFromCorridorMeters: roundedDistance,
      nearestSegmentIndex,
      message: `Within approved traverse corridor (${roundedDistance}m from centerline).`
    };
  }

  if (minDistanceMeters <= corridorToleranceMeters * 2) {
    return {
      status: 'NEAR_EDGE',
      distanceFromCorridorMeters: roundedDistance,
      nearestSegmentIndex,
      message: `Approaching corridor safety margin: ${roundedDistance}m from centerline.`
    };
  }

  return {
    status: 'OFF_ROUTE',
    distanceFromCorridorMeters: roundedDistance,
    nearestSegmentIndex,
    message: `Corridor deviation detected: ${roundedDistance}m off planned route.`
  };
};
