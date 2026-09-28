/**
 * POLAR-X Realistic Mock Traverse Routes
 */

import { TraverseRoute } from '../types/route';

export const mockRoutes: TraverseRoute[] = [
  {
    id: 'trv-1',
    code: 'TRV-2026-001',
    title: 'Maitri to Wohlthat Mountains Ice Core Traverse',
    expeditionCode: 'EXP-2026-088',
    originStation: 'Maitri Station',
    destinationStation: 'Wohlthat Nunatak Alpha',
    transportMethod: 'PistonBully PB100',
    waypoints: [
      { id: 'wp-1', name: 'Maitri Base Camp', lat: -70.7667, lng: 11.7333, elevationMeters: 130 },
      { id: 'wp-2', name: 'Schirmacher Oasis Outpost', lat: -70.75, lng: 11.6, elevationMeters: 180 },
      { id: 'wp-3', name: 'Wohlthat Ridge Point 1', lat: -71.2, lng: 12.1, elevationMeters: 850 },
      { id: 'wp-4', name: 'Wohlthat Ice Core Camp', lat: -71.55, lng: 12.45, elevationMeters: 1420 }
    ],
    segments: [
      {
        index: 0,
        fromWaypointId: 'wp-1',
        toWaypointId: 'wp-2',
        fromName: 'Maitri Base Camp',
        toName: 'Schirmacher Oasis Outpost',
        distanceKm: 5.2,
        estimatedTravelHours: 0.3,
        terrainType: 'Glacial Ice Sheet',
        weatherRiskLevel: 'LOW',
        hazardIntersections: [],
        restrictedIntersections: []
      },
      {
        index: 1,
        fromWaypointId: 'wp-2',
        toWaypointId: 'wp-3',
        fromName: 'Schirmacher Oasis Outpost',
        toName: 'Wohlthat Ridge Point 1',
        distanceKm: 53.4,
        estimatedTravelHours: 3.0,
        terrainType: 'Blue Ice',
        weatherRiskLevel: 'MODERATE',
        hazardIntersections: [],
        restrictedIntersections: []
      },
      {
        index: 2,
        fromWaypointId: 'wp-3',
        toWaypointId: 'wp-4',
        fromName: 'Wohlthat Ridge Point 1',
        toName: 'Wohlthat Ice Core Camp',
        distanceKm: 41.1,
        estimatedTravelHours: 2.3,
        terrainType: 'Deep Snow Firn',
        weatherRiskLevel: 'MODERATE',
        hazardIntersections: [],
        restrictedIntersections: []
      }
    ],
    totalDistanceKm: 99.7,
    estimatedTravelHours: 5.6,
    costAnalysis: {
      baseDistanceCost: 50,
      terrainDifficultyPenalty: 15,
      hazardZonePenalty: 0,
      restrictedZonePenalty: 0,
      weatherRiskPenalty: 20,
      solarRadioDegradationPenalty: 0,
      totalCalculatedRiskCost: 85
    },
    warnings: [],
    status: 'APPROVED',
    version: 1,
    createdAt: '2026-09-20T08:00:00Z',
    createdBy: 'Capt. Marcus Vance',
    createdByRole: 'EXPEDITION_MANAGER',
    updatedAt: '2026-09-22T14:30:00Z',
    updatedBy: 'Dr. Sarah Jenkins',
    approvedBy: 'Admin Commander',
    approvedAt: '2026-09-22T14:30:00Z',
    notes: 'Standard annual logistics resupply corridor along marked stakes.'
  },
  {
    id: 'trv-2',
    code: 'TRV-2026-002',
    title: 'Bharati Coastal Crevasse Hazard Bypass Route',
    expeditionCode: 'EXP-2026-091',
    originStation: 'Bharati Station',
    destinationStation: 'Grovenes Coastal Depot',
    transportMethod: 'Snowcat Convoy',
    waypoints: [
      { id: 'wp-201', name: 'Bharati Main Pad', lat: -69.4072, lng: 76.1953, elevationMeters: 45 },
      { id: 'wp-202', name: 'Larsemann Hills Waypoint 1', lat: -69.42, lng: 76.25, elevationMeters: 85 },
      { id: 'wp-203', name: 'Crevasse Field Margin Bypass', lat: -69.45, lng: 76.32, elevationMeters: 110 },
      { id: 'wp-204', name: 'Grovenes Coastal Depot', lat: -69.48, lng: 76.4, elevationMeters: 60 }
    ],
    segments: [
      {
        index: 0,
        fromWaypointId: 'wp-201',
        toWaypointId: 'wp-202',
        fromName: 'Bharati Main Pad',
        toName: 'Larsemann Hills Waypoint 1',
        distanceKm: 2.5,
        estimatedTravelHours: 0.2,
        terrainType: 'Glacial Ice Sheet',
        weatherRiskLevel: 'LOW',
        hazardIntersections: [],
        restrictedIntersections: []
      },
      {
        index: 1,
        fromWaypointId: 'wp-202',
        toWaypointId: 'wp-203',
        fromName: 'Larsemann Hills Waypoint 1',
        toName: 'Crevasse Field Margin Bypass',
        distanceKm: 4.3,
        estimatedTravelHours: 0.4,
        terrainType: 'Crevasse Margin',
        weatherRiskLevel: 'HIGH',
        hazardIntersections: ['Bharati Coastal Crevasse Field'],
        restrictedIntersections: []
      },
      {
        index: 2,
        fromWaypointId: 'wp-203',
        toWaypointId: 'wp-204',
        fromName: 'Crevasse Field Margin Bypass',
        toName: 'Grovenes Coastal Depot',
        distanceKm: 4.6,
        estimatedTravelHours: 0.3,
        terrainType: 'Coastal Shelf',
        weatherRiskLevel: 'MODERATE',
        hazardIntersections: [],
        restrictedIntersections: []
      }
    ],
    totalDistanceKm: 11.4,
    estimatedTravelHours: 0.9,
    costAnalysis: {
      baseDistanceCost: 6,
      terrainDifficultyPenalty: 2,
      hazardZonePenalty: 50,
      restrictedZonePenalty: 0,
      weatherRiskPenalty: 45,
      solarRadioDegradationPenalty: 0,
      totalCalculatedRiskCost: 103
    },
    warnings: [
      {
        code: 'HAZARD_INTERSECTION',
        severity: 'CRITICAL',
        message: 'Segment 2 enters Bharati Coastal Crevasse Field. Ground penetrating radar escort mandated.'
      }
    ],
    status: 'PROPOSED',
    version: 1,
    createdAt: '2026-09-25T11:00:00Z',
    createdBy: 'Dr. Vikram Anand',
    createdByRole: 'SCIENTIST',
    updatedAt: '2026-09-25T11:00:00Z',
    updatedBy: 'Dr. Vikram Anand',
    proposedBy: 'Dr. Vikram Anand',
    proposedAt: '2026-09-25T11:00:00Z',
    notes: 'Proposed bypass around newly opened tidal crevasses.'
  }
];
