/**
 * POLAR-X Edge AI & Crevasse Risk Inference Types
 */

export type EdgeAiFramework = 'ONNX_RUNTIME_WEB' | 'TENSORFLOW_JS' | 'WASM_TFLITE';

export type ModelStatus = 'AVAILABLE' | 'DOWNLOADING' | 'INSTALLED' | 'INVALID' | 'UNAVAILABLE';

export interface EdgeAiModel {
  modelId: string;
  name: string;
  version: string;
  framework: EdgeAiFramework;
  sizeMb: number;
  task: string;
  inputFormat: string;
  outputFormat: string;
  status: ModelStatus;
  downloadProgressPercent?: number;
  installedAt?: string;
  checksumSha256: string;
  description: string;
  precision: 'FP16' | 'INT8' | 'FP32';
}

export type CrevasseRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';

export type AiDetectionReviewStatus = 'DETECTED' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'ARCHIVED';

export interface ThermalInferenceInput {
  imageId: string;
  sourceUrl?: string;
  radiometricMatrix?: number[][];
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  modelId?: string;
  timestamp?: string;
}

export interface CrevasseInferenceResult {
  detectionId: string;
  imageId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  riskLevel: CrevasseRiskLevel;
  confidence: number; // 0.0 - 1.0 (0% - 100%)
  modelId: string;
  modelVersion: string;
  source: 'LIVE_EDGE_AI' | 'DEMO_INFERENCE';
  status: AiDetectionReviewStatus;
  needsHumanReview: boolean;
  temperatureDeltaKelvin?: number;
  estimatedDepthMeters?: number;
  crevasseWidthMeters?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  promotedToGeofenceId?: string;
}
