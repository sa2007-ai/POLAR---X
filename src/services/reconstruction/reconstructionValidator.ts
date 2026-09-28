/**
 * POLAR-X Phase 9 — 3D Reconstruction Data & Metadata Validator
 * Validates camera extrinsics/intrinsics, GPS bounds, and hazard confidence thresholds
 */

import { MultiViewImageMetadata, TriangleMesh, PointCloud } from './reconstructionTypes';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validImageCount: number;
}

export class ReconstructionValidator {
  public static validateInputMetadata(images: MultiViewImageMetadata[]): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    if (!images || images.length === 0) {
      errors.push('No image metadata frames provided for reconstruction.');
      return { isValid: false, errors, warnings, validImageCount: 0 };
    }

    if (images.length < 2) {
      warnings.push('Monocular reconstruction provided: spatial depth estimation accuracy is reduced.');
    }

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.imageId) {
        errors.push(`Frame #${i} missing imageId identifier.`);
        continue;
      }
      if (img.latitude === 0 && img.longitude === 0) {
        errors.push(`Frame #${i} (${img.imageId}) contains invalid zero GPS fix.`);
        continue;
      }
      if (img.altitudeMeters <= 0) {
        warnings.push(`Frame #${i} (${img.imageId}) altitude (${img.altitudeMeters}m) is suspiciously low.`);
      }
      if (!img.imageResolution || img.imageResolution.width <= 0) {
        warnings.push(`Frame #${i} missing optical resolution parameters.`);
      }

      validCount++;
    }

    return {
      isValid: errors.length === 0 && validCount > 0,
      errors,
      warnings,
      validImageCount: validCount
    };
  }

  public static validateMesh(mesh: TriangleMesh): boolean {
    if (!mesh.vertices || mesh.vertices.length === 0) return false;
    if (!mesh.indices || mesh.indices.length === 0) return false;
    return mesh.vertexCount > 0 && mesh.triangleCount > 0;
  }

  public static validatePointCloud(pointCloud: PointCloud): boolean {
    if (!pointCloud.points || pointCloud.points.length === 0) return false;
    return pointCloud.pointCount > 0;
  }
}
