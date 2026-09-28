/**
 * POLAR-X Unified Device Registry Types
 */

export type DeviceCategory =
  | 'GPS'
  | 'RADIO'
  | 'LORA'
  | 'WEARABLE'
  | 'UAV'
  | 'SATELLITE'
  | 'AI_ACCELERATOR';

export type DeviceHardwareStatus =
  | 'ONLINE'
  | 'STANDBY'
  | 'OFFLINE'
  | 'DEGRADED'
  | 'UNCONFIGURED'
  | 'SIMULATED';

export interface DeviceRegistryRecord {
  deviceId: string;
  category: DeviceCategory;
  name: string;
  model: string;
  manufacturer: string;
  connectionInterface: 'WEB_SERIAL' | 'WEB_BLUETOOTH' | 'WEB_AUDIO' | 'WEBGPU' | 'WEBRTC' | 'REST_GATEWAY' | 'SIMULATED';
  status: DeviceHardwareStatus;
  batteryPercent?: number;
  firmwareVersion?: string;
  assignedEntity?: string;
  lastSeen: string;
  isSimulated: boolean;
  notes?: string;
}
