export type GeofenceZoneType = 'hazard' | 'restricted' | 'wildlife' | 'scientific';

export type GeofenceShape = 'polygon' | 'circle';

export type GeofenceStatus = 'active' | 'inactive' | 'breached';

export interface GeofenceBreach {
  id: string;
  geofenceId: string;
  geofenceName: string;
  zoneType: GeofenceZoneType;
  entityId: string;
  entityName: string;
  entityType: 'expedition' | 'asset' | 'personnel';
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  severity: 'Critical' | 'Warning' | 'Advisory';
  resolved: boolean;
}

export interface GeofenceZone {
  id: string;
  code: string;
  name: string;
  type: GeofenceZoneType;
  severity: 'Critical' | 'Warning' | 'Advisory';
  stationOrRegion: string;
  shape: GeofenceShape;
  center: {
    lat: number;
    lng: number;
  };
  radiusMeters?: number;
  polygonPoints?: {
    lat: number;
    lng: number;
  }[];
  description: string;
  rules: string[];
  status: GeofenceStatus;
  activeBreaches?: GeofenceBreach[];
  createdAt: string;
  updatedAt?: string;
}
