/**
 * POLAR-X Edge AI Model Manager
 * Manages on-device neural network weights for thermal crevasse segmentation.
 */

import { EdgeAiModel } from './inferenceTypes';

export const INITIAL_AI_MODELS: EdgeAiModel[] = [
  {
    modelId: 'MODEL-CREVASSE-ONNX-YOLO8N',
    name: 'PolarCrevasse-YOLOv8n-Thermal',
    version: '2.4.1',
    framework: 'ONNX_RUNTIME_WEB',
    sizeMb: 14.8,
    task: 'Radiometric Thermal Crevasse & Void Boundary Segmentation',
    inputFormat: 'Tensor [1, 1, 640, 640] (Kelvin Float32)',
    outputFormat: 'Bounding Boxes + Segmentation Masks + Confidence',
    status: 'INSTALLED',
    installedAt: '2026-09-20T08:30:00Z',
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Lightweight quantized convolutional segmentation model optimized for WebAssembly SIMD and WebGPU execution in field laptops.',
    precision: 'INT8'
  },
  {
    modelId: 'MODEL-RADARSAT-SAR-V3',
    name: 'Antarctic-SAR-GlacierVoid-v3',
    version: '3.1.0',
    framework: 'ONNX_RUNTIME_WEB',
    sizeMb: 42.6,
    task: 'Deep Radar & Multispectral Snow Bridge Collapse Classifier',
    inputFormat: 'Tensor [1, 4, 512, 512] (Multichannel SAR)',
    outputFormat: 'Risk Heatmap Tensor [1, 1, 512, 512]',
    status: 'AVAILABLE',
    checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    description: 'High-precision deep residual neural network trained on SCAR radar & optical satellite telemetry for large-scale glacier voids.',
    precision: 'FP16'
  }
];

export class ModelManager {
  private models: EdgeAiModel[] = [...INITIAL_AI_MODELS];
  private subscribers: Set<(models: EdgeAiModel[]) => void> = new Set();

  public getModels(): EdgeAiModel[] {
    return [...this.models];
  }

  public getActiveModel(): EdgeAiModel | undefined {
    return this.models.find((m) => m.status === 'INSTALLED');
  }

  public subscribe(cb: (models: EdgeAiModel[]) => void): () => void {
    this.subscribers.add(cb);
    cb([...this.models]);
    return () => this.subscribers.delete(cb);
  }

  public async installModel(modelId: string): Promise<boolean> {
    const model = this.models.find((m) => m.modelId === modelId);
    if (!model) return false;

    model.status = 'DOWNLOADING';
    model.downloadProgressPercent = 0;
    this.notifySubscribers();

    for (let progress = 10; progress <= 100; progress += 20) {
      await new Promise((r) => setTimeout(r, 200));
      model.downloadProgressPercent = progress;
      this.notifySubscribers();
    }

    model.status = 'INSTALLED';
    model.installedAt = new Date().toISOString();
    delete model.downloadProgressPercent;
    this.notifySubscribers();
    return true;
  }

  public removeModel(modelId: string): boolean {
    const model = this.models.find((m) => m.modelId === modelId);
    if (!model) return false;

    model.status = 'AVAILABLE';
    delete model.installedAt;
    delete model.downloadProgressPercent;
    this.notifySubscribers();
    return true;
  }

  private notifySubscribers(): void {
    const list = [...this.models];
    this.subscribers.forEach((cb) => cb(list));
  }
}

export const modelManager = new ModelManager();
