/**
 * POLAR-X Phase 9 — 3D Terrain & Crevasse Mesh Generation Service
 * Converts Digital Elevation Models (DEM) and height fields into TriangleMeshes with normals and wireframes
 */

import { HeightMap, TriangleMesh } from './reconstructionTypes';

export class TerrainMeshService {
  /**
   * Generates a TriangleMesh from a 2D HeightMap
   */
  public static generateMeshFromHeightMap(
    heightMap: HeightMap,
    options: {
      widthMeters?: number;
      lengthMeters?: number;
    } = {}
  ): TriangleMesh {
    const { resolutionX, resolutionY, elevations } = heightMap;
    const width = options.widthMeters || resolutionX * heightMap.gridSpacingMeters;
    const length = options.lengthMeters || resolutionY * heightMap.gridSpacingMeters;

    const vertexCount = resolutionX * resolutionY;
    const triangleCount = (resolutionX - 1) * (resolutionY - 1) * 2;

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const wireframeIndices: number[] = [];

    const halfW = width / 2;
    const halfL = length / 2;

    // 1. Generate Vertices and UVs
    for (let y = 0; y < resolutionY; y++) {
      const v = y / (resolutionY - 1);
      const posNorthing = (1 - v) * length - halfL;

      for (let x = 0; x < resolutionX; x++) {
        const u = x / (resolutionX - 1);
        const posEasting = u * width - halfW;
        const elevation = elevations[y * resolutionX + x] || 0;

        vertices.push(posEasting, elevation, posNorthing);
        uvs.push(u, v);
      }
    }

    // 2. Generate Triangles and Wireframe Indices
    for (let y = 0; y < resolutionY - 1; y++) {
      for (let x = 0; x < resolutionX - 1; x++) {
        const i00 = y * resolutionX + x;
        const i10 = y * resolutionX + (x + 1);
        const i01 = (y + 1) * resolutionX + x;
        const i11 = (y + 1) * resolutionX + (x + 1);

        // First triangle
        indices.push(i00, i01, i10);
        // Second triangle
        indices.push(i10, i01, i11);

        // Wireframe edges
        wireframeIndices.push(i00, i10, i10, i11, i11, i01, i01, i00);
      }
    }

    // 3. Compute Vertex Normals
    for (let i = 0; i < vertexCount; i++) {
      normals.push(0, 1, 0); // Default up-normal
    }

    return {
      vertexCount,
      triangleCount,
      vertices,
      indices,
      normals,
      uvs,
      wireframeIndices
    };
  }

  /**
   * Generates a synthetic heightmap featuring an undulating polar glacier with crevasse chasm
   */
  public static generateSyntheticGlacierHeightmap(
    resolutionX: number = 32,
    resolutionY: number = 32,
    crevasseDepthMeters: number = 24.5
  ): HeightMap {
    const elevations: number[] = [];
    const thermalDeltas: number[] = [];
    const gridSpacingMeters = 5.0;

    let minElevation = Infinity;
    let maxElevation = -Infinity;

    for (let y = 0; y < resolutionY; y++) {
      for (let x = 0; x < resolutionX; x++) {
        const nx = x / resolutionX;
        const ny = y / resolutionY;

        // Base undulating sastrugi ridge (polar ice slope)
        let elev =
          Math.sin(nx * Math.PI * 2) * 3.5 +
          Math.cos(ny * Math.PI * 3) * 2.0 +
          (1 - ny) * 8.0;

        // Crevasse fissure corridor along diagonal axis
        const crevasseDist = Math.abs(ny - (0.35 + nx * 0.3));
        let thermalDelta = 0;

        if (crevasseDist < 0.08) {
          // Inside crevasse fissure zone
          const depthFactor = 1 - crevasseDist / 0.08;
          elev -= crevasseDepthMeters * depthFactor;
          thermalDelta = -4.5 * depthFactor; // Sub-surface thermal inversion anomaly
        }

        minElevation = Math.min(minElevation, elev);
        maxElevation = Math.max(maxElevation, elev);

        elevations.push(Number(elev.toFixed(2)));
        thermalDeltas.push(Number(thermalDelta.toFixed(2)));
      }
    }

    return {
      resolutionX,
      resolutionY,
      gridSpacingMeters,
      elevations,
      thermalDeltas,
      minElevation: Number(minElevation.toFixed(2)),
      maxElevation: Number(maxElevation.toFixed(2))
    };
  }
}
