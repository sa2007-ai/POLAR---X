/**
 * POLAR-X Traverse Route & Optimization Types
 */

export type RouteStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export type RouteWarningSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface RouteWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  elevationMeters?: number;
  estimatedArrivalHours?: number;
  notes?: string;
  isCustom?: boolean;
}

export interface RouteSegment {
  index: number;
  fromWaypointId: string;
  toWaypointId: string;
  fromName: string;
  toName: string;
  distanceKm: number;
  estimatedTravelHours: number;
  terrainType: 'Glacial Ice Sheet' | 'Blue Ice' | 'Deep Snow Firn' | 'Crevasse Margin' | 'Coastal Shelf';
  weatherRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  hazardIntersections: string[]; // List of geofence names intersected
  restrictedIntersections: string[];
}

export interface RouteCostBreakdown {
  baseDistanceCost: number; // proportional to km
  terrainDifficultyPenalty: number;
  hazardZonePenalty: number;
  restrictedZonePenalty: number;
  weatherRiskPenalty: number;
  solarRadioDegradationPenalty: number;
  totalCalculatedRiskCost: number; // Aggregate operational score
}

export interface RouteWarning {
  code: 'HAZARD_INTERSECTION' | 'RESTRICTED_ZONE' | 'SEVERE_WEATHER' | 'WHITE_OUT_RISK' | 'SOLAR_BLACKOUT' | 'EXTREME_DISTANCE' | 'MISSING_TELEMETRY';
  severity: RouteWarningSeverity;
  message: string;
  zoneId?: string;
  segmentIndex?: number;
}

export interface TraverseRoute {
  id: string;
  code: string; // e.g. TRV-2026-084
  title: string;
  expeditionId?: string;
  expeditionCode?: string;
  originStation: string;
  destinationStation: string;
  transportMethod: 'PistonBully PB100' | 'Snowcat Convoy' | 'Ski-Doo Recon' | 'Twin Otter Airdrop Support' | 'Heavy Sledge Traverse';
  waypoints: RouteWaypoint[];
  segments: RouteSegment[];
  totalDistanceKm: number;
  estimatedTravelHours: number;
  costAnalysis: RouteCostBreakdown;
  warnings: RouteWarning[];
  status: RouteStatus;
  
  // Concurrency & Metadata
  version: number;
  createdAt: string;
  createdBy: string;
  createdByRole?: string;
  updatedAt: string;
  updatedBy: string;

  // Workflow tracking
  proposedBy?: string;
  proposedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}
