/**
 * POLAR-X Phase 9 — Cross-Module Integration Tests
 */

import { satelliteMessageService } from '../../services/satellite/satelliteMessageService';
import { deviceRegistryService } from '../../services/devices/deviceRegistryService';
import { RouteOptimizationService } from '../../services/routing/routeOptimizationService';
import { GeofenceZone } from '../../types/geofence';

export function runIntegrationTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  const log = (name: string, ok: boolean, msg?: string) => {
    if (!ok) passed = false;
    results.push(`${ok ? '✓ PASS' : '✗ FAIL'}: ${name}${msg ? ` — ${msg}` : ''}`);
  };

  // Test 1: Emergency SOS -> Satellite P0 Priority Dispatch
  satelliteMessageService
    .dispatchEmergencySos({
      incidentId: 'INC-TEST-99',
      type: 'CREVASSE_FALL',
      severity: 'Critical',
      coordinates: { lat: -70.92, lng: 11.85 },
      reportedBy: 'Traverse Team Bravo',
      stationOrAsset: 'MAITRI_BASE'
    })
    .then((msg) => {
      const isP0Sos = msg.priority === 'P0' && msg.topic === 'POLAR_EMERGENCY_SOS';
      log('INTEG-01: Emergency SOS Dispatched to Satellite P0 Queue', isP0Sos, `ID: ${msg.id}`);
    });

  // Test 2: Device Registry Contains Phase 9 Hardware / Virtual Devices
  const devices = deviceRegistryService.getDevices();
  const hasSatelliteModem = devices.some((d) => d.category === 'SATELLITE');
  const hasUavAutopilot = devices.some((d) => d.category === 'UAV' && d.deviceId.includes('AUTOPILOT'));
  const has3dEngine = devices.some((d) => d.deviceId.includes('3D-RECON'));

  log('INTEG-02: Device Registry Tracks Satellite, Autopilot & 3D Engine', hasSatelliteModem && hasUavAutopilot && has3dEngine);

  // Test 3: Confirmed Crevasse Geofence Integrates with Route Optimizer
  const routeService = new RouteOptimizationService();
  const testGeofences: GeofenceZone[] = [
    {
      id: 'geo-confirmed-crv-3d',
      code: 'GEO-CRV-3D-01',
      name: '3D Confirmed Crevasse Hazard',
      type: 'hazard',
      severity: 'Critical',
      stationOrRegion: 'Sector Echo',
      shape: 'circle',
      center: { lat: -70.85, lng: 11.8 },
      radiusMeters: 2000,
      description: 'Confirmed from 3D photogrammetry',
      rules: ['Ground traverse prohibited'],
      status: 'active',
      createdAt: '2026-03-01T00:00:00.000Z'
    }
  ];

  const analysis = routeService.analyzeRoute(
    [
      { id: 'wp-1', name: 'Start', lat: -70.76, lng: 11.74 },
      { id: 'wp-2', name: 'Waypoint Over Hazard', lat: -70.85, lng: 11.8 },
      { id: 'wp-3', name: 'End', lat: -70.95, lng: 11.9 }
    ],
    testGeofences
  );

  const hasHazardWarning = analysis.warnings.some((w) => w.code === 'HAZARD_INTERSECTION');
  const hasHazardPenalty = analysis.costAnalysis.hazardZonePenalty > 0;
  log('INTEG-03: Confirmed Crevasse Geofence Triggers Route Intersection Warning & Penalty', hasHazardWarning && hasHazardPenalty);

  return { passed, results };
}
