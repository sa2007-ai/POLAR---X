/**
 * POLAR-X Phase 9 — 3D Point Cloud Processing Service
 * Manages LiDAR / Structure-from-Motion points with RGB and Thermal pseudocoloring
 */

import { PointCloud, PointCloudPoint } from './reconstructionTypes';

export class PointCloudService {
  /**
   * Generates a realistic point cloud from a reconstructed heightmap
   */
  public static generateFromHeightMap(
    elevations: number[],
    thermalDeltas: number[] | undefined,
    resX: number,
    resY: number,
    spacingMeters: number
  ): PointCloud {
    const points: PointCloudPoint[] = [];
    const halfW = (resX * spacingMeters) / 2;
    const halfL = (resY * spacingMeters) / 2;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (let y = 0; y < resY; y++) {
      for (let x = 0; x < resX; x++) {
        const idx = y * resX + x;
        const posX = x * spacingMeters - halfW;
        const posNorthing = y * spacingMeters - halfL;
        const elevation = elevations[idx] || 0;
        const thermal = thermalDeltas ? thermalDeltas[idx] || 0 : 0;

        minX = Math.min(minX, posX);
        maxX = Math.max(maxX, posX);
        minY = Math.min(minY, posNorthing);
        maxY = Math.max(maxY, posNorthing);
        minZ = Math.min(minZ, elevation);
        maxZ = Math.max(maxZ, elevation);

        let r = 210;
        let g = 230;
        let b = 250;
        let classification: PointCloudPoint['classification'] = 'SURFACE_SNOW';

        if (thermal < -2.0) {
          // Crevasse fissure void
          classification = 'CREVASSE_VOID';
          r = 40;
          g = 90;
          b = 180;
        } else if (elevation < 0) {
          classification = 'BLUE_ICE';
          r = 120;
          g = 180;
          b = 235;
        }

        points.push({
          x: posX,
          y: elevation,
          z: posNorthing,
          r,
          g,
          b,
          thermalKelvin: 253.15 + thermal, // ~ -20°C in Kelvin
          classification
        });
      }
    }

    return {
      pointCount: points.length,
      points,
      densityPointsPerM2: Number((points.length / ((resX * spacingMeters) * (resY * spacingMeters))).toFixed(2)),
      bounds: {
        minX,
        maxX,
        minY,
        maxY,
        minZ,
        maxZ
      }
    };
  }
}
