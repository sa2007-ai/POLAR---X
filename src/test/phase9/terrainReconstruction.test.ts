/**
 * POLAR-X Phase 9 — 3D Crevasse Reconstruction & Human Review Tests
 */

import { TerrainMeshService } from '../../services/reconstruction/terrainMeshService';
import { PointCloudService } from '../../services/reconstruction/pointCloudService';
import { ReconstructionValidator } from '../../services/reconstruction/reconstructionValidator';
import { ReconstructionManager, INITIAL_MULTI_VIEW_FRAMES } from '../../services/reconstruction/reconstructionManager';

export function runReconstructionTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  const log = (name: string, ok: boolean, msg?: string) => {
    if (!ok) passed = false;
    results.push(`${ok ? '✓ PASS' : '✗ FAIL'}: ${name}${msg ? ` — ${msg}` : ''}`);
  };

  // Test 1: Input Multi-View Metadata Validation
  const valReport = ReconstructionValidator.validateInputMetadata(INITIAL_MULTI_VIEW_FRAMES);
  log('RECON-01: Multi-View Image Metadata Validation', valReport.isValid, `Valid Frames: ${valReport.validImageCount}`);

  // Test 2: Heightmap & 3D TriangleMesh Generation
  const heightmap = TerrainMeshService.generateSyntheticGlacierHeightmap(16, 16, 20.0);
  const mesh = TerrainMeshService.generateMeshFromHeightMap(heightmap);
  const isMeshValid = ReconstructionValidator.validateMesh(mesh);
  log('RECON-02: 3D Surface TriangleMesh Generation', isMeshValid, `Vertices: ${mesh.vertexCount}, Triangles: ${mesh.triangleCount}`);

  // Test 3: Point Cloud Generation
  const ptCloud = PointCloudService.generateFromHeightMap(
    heightmap.elevations as number[],
    heightmap.thermalDeltas as number[],
    16,
    16,
    heightmap.gridSpacingMeters
  );
  const isPtValid = ReconstructionValidator.validatePointCloud(ptCloud);
  log('RECON-03: 3D Dense LiDAR / SfM Point Cloud Generation', isPtValid, `Points: ${ptCloud.pointCount}`);

  // Test 4: Human Review Workflow & RBAC
  const reconMgr = new ReconstructionManager();
  const activeScene = reconMgr.getActiveScene();
  const firstHazard = activeScene?.detectedHazards[0];

  if (firstHazard) {
    // 4a. VIEWER cannot review
    const viewerReview = reconMgr.reviewHazard(firstHazard.id, 'CONFIRMED', 'Guest Observer', 'VIEWER');
    log('RECON-04: VIEWER Role Prohibited from Hazard Confirmations', !viewerReview.success);

    // 4b. SCIENTIST can confirm
    const scientistReview = reconMgr.reviewHazard(firstHazard.id, 'CONFIRMED', 'Dr. Anand', 'SCIENTIST', 'Verified deep fissure');
    log('RECON-05: SCIENTIST Role Promotes Confirmed Hazard', scientistReview.success && firstHazard.reviewStatus === 'CONFIRMED');
  }

  return { passed, results };
}
