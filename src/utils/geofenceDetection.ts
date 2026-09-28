import { GeofenceZone, GeofenceBreach } from '../types/geofence';

/**
 * Calculates the great-circle distance between two points on the Earth (in meters)
 * using the Haversine formula.
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 */
export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean => {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Evaluates whether a coordinate point falls inside a geofence zone.
 */
export const isPointInGeofence = (
  point: { lat: number; lng: number },
  geofence: GeofenceZone
): boolean => {
  if (geofence.status === 'inactive') return false;

  if (geofence.shape === 'circle' && geofence.radiusMeters) {
    const distance = calculateDistanceMeters(
      point.lat,
      point.lng,
      geofence.center.lat,
      geofence.center.lng
    );
    return distance <= geofence.radiusMeters;
  }

  if (geofence.shape === 'polygon' && geofence.polygonPoints) {
    return isPointInPolygon(point, geofence.polygonPoints);
  }

  return false;
};

export interface TrackableEntity {
  id: string;
  name: string;
  type: 'expedition' | 'asset' | 'personnel';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Checks all active entities against geofences and returns all active breaches.
 */
export const evaluateAllGeofenceBreaches = (
  entities: TrackableEntity[],
  geofences: GeofenceZone[]
): GeofenceBreach[] => {
  const breaches: GeofenceBreach[] = [];

  for (const entity of entities) {
    if (!entity.coordinates || isNaN(entity.coordinates.lat) || isNaN(entity.coordinates.lng)) {
      continue;
    }

    for (const geofence of geofences) {
      if (geofence.status === 'inactive') continue;

      const inside = isPointInGeofence(entity.coordinates, geofence);
      if (inside) {
        breaches.push({
          id: `breach-${entity.id}-${geofence.id}-${Date.now()}`,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          zoneType: geofence.type,
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.type,
          timestamp: new Date().toISOString(),
          coordinates: entity.coordinates,
          severity: geofence.severity,
          resolved: false
        });
      }
    }
  }

  return breaches;
};
