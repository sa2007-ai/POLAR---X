/**
 * POLAR-X AI Runtime Manager
 * Dynamic execution backend selection (WebGPU ➔ WebAssembly ➔ Demo Fallback).
 * Tracks genuine execution latency benchmarks and performance metrics.
 */

import { aiHardwareCapabilities } from './aiHardwareCapabilities';

export type AiBackendType = 'WEBGPU' | 'WASM' | 'DEMO';

export interface AiExecutionMetrics {
  backend: AiBackendType;
  modelName: string;
  modelVersion: string;
  preprocessingMs: number;
  inferenceMs: number;
  postprocessingMs: number;
  totalMs: number;
  throughputFps: number;
  hardwareAdapter?: string;
  timestamp: string;
}

export class AiRuntimeManager {
  private selectedBackend: AiBackendType = 'WASM';
  private latestMetrics: AiExecutionMetrics | null = null;
  private metricsSubscribers: Set<(metrics: AiExecutionMetrics) => void> = new Set();

  constructor() {
    this.detectPreferredBackend();
  }

  public async detectPreferredBackend(): Promise<AiBackendType> {
    const caps = await aiHardwareCapabilities.detectCapabilities();
    if (caps.isSupported && caps.status === 'AVAILABLE') {
      this.selectedBackend = 'WEBGPU';
    } else {
      this.selectedBackend = 'WASM';
    }
    return this.selectedBackend;
  }

  public getActiveBackend(): AiBackendType {
    return this.selectedBackend;
  }

  public setBackend(backend: AiBackendType): void {
    this.selectedBackend = backend;
  }

  public getLatestMetrics(): AiExecutionMetrics | null {
    return this.latestMetrics;
  }

  public recordMetrics(metrics: AiExecutionMetrics): void {
    this.latestMetrics = metrics;
    this.metricsSubscribers.forEach((cb) => cb(metrics));
  }

  public subscribeMetrics(cb: (metrics: AiExecutionMetrics) => void): () => void {
    this.metricsSubscribers.add(cb);
    if (this.latestMetrics) {
      cb(this.latestMetrics);
    }
    return () => this.metricsSubscribers.delete(cb);
  }
}

export const aiRuntimeManager = new AiRuntimeManager();
