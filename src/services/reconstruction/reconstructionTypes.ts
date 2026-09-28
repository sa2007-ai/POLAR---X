/**
 * POLAR-X Phase 9 — 3D Terrain & Crevasse Reconstruction Types
 * Multi-View Metadata • Point Clouds • Triangle Meshes • Heightmaps • Human Hazard Review
 */

import { CapabilityState } from '../../components/common/CapabilityStatusBadge';

export type ReconstructionProviderType =
  | 'DEM_TERRAIN'
  | 'PHOTOGRAMMETRY'
  | 'THERMAL_FUSION'
  | 'NERF'
  | 'SIMULATED_RECONSTRUCTION';

export type HazardReviewStatus = 'UNREVIEWED' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED';

export interface MultiViewImageMetadata {
  imageId: string;
  timestamp: string;
  sourceUavId: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  cameraHeadingDeg: number;
  cameraPitchDeg: number;
  cameraRollDeg: number;
  focalLengthMm?: number;
  sensorType: 'RGB_OPTICAL' | 'RADIOMETRIC_THERMAL' | 'MULTISPECTRAL' | 'LIDAR';
  imageResolution: {
    width: number;
    height: number;
  };
  thermalMinKelvin?: number;
  thermalMaxKelvin?: number;
  thumbnailUrl?: string;
}

export interface PointCloudPoint {
  x: number; // local Easting / offset meters
  y: number; // local Northing / offset meters
  z: number; // elevation meters
  r: number; // 0-255 RGB or normalized thermal
  g: number;
  b: number;
  intensity?: number;
  thermalKelvin?: number;
  classification?: 'SURFACE_SNOW' | 'BLUE_ICE' | 'CREVASSE_VOID' | 'SASTRUGI' | 'BEDROCK';
}

export interface PointCloud {
  pointCount: number;
  points: PointCloudPoint[];
  densityPointsPerM2: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface TriangleMesh {
  vertexCount: number;
  triangleCount: number;
  vertices: Float32Array | number[]; // [x0, y0, z0, x1, y1, z1, ...]
  indices: Uint32Array | number[]; // [i0, i1, i2, ...]
  normals?: Float32Array | number[];
  uvs?: Float32Array | number[];
  wireframeIndices?: Uint32Array | number[];
}

export interface HeightMap {
  resolutionX: number;
  resolutionY: number;
  gridSpacingMeters: number;
  elevations: Float32Array | number[];
  thermalDeltas?: Float32Array | number[];
  minElevation: number;
  maxElevation: number;
}

export interface CrevasseHazard {
  id: string;
  sceneId: string;
  name: string;
  centerCoordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  dimensions: {
    estimatedDepthMeters: number;
    widthMeters: number;
    lengthMeters: number;
    orientationDeg: number;
  };
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  confidenceScore: number; // 0.0 to 1.0
  detectionSource: string;
  detectionTimestamp: string;
  reviewStatus: HazardReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  associatedGeofenceCode?: string;
  thermalSignatureDeltaK: number;
  dataState: CapabilityState;
}

export interface ReconstructionScene {
  sceneId: string;
  sectorName: string;
  sourceImages: MultiViewImageMetadata[];
  sourceProvider: ReconstructionProviderType;
  providerDisplayName: string;
  centerCoordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  boundsMeters: {
    widthMeters: number;
    lengthMeters: number;
  };
  resolutionGridMeters: number;
  createdAt: string;
  confidenceScore: number;
  dataState: CapabilityState;
  pointCloud?: PointCloud;
  mesh?: TriangleMesh;
  heightMap?: HeightMap;
  detectedHazards: CrevasseHazard[];
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
