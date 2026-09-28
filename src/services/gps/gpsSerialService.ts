/**
 * POLAR-X Web Serial GPS Service
 * Interfaces with native hardware GNSS dongles via browser Web Serial API.
 * Feeds raw NMEA sentences into the existing NMEA Parser.
 */

import { GpsBaudRate, GpsConnectionStatus, GpsDeviceInfo } from './gpsTypes';
import { parseNmeaSentence } from '../telemetry/nmea/nmeaParser';
import { ParsedNmeaSentence } from '../telemetry/nmea/nmeaTypes';

// Extend window / navigator typing for Web Serial
interface SerialPortOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPort {
  open(options: SerialPortOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: { filters?: Array<{ usbVendorId?: number; usbProductId?: number }> }): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
}

export class GpsSerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private keepReading = false;
  private status: GpsConnectionStatus = 'DISCONNECTED';
  private currentBaudRate: GpsBaudRate = 9600;
  private deviceInfo: GpsDeviceInfo | null = null;
  private lineBuffer = '';

  private sentenceSubscribers: Set<(sentence: ParsedNmeaSentence, raw: string) => void> = new Set();
  private statusSubscribers: Set<(status: GpsConnectionStatus, info: GpsDeviceInfo | null) => void> = new Set();

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator && !!navigator.serial;
  }

  public getStatus(): GpsConnectionStatus {
    return this.status;
  }

  public getDeviceInfo(): GpsDeviceInfo | null {
    return this.deviceInfo;
  }

  public subscribeStatus(cb: (status: GpsConnectionStatus, info: GpsDeviceInfo | null) => void): () => void {
    this.statusSubscribers.add(cb);
    cb(this.status, this.deviceInfo);
    return () => this.statusSubscribers.delete(cb);
  }

  public subscribeSentences(cb: (sentence: ParsedNmeaSentence, raw: string) => void): () => void {
    this.sentenceSubscribers.add(cb);
    return () => this.sentenceSubscribers.delete(cb);
  }

  public async connect(baudRate: GpsBaudRate = 9600): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.updateStatus('UNSUPPORTED');
      throw new Error('Web Serial API is not supported in this browser environment. Use Chrome, Edge, or Opera.');
    }

    try {
      this.updateStatus('CONNECTING');
      this.currentBaudRate = baudRate;

      this.port = await navigator.serial!.requestPort();
      await this.port.open({ baudRate: this.currentBaudRate });

      const info = this.port.getInfo();
      this.deviceInfo = {
        portName: info.usbVendorId ? `USB GNSS Device (VID: 0x${info.usbVendorId.toString(16).padStart(4, '0')})` : 'Serial GNSS Receiver',
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
        manufacturer: 'u-blox / Garmin / NMEA Generic',
        baudRate: this.currentBaudRate,
        connectedAt: new Date().toISOString()
      };

      this.updateStatus('CONNECTED');
      this.startReading();
      return true;
    } catch (err: any) {
      console.error('[POLAR-X GPS] Serial connection error:', err);
      this.updateStatus('ERROR');
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // stream cancel safe ignore
      }
      this.reader = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // port close safe ignore
      }
      this.port = null;
    }

    this.deviceInfo = null;
    this.updateStatus('DISCONNECTED');
  }

  private async startReading(): Promise<void> {
    if (!this.port || !this.port.readable) return;

    this.keepReading = true;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable as any);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.processStreamChunk(value);
        }
      }
    } catch (err) {
      if (this.keepReading) {
        console.error('[POLAR-X GPS] Stream reading error:', err);
        this.updateStatus('ERROR');
      }
    } finally {
      this.reader?.releaseLock();
      await readableStreamClosed.catch(() => {});
    }
  }

  private processStreamChunk(chunk: string): void {
    this.lineBuffer += chunk;
    const lines = this.lineBuffer.split(/\r?\n/);
    // Keep incomplete trailing line in buffer
    this.lineBuffer = lines.pop() || '';

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (trimmed.startsWith('$')) {
        const parsed = parseNmeaSentence(trimmed);
        this.sentenceSubscribers.forEach((cb) => cb(parsed, trimmed));
      }
    }
  }

  /**
   * Inject a test NMEA sentence for demonstration / simulation testing
   */
  public injectTestNmea(rawSentence: string): void {
    const parsed = parseNmeaSentence(rawSentence.trim());
    this.sentenceSubscribers.forEach((cb) => cb(parsed, rawSentence.trim()));
  }

  private updateStatus(newStatus: GpsConnectionStatus): void {
    this.status = newStatus;
    this.statusSubscribers.forEach((cb) => cb(this.status, this.deviceInfo));
  }
}

export const gpsSerialService = new GpsSerialService();
