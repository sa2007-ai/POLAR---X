/**
 * POLAR-X Phase 9 — 3D Reconstruction Provider Interface
 */

import {
  ReconstructionScene,
  MultiViewImageMetadata,
  ReconstructionProviderType
} from './reconstructionTypes';

export interface IReconstructionProvider {
  readonly providerType: ReconstructionProviderType;
  readonly name: string;
  readonly isHardwareAccelerated: boolean;

  /** Generate 3D point cloud, mesh, and heightmap from multi-view image feeds */
  reconstructScene(
    images: MultiViewImageMetadata[],
    options?: {
      sectorName?: string;
      gridResolutionMeters?: number;
      includeThermalFusion?: boolean;
    }
  ): Promise<ReconstructionScene>;

  /** Estimate crevasse depth and hazard bounding boxes */
  detectHazards(scene: ReconstructionScene): Promise<ReconstructionScene>;
}
