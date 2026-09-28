/**
 * POLAR-X Demo AI Inference Provider
 * Fallback provider when on-device neural network weights are uninstalled.
 */

import { ThermalInferenceInput, CrevasseInferenceResult } from './inferenceTypes';

export class DemoInferenceProvider {
  public async runInference(input: ThermalInferenceInput): Promise<CrevasseInferenceResult> {
    // Generate realistic demo inference output based on latitude / longitude
    const simulatedDeltaK = Math.round((Math.random() * 4.5 + 1.2) * 10) / 10;
    const confidence = Math.round((Math.random() * 0.25 + 0.72) * 100) / 100;
    const riskLevel = confidence > 0.85 ? 'HIGH' : confidence > 0.75 ? 'MODERATE' : 'LOW';

    return {
      detectionId: `DET-DEMO-${Date.now()}`,
      imageId: input.imageId,
      latitude: input.latitude,
      longitude: input.longitude,
      timestamp: new Date().toISOString(),
      riskLevel,
      confidence,
      modelId: 'DEMO-HEURISTIC-THERMAL-v1',
      modelVersion: '1.0.0-demo',
      source: 'DEMO_INFERENCE',
      status: 'DETECTED',
      needsHumanReview: confidence < 0.80,
      temperatureDeltaKelvin: simulatedDeltaK,
      estimatedDepthMeters: Math.round(simulatedDeltaK * 4.2),
      crevasseWidthMeters: Math.round(simulatedDeltaK * 1.8),
      reviewNotes: 'Generated via Demo Inference Provider (No physical ONNX model attached)'
    };
  }
}

export const demoInferenceProvider = new DemoInferenceProvider();
