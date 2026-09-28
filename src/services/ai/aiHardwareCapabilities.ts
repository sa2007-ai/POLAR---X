/**
 * POLAR-X WebGPU Hardware Capabilities Detector
 * Discovers GPU adapters, vendor strings, memory limits, and backend support.
 */

export interface WebGpuAdapterInfo {
  isSupported: boolean;
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
  maxComputeWorkgroupStorageSize?: number;
  maxBufferSize?: number;
  hasFp16Support: boolean;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'PERMISSION_REQUIRED' | 'ERROR';
  errorMessage?: string;
}

export class AiHardwareCapabilities {
  private cachedInfo: WebGpuAdapterInfo | null = null;

  public async detectCapabilities(): Promise<WebGpuAdapterInfo> {
    if (this.cachedInfo) return this.cachedInfo;

    if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
      this.cachedInfo = {
        isSupported: false,
        hasFp16Support: false,
        status: 'UNAVAILABLE',
        errorMessage: 'WebGPU API not supported in this browser environment.'
      };
      return this.cachedInfo;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        this.cachedInfo = {
          isSupported: false,
          hasFp16Support: false,
          status: 'UNAVAILABLE',
          errorMessage: 'No compatible WebGPU hardware adapter found.'
        };
        return this.cachedInfo;
      }

      // Check features
      const hasFp16 = adapter.features.has('shader-f16');

      // Request device with standard limits
      const device = await adapter.requestDevice({
        requiredFeatures: hasFp16 ? ['shader-f16'] : []
      });

      // Request adapter info if supported by browser
      let adapterInfo: any = {};
      if ('requestAdapterInfo' in adapter) {
        try {
          adapterInfo = await (adapter as any).requestAdapterInfo();
        } catch {
          // fallback
        }
      }

      this.cachedInfo = {
        isSupported: true,
        vendor: adapterInfo.vendor || 'Hardware Accelerated GPU',
        architecture: adapterInfo.architecture || 'Unified Shader Architecture',
        device: adapterInfo.device || 'Direct3D12 / Vulkan / Metal Backend',
        description: adapterInfo.description || 'Browser WebGPU Device Context',
        maxComputeWorkgroupStorageSize: device.limits.maxComputeWorkgroupStorageSize,
        maxBufferSize: device.limits.maxBufferSize,
        hasFp16Support: hasFp16,
        status: 'AVAILABLE'
      };

      return this.cachedInfo;
    } catch (err: any) {
      this.cachedInfo = {
        isSupported: false,
        hasFp16Support: false,
        status: 'ERROR',
        errorMessage: err.message || 'Failed to initialize WebGPU device context.'
      };
      return this.cachedInfo;
    }
  }

  public getCachedInfo(): WebGpuAdapterInfo | null {
    return this.cachedInfo;
  }
}

export const aiHardwareCapabilities = new AiHardwareCapabilities();
