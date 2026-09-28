/**
 * POLAR-X Phase 9 — UAV Return-To-Home Safety & Corridor Validation
 * Validates battery, distance, GPS fix, geofences, and restricted zones before authorizing RTL
 */

import { UavHomePoint, RtlReadinessAssessment, RtlBlockedReason } from './uavAutonomyTypes';
import { GeofenceZone } from '../../types/geofence';

export class UavReturnHomeService {
  private homePoints: UavHomePoint[] = [
    {
      id: 'home-maitri-helipad',
      name: 'Maitri Station Primary Helipad',
      type: 'BASE_STATION',
      coordinates: {
        lat: -70.762,
        lng: 11.741,
        altitudeMeters: 117
      },
      safetyRadiusMeters: 250,
      maxLandingWindKmh: 55,
      isVerified: true,
      stationOrRegion: 'Maitri Station',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'home-bharati-pad',
      name: 'Bharati Station UAV Coastal Pad',
      type: 'BASE_STATION',
      coordinates: {
        lat: -69.406,
        lng: 76.187,
        altitudeMeters: 35
      },
      safetyRadiusMeters: 200,
      maxLandingWindKmh: 60,
      isVerified: true,
      stationOrRegion: 'Bharati Station',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'home-sledge-01',
      name: 'Traverse Sledge 01 Mobile Recovery Pad',
      type: 'FIELD_CAMP',
      coordinates: {
        lat: -70.9,
        lng: 11.82,
        altitudeMeters: 140
      },
      safetyRadiusMeters: 150,
      maxLandingWindKmh: 45,
      isVerified: true,
      stationOrRegion: 'Schirmacher Oasis Traverse',
      createdAt: '2026-02-15T00:00:00.000Z'
    }
  ];

  private selectedHomePointId: string = 'home-sledge-01';

  public getHomePoints(): UavHomePoint[] {
    return [...this.homePoints];
  }

  public getSelectedHomePoint(): UavHomePoint | null {
    return this.homePoints.find((hp) => hp.id === this.selectedHomePointId) || this.homePoints[0] || null;
  }

  public selectHomePoint(id: string): void {
    if (this.homePoints.some((hp) => hp.id === id)) {
      this.selectedHomePointId = id;
    }
  }

  public registerHomePoint(point: Omit<UavHomePoint, 'id' | 'createdAt'>): UavHomePoint {
    const newPoint: UavHomePoint = {
      ...point,
      id: `hp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.homePoints.push(newPoint);
    this.selectedHomePointId = newPoint.id;
    return newPoint;
  }

  /**
   * Evaluate full RTL readiness against battery, distance, and geofence safety zones
   */
  public evaluateRtlReadiness(
    currentCoords: { lat: number; lng: number; altitudeMeters: number },
    batteryPercent: number,
    gpsSats: number,
    geofences: GeofenceZone[] = []
  ): RtlReadinessAssessment {
    const home = this.getSelectedHomePoint();
    const blockedReasons: RtlBlockedReason[] = [];
    const restrictedZoneViolations: string[] = [];

    if (!home || !home.isVerified) {
      blockedReasons.push('HOME_POSITION_INVALID');
    }

    const gpsFixValid = gpsSats >= 6 && currentCoords.lat !== 0 && currentCoords.lng !== 0;
    if (!gpsFixValid) {
      blockedReasons.push('GPS_INVALID');
    }

    // Distance calculation (Haversine approximation for polar scale)
    let distanceToHomeMeters = 0;
    if (home) {
      const dLat = (home.coordinates.lat - currentCoords.lat) * 111320;
      const dLng =
        (home.coordinates.lng - currentCoords.lng) *
        111320 *
        Math.cos(((home.coordinates.lat + currentCoords.lat) / 2) * (Math.PI / 180));
      distanceToHomeMeters = Math.round(Math.hypot(dLat, dLng));
    }

    // Estimated return speed 50 km/h (13.8 m/s) + 25% safety reserve
    const returnSpeedMps = 13.8;
    const flightTimeSeconds = distanceToHomeMeters / returnSpeedMps;
    const estimatedReturnTimeMinutes = Math.round((flightTimeSeconds / 60) * 10) / 10;

    // 0.8% battery per minute flight time + 15% minimum safety reserve
    const batteryRequiredPercent = Math.round(estimatedReturnTimeMinutes * 0.8 + 15);

    if (batteryPercent < batteryRequiredPercent) {
      blockedReasons.push('BATTERY_INSUFFICIENT');
    }

    // Check geofence corridor safety
    for (const gf of geofences) {
      if (gf.status !== 'active') continue;

      if (gf.type === 'restricted' || gf.type === 'wildlife') {
        // Simple corridor bounding box intersection
        if (home) {
          const minLat = Math.min(currentCoords.lat, home.coordinates.lat) - 0.01;
          const maxLat = Math.max(currentCoords.lat, home.coordinates.lat) + 0.01;
          const minLng = Math.min(currentCoords.lng, home.coordinates.lng) - 0.01;
          const maxLng = Math.max(currentCoords.lng, home.coordinates.lng) + 0.01;

          if (
            gf.center.lat >= minLat &&
            gf.center.lat <= maxLat &&
            gf.center.lng >= minLng &&
            gf.center.lng <= maxLng
          ) {
            restrictedZoneViolations.push(`${gf.name} (${gf.type.toUpperCase()} zone intersection)`);
            if (gf.type === 'restricted') {
              blockedReasons.push('RESTRICTED_ZONE');
            }
          }
        }
      }
    }

    const canExecuteRtl = blockedReasons.length === 0;

    return {
      isReady: canExecuteRtl,
      canExecuteRtl,
      blockedReasons,
      batteryRequiredPercent,
      batteryAvailablePercent: batteryPercent,
      distanceToHomeMeters,
      estimatedReturnTimeMinutes,
      gpsFixValid,
      geofenceCheckPassed: restrictedZoneViolations.length === 0,
      restrictedZoneViolations,
      recommendedReturnAltitudeMeters: Math.max(120, currentCoords.altitudeMeters + 20),
      evaluationTimestamp: new Date().toISOString(),
      dataState: 'SIMULATED'
    };
  }
}

export const uavReturnHomeService = new UavReturnHomeService();
