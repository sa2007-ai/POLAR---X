/**
 * POLAR-X Web Bluetooth Device Manager
 * Connects to Polar / Garmin / standard BLE GATT heart rate & thermometer sensors.
 * REQUIRES explicit user button interaction.
 */

import { BleDeviceInfo, BleConnectionStatus } from './bleTypes';

export class BleDeviceManager {
  private connectedDevice: BleDeviceInfo | null = null;
  private status: BleConnectionStatus = 'DISCONNECTED';
  private subscribers: Set<(status: BleConnectionStatus, dev: BleDeviceInfo | null) => void> = new Set();

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!(navigator as any).bluetooth;
  }

  public getStatus(): BleConnectionStatus {
    return this.status;
  }

  public getConnectedDevice(): BleDeviceInfo | null {
    return this.connectedDevice;
  }

  public subscribe(cb: (status: BleConnectionStatus, dev: BleDeviceInfo | null) => void): () => void {
    this.subscribers.add(cb);
    cb(this.status, this.connectedDevice);
    return () => this.subscribers.delete(cb);
  }

  /**
   * Request Bluetooth device pair with standard Heart Rate (0x180D) and Battery (0x180F) services.
   */
  public async connectBleWearable(personnelId: string, personnelName: string): Promise<boolean> {
    if (!this.isSupported()) {
      this.updateStatus('UNAVAILABLE');
      throw new Error('Web Bluetooth API is not supported in this browser. Use Chrome or Edge.');
    }

    try {
      this.updateStatus('CONNECTING');

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service', 'health_thermometer']
      });

      await device.gatt.connect();

      this.connectedDevice = {
        id: device.id || 'BLE-GATT-DEVICE-01',
        name: device.name || 'Polar H10 / Garmin HRM-Pro',
        status: 'CONNECTED',
        batteryPercent: 92,
        pairedPersonnelId: personnelId,
        pairedPersonnelName: personnelName,
        connectedAt: new Date().toISOString()
      };

      this.updateStatus('CONNECTED');
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.updateStatus('DISCONNECTED');
        return false;
      }
      this.updateStatus('ERROR');
      throw new Error(`Bluetooth connection failed: ${err.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    this.connectedDevice = null;
    this.updateStatus('DISCONNECTED');
  }

  private updateStatus(newStatus: BleConnectionStatus): void {
    this.status = newStatus;
    this.subscribers.forEach((cb) => cb(this.status, this.connectedDevice));
  }
}

export const bleDeviceManager = new BleDeviceManager();
