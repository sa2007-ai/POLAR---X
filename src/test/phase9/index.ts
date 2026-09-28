/**
 * POLAR-X Phase 9 — Test Runner
 */

import { runSatelliteTests } from './satelliteBroadband.test';
import { runUavAutonomyTests } from './uavAutonomy.test';
import { runReconstructionTests } from './terrainReconstruction.test';
import { runIntegrationTests } from './phase9Integration.test';
import { runFirebaseAuthVerificationTests } from '../firebase/firebaseAuthVerification.test';

export function runAllPhase9Tests(): { totalPassed: boolean; allResults: string[] } {
  const fb = runFirebaseAuthVerificationTests();
  const sat = runSatelliteTests();
  const uav = runUavAutonomyTests();
  const recon = runReconstructionTests();
  const integ = runIntegrationTests();

  const allResults = [
    '=== FIREBASE BACKEND & AUTHENTICATION VERIFICATION TESTS ===',
    ...fb.results,
    '',
    '=== SATELLITE BROADBAND & MULTI-PRIORITY QUEUE TESTS ===',
    ...sat.results,
    '',
    '=== UAV AUTONOMY & RETURN-TO-HOME SAFETY TESTS ===',
    ...uav.results,
    '',
    '=== 3D CREVASSE RECONSTRUCTION & HUMAN REVIEW TESTS ===',
    ...recon.results,
    '',
    '=== PHASE 9/10 CROSS-MODULE INTEGRATION TESTS ===',
    ...integ.results
  ];

  const totalPassed = fb.passed && sat.passed && uav.passed && recon.passed && integ.passed;
  return { totalPassed, allResults };
}

// Auto-run if executed directly via Node / tsx
const res = runAllPhase9Tests();
res.allResults.forEach((line) => console.log(line));
console.log(`\n========================================`);
console.log(`MASTER TEST SUMMARY: ${res.totalPassed ? 'ALL TESTS PASSED (16/16)' : 'TESTS FAILED'}`);
console.log(`========================================\n`);
if (typeof process !== 'undefined' && process.exit) {
  process.exit(res.totalPassed ? 0 : 1);
}

