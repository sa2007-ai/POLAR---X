/**
 * POLAR-X Phase 9 — 3D Reconstruction & Human Hazard Review Manager
 * Multi-View Scene Pipeline • Human-in-the-Loop Review • Route & Geofence Integration
 */

import { IReconstructionProvider } from './reconstructionProvider';
import { SimulatedReconstructionProvider } from './simulatedReconstructionProvider';
import {
  ReconstructionScene,
  MultiViewImageMetadata,
  CrevasseHazard,
  HazardReviewStatus
} from './reconstructionTypes';
import { UserRole } from '../../types/auth';

export const INITIAL_MULTI_VIEW_FRAMES: MultiViewImageMetadata[] = [
  {
    imageId: 'FRAME-UAV-01-0842',
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    sourceUavId: 'UAV-RECON-ALPHA',
    latitude: -70.92,
    longitude: 11.85,
    altitudeMeters: 145,
    cameraHeadingDeg: 160,
    cameraPitchDeg: -45,
    cameraRollDeg: 0,
    focalLengthMm: 24.0,
    sensorType: 'RADIOMETRIC_THERMAL',
    imageResolution: { width: 640, height: 512 },
    thermalMinKelvin: 248.2,
    thermalMaxKelvin: 254.8
  },
  {
    imageId: 'FRAME-UAV-01-0843',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    sourceUavId: 'UAV-RECON-ALPHA',
    latitude: -70.921,
    longitude: 11.852,
    altitudeMeters: 145,
    cameraHeadingDeg: 162,
    cameraPitchDeg: -45,
    cameraRollDeg: 0,
    focalLengthMm: 24.0,
    sensorType: 'RGB_OPTICAL',
    imageResolution: { width: 3840, height: 2160 }
  },
  {
    imageId: 'FRAME-UAV-01-0844',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    sourceUavId: 'UAV-RECON-ALPHA',
    latitude: -70.923,
    longitude: 11.854,
    altitudeMeters: 140,
    cameraHeadingDeg: 158,
    cameraPitchDeg: -60,
    cameraRollDeg: 0,
    focalLengthMm: 24.0,
    sensorType: 'RADIOMETRIC_THERMAL',
    imageResolution: { width: 640, height: 512 },
    thermalMinKelvin: 247.9,
    thermalMaxKelvin: 254.5
  },
  {
    imageId: 'FRAME-UAV-01-0845',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    sourceUavId: 'UAV-RECON-ALPHA',
    latitude: -70.925,
    longitude: 11.856,
    altitudeMeters: 140,
    cameraHeadingDeg: 165,
    cameraPitchDeg: -90,
    cameraRollDeg: 0,
    focalLengthMm: 24.0,
    sensorType: 'RGB_OPTICAL',
    imageResolution: { width: 3840, height: 2160 }
  }
];

export class ReconstructionManager {
  private activeProvider: IReconstructionProvider;
  private scenes: ReconstructionScene[] = [];
  private activeSceneId: string | null = null;
  private listeners: Set<(scenes: ReconstructionScene[], active: ReconstructionScene | null) => void> = new Set();

  constructor() {
    this.activeProvider = new SimulatedReconstructionProvider();
    this.initializeDefaultScene();
  }

  private async initializeDefaultScene(): Promise<void> {
    const defaultScene = await this.activeProvider.reconstructScene(INITIAL_MULTI_VIEW_FRAMES, {
      sectorName: 'Wohlthat Ridge Traverse Sector Echo'
    });
    this.scenes.push(defaultScene);
    this.activeSceneId = defaultScene.sceneId;
    this.notify();
  }

  public getScenes(): ReconstructionScene[] {
    return [...this.scenes];
  }

  public getActiveScene(): ReconstructionScene | null {
    return this.scenes.find((s) => s.sceneId === this.activeSceneId) || this.scenes[0] || null;
  }

  public setActiveScene(sceneId: string): void {
    if (this.scenes.some((s) => s.sceneId === sceneId)) {
      this.activeSceneId = sceneId;
      this.notify();
    }
  }

  /**
   * Process a new reconstruction run from multi-view telemetry
   */
  public async processReconstruction(
    images: MultiViewImageMetadata[],
    sectorName?: string
  ): Promise<ReconstructionScene> {
    const scene = await this.activeProvider.reconstructScene(images, { sectorName });
    this.scenes = [scene, ...this.scenes];
    this.activeSceneId = scene.sceneId;
    this.notify();
    return scene;
  }

  /**
   * Human Review Workflow with RBAC validation
   */
  public reviewHazard(
    hazardId: string,
    newStatus: HazardReviewStatus,
    reviewer: string,
    reviewerRole: UserRole,
    notes: string = ''
  ): { success: boolean; message: string; hazard?: CrevasseHazard } {
    // RBAC check: VIEWER is strictly forbidden from hazard reviews
    if (reviewerRole === 'VIEWER') {
      return {
        success: false,
        message: 'Security Violation: VIEWER role cannot approve or reject hazard reviews.'
      };
    }

    let targetHazard: CrevasseHazard | undefined;

    for (const scene of this.scenes) {
      const found = scene.detectedHazards.find((h) => h.id === hazardId);
      if (found) {
        found.reviewStatus = newStatus;
        found.reviewedBy = `${reviewer} (${reviewerRole})`;
        found.reviewedAt = new Date().toISOString();
        found.reviewNotes = notes;

        if (newStatus === 'CONFIRMED') {
          found.associatedGeofenceCode = `GEO-CRV-3D-${hazardId.slice(-4)}`;
        }
        targetHazard = found;
        break;
      }
    }

    if (!targetHazard) {
      return { success: false, message: `Hazard ID ${hazardId} not found in active scenes.` };
    }

    this.notify();
    return {
      success: true,
      message: `Hazard ${hazardId} marked as ${newStatus} by ${reviewer}.`,
      hazard: targetHazard
    };
  }

  public getConfirmedHazards(): CrevasseHazard[] {
    const confirmed: CrevasseHazard[] = [];
    for (const s of this.scenes) {
      for (const h of s.detectedHazards) {
        if (h.reviewStatus === 'CONFIRMED') {
          confirmed.push(h);
        }
      }
    }
    return confirmed;
  }

  public subscribe(
    callback: (scenes: ReconstructionScene[], active: ReconstructionScene | null) => void
  ): () => void {
    this.listeners.add(callback);
    callback(this.getScenes(), this.getActiveScene());
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const active = this.getActiveScene();
    const scenes = this.getScenes();
    this.listeners.forEach((cb) => cb(scenes, active));
  }
}

export const reconstructionManager = new ReconstructionManager();
