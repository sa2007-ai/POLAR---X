/**
 * POLAR-X Edge AI Service
 * Unifies model management, inference pipeline, human review workflow, and route hazard integration.
 */

import { modelManager } from './modelManager';
import { inferenceService } from './inferenceService';
import { CrevasseInferenceResult, ThermalInferenceInput } from './inferenceTypes';

export class EdgeAiService {
  public getModels() {
    return modelManager.getModels();
  }

  public getActiveModel() {
    return modelManager.getActiveModel();
  }

  public async installModel(modelId: string) {
    return modelManager.installModel(modelId);
  }

  public removeModel(modelId: string) {
    return modelManager.removeModel(modelId);
  }

  public async scanThermalImage(input: ThermalInferenceInput): Promise<CrevasseInferenceResult> {
    return inferenceService.runThermalInference(input);
  }

  public getDetections(): CrevasseInferenceResult[] {
    return inferenceService.getHistory();
  }

  public subscribeDetections(cb: (detections: CrevasseInferenceResult[]) => void) {
    return inferenceService.subscribe(cb);
  }

  public subscribeModels(cb: (models: any[]) => void) {
    return modelManager.subscribe(cb);
  }

  public reviewDetection(
    detectionId: string,
    decision: 'CONFIRMED' | 'REJECTED' | 'UNDER_REVIEW',
    notes: string,
    reviewer: string,
    geofenceId?: string
  ): boolean {
    return inferenceService.updateDetectionStatus(detectionId, decision, notes, reviewer, geofenceId);
  }

  /**
   * Evaluates whether confirmed high-risk crevasse detections intersect a route corridor
   */
  public evaluateRouteIntersection(
    waypoints: Array<{ latitude: number; longitude: number }>,
    corridorWidthKm: number = 2.0
  ): CrevasseInferenceResult[] {
    const confirmedHighRisk = inferenceService
      .getHistory()
      .filter((d) => d.status === 'CONFIRMED' && (d.riskLevel === 'HIGH' || d.riskLevel === 'MODERATE'));

    const intersecting: CrevasseInferenceResult[] = [];

    for (const det of confirmedHighRisk) {
      for (const wp of waypoints) {
        const distanceKm = this.getHaversineDistanceKm(det.latitude, det.longitude, wp.latitude, wp.longitude);
        if (distanceKm <= corridorWidthKm) {
          intersecting.push(det);
          break;
        }
      }
    }

    return intersecting;
  }

  private getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const edgeAiService = new EdgeAiService();
