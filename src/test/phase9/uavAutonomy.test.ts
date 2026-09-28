/**
 * POLAR-X Phase 9 — UAV Autonomy & RTL Safety Interlock Tests
 */

import { uavReturnHomeService } from '../../services/uav/uavReturnHomeService';
import { uavLinkMonitor } from '../../services/uav/uavLinkMonitor';
import { UavAutonomyManager } from '../../services/uav/uavAutonomyManager';

export function runUavAutonomyTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  const log = (name: string, ok: boolean, msg?: string) => {
    if (!ok) passed = false;
    results.push(`${ok ? '✓ PASS' : '✗ FAIL'}: ${name}${msg ? ` — ${msg}` : ''}`);
  };

  // Test 1: Home Point Registration & Retrieval
  const home = uavReturnHomeService.getSelectedHomePoint();
  const hasValidHome = Boolean(home && home.isVerified && home.coordinates.lat !== 0);
  log('UAV-01: Verified Home Point Available', hasValidHome, home?.name);

  // Test 2: Low Battery Interlock Blocking RTL Execution
  const lowBatteryEval = uavReturnHomeService.evaluateRtlReadiness(
    { lat: -70.92, lng: 11.85, altitudeMeters: 145 },
    5, // 5% battery
    12
  );
  const isBatteryBlocked = !lowBatteryEval.canExecuteRtl && lowBatteryEval.blockedReasons.includes('BATTERY_INSUFFICIENT');
  log('UAV-02: Insufficient Battery Blocks RTL Safely', isBatteryBlocked);

  // Test 3: Invalid GPS Interlock
  const invalidGpsEval = uavReturnHomeService.evaluateRtlReadiness(
    { lat: 0, lng: 0, altitudeMeters: 0 },
    80,
    2 // 2 sats
  );
  const isGpsBlocked = !invalidGpsEval.canExecuteRtl && invalidGpsEval.blockedReasons.includes('GPS_INVALID');
  log('UAV-03: Degraded GPS Fix Blocks RTL Safely', isGpsBlocked);

  // Test 4: Link-Loss Monitor Threshold Evaluation
  uavLinkMonitor.setSimulatedLinkLost(true);
  const linkReport = uavLinkMonitor.evaluateLink();
  const isLinkLost = linkReport.status === 'LINK_LOST' && linkReport.isStale;
  log('UAV-04: Link-Loss Timeout Correctly Detected', isLinkLost, `Status: ${linkReport.status}`);
  uavLinkMonitor.setSimulatedLinkLost(false);

  // Test 5: RBAC Command Protection (VIEWER role must be rejected)
  const autonomyManager = new UavAutonomyManager();
  autonomyManager
    .executeCommand('REQUEST_RTL', 'Test Observer', 'VIEWER', 'Unauthorized test command')
    .then((res) => {
      const isViewerBlocked = !res.success && res.audit.executionStatus === 'REJECTED_RBAC';
      log('UAV-05: VIEWER Role Forbidden from UAV Flight Commands', isViewerBlocked, res.message);
      autonomyManager.destroy();
    });

  return { passed, results };
}
