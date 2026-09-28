/**
 * POLAR-X Unified Device Registry Service
 * Central hardware and virtual device catalog across GPS, Radio, LoRa, UAV, Satellite, Wearables, and WebGPU.
 */

import { DeviceRegistryRecord } from './deviceTypes';

export const INITIAL_DEVICE_REGISTRY: DeviceRegistryRecord[] = [
  {
    deviceId: 'DEV-GPS-SERIAL-01',
    category: 'GPS',
    name: 'u-blox NEO-M8N High-Precision GNSS Receiver',
    model: 'NEO-M8N USB Dongle',
    manufacturer: 'u-blox AG',
    connectionInterface: 'WEB_SERIAL',
    status: 'STANDBY',
    firmwareVersion: '3.01 (u-blox)',
    assignedEntity: 'Maitri Mobile Command Base',
    lastSeen: new Date().toISOString(),
    isSimulated: false,
    notes: 'Direct Web Serial NMEA 0183 port interface ready'
  },
  {
    deviceId: 'DEV-WEBGPU-01',
    category: 'AI_ACCELERATOR',
    name: 'Direct3D12 / Metal / Vulkan GPU Compute Adapter',
    model: 'Unified WebGPU Device Context',
    manufacturer: 'Hardware Accelerated Graphics',
    connectionInterface: 'WEBGPU',
    status: 'ONLINE',
    firmwareVersion: 'WebGPU Spec v1.0',
    assignedEntity: 'On-Device Thermal Crevasse Pipeline',
    lastSeen: new Date().toISOString(),
    isSimulated: false,
    notes: 'Hardware shader execution active'
  },
  {
    deviceId: 'DEV-LORA-MESH-01',
    category: 'LORA',
    name: 'Meshtastic SX1262 868MHz Off-Grid Mesh Node',
    model: 'Heltec V3 ESP32-S3 LoRa',
    manufacturer: 'Heltec Automation',
    connectionInterface: 'SIMULATED',
    status: 'SIMULATED',
    batteryPercent: 88,
    firmwareVersion: 'Meshtastic v2.3.4',
    assignedEntity: 'Schirmacher Nunatak Relay',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: 'Multi-hop decentralized packet radio node'
  },
  {
    deviceId: 'DEV-AFSK-BELL202',
    category: 'RADIO',
    name: 'AFSK 1200 / Bell 202 Audio Modem Interface',
    model: 'WebAudio TRRS DSP Engine',
    manufacturer: 'POLAR-X Audio Radio Bridge',
    connectionInterface: 'WEB_AUDIO',
    status: 'ONLINE',
    firmwareVersion: 'Bell 202 DSP v1.0',
    assignedEntity: 'Handheld VHF Walkie-Talkie Bridge',
    lastSeen: new Date().toISOString(),
    isSimulated: false,
    notes: '1200 / 2200 Hz continuous phase audio synthesizer'
  },
  {
    deviceId: 'DEV-BLE-WEARABLE-01',
    category: 'WEARABLE',
    name: 'Polar H10 / Sense Biometric Chest Strap',
    model: 'GATT Heart Rate & Temp Sensor',
    manufacturer: 'Polar Electro / Generic BLE',
    connectionInterface: 'SIMULATED',
    status: 'SIMULATED',
    batteryPercent: 88,
    firmwareVersion: 'BLE 5.0 GATT',
    assignedEntity: 'Dr. Rajesh Sharma (PER-001)',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: 'Real-time heart rate and skin temperature tracking'
  },
  {
    deviceId: 'DEV-UAV-SCOUT-01',
    category: 'UAV',
    name: 'DJI Matrice 300 RTK Polar Scout Drone',
    model: 'Matrice 300 RTK + Zenmuse H20T Thermal',
    manufacturer: 'DJI Enterprise',
    connectionInterface: 'SIMULATED',
    status: 'SIMULATED',
    batteryPercent: 84,
    firmwareVersion: 'v04.01.0000',
    assignedEntity: 'Airborne Recon Sortie Alpha',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: 'Radiometric thermal IR camera feed'
  },
  {
    deviceId: 'DEV-SAT-CERTUS-01',
    category: 'SATELLITE',
    name: 'Iridium Certus 700 L-Band Transceiver',
    model: 'Certus 9770 High-Gain Array',
    manufacturer: 'Iridium Communications Inc.',
    connectionInterface: 'SIMULATED',
    status: 'SIMULATED',
    firmwareVersion: 'v2.14.0-SIM',
    assignedEntity: 'Maitri Polar Broadband Gateway',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: '352 kbps Uplink / 704 kbps Downlink Polar Satellite IP Session'
  },
  {
    deviceId: 'DEV-UAV-AUTOPILOT-01',
    category: 'UAV',
    name: 'Pixhawk 6X Pro Heated Autopilot Flight Controller',
    model: 'PX4 v1.14 Autopilot MAVLink Bridge',
    manufacturer: 'Holybro / PX4 Autopilot',
    connectionInterface: 'SIMULATED',
    status: 'SIMULATED',
    batteryPercent: 76,
    firmwareVersion: 'PX4 v1.14.3-Polar',
    assignedEntity: 'UAV-RECON-ALPHA Autonomy Suite',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: 'Autonomous Link-Loss and Return-To-Home (RTL) Interlock Engine'
  },
  {
    deviceId: 'DEV-3D-RECON-ENGINE',
    category: 'AI_ACCELERATOR',
    name: 'Photogrammetry & Radiometric IR 3D Reconstruction Node',
    model: 'POLAR-X Dense Point Cloud Engine',
    manufacturer: 'NCPOR Polar Intelligence Lab',
    connectionInterface: 'WEBGPU',
    status: 'ONLINE',
    firmwareVersion: '3D-SfM v9.0',
    assignedEntity: 'Crevasse Hazard Volumetric Analysis',
    lastSeen: new Date().toISOString(),
    isSimulated: true,
    notes: 'Real-time multi-view heightmap & crevasse depth estimator'
  }
];

export class DeviceRegistryService {
  private devices: DeviceRegistryRecord[] = [...INITIAL_DEVICE_REGISTRY];
  private subscribers: Set<(devices: DeviceRegistryRecord[]) => void> = new Set();

  public getDevices(): DeviceRegistryRecord[] {
    return [...this.devices];
  }

  public subscribe(cb: (devices: DeviceRegistryRecord[]) => void): () => void {
    this.subscribers.add(cb);
    cb([...this.devices]);
    return () => this.subscribers.delete(cb);
  }

  public updateDeviceStatus(deviceId: string, status: any): void {
    const d = this.devices.find((dev) => dev.deviceId === deviceId);
    if (d) {
      d.status = status;
      d.lastSeen = new Date().toISOString();
      this.notifySubscribers();
    }
  }

  private notifySubscribers(): void {
    const list = [...this.devices];
    this.subscribers.forEach((cb) => cb(list));
  }
}

export const deviceRegistryService = new DeviceRegistryService();
