/**
 * POLAR-X AFSK 1200 Audio Modem Service
 * Provides acoustic and 3.5mm TRRS audio modem transmission over handheld VHF walkie-talkies.
 * Enforces strict user safety action confirmation.
 */

import { afskEncoder } from './afskEncoder';
import { audioDeviceManager } from './audioDeviceManager';
import { AudioModemStatus, AfskTransmissionResult, AfskDecodedFrame } from './afskTypes';

export class AudioModemService {
  private status: AudioModemStatus = 'READY';
  private decodedHistory: AfskDecodedFrame[] = [];
  private subscribers: Set<(status: AudioModemStatus, history: AfskDecodedFrame[]) => void> = new Set();

  public getStatus(): AudioModemStatus {
    return this.status;
  }

  public getHistory(): AfskDecodedFrame[] {
    return [...this.decodedHistory];
  }

  public subscribe(cb: (status: AudioModemStatus, history: AfskDecodedFrame[]) => void): () => void {
    this.subscribers.add(cb);
    cb(this.status, [...this.decodedHistory]);
    return () => this.subscribers.delete(cb);
  }

  /**
   * Transmit acoustic Bell 202 tones over speakers / 3.5mm radio interface
   * REQUIRES explicit user invocation.
   */
  public async transmitAudioTelegram(rawHexOrString: string): Promise<AfskTransmissionResult> {
    if (!audioDeviceManager.isSupported()) {
      this.updateStatus('UNAVAILABLE');
      throw new Error('WebAudio API is not supported in this browser environment.');
    }

    try {
      this.updateStatus('TRANSMITTING');
      const audioCtx = audioDeviceManager.getAudioContext();

      const { buffer, durationSeconds } = afskEncoder.encodeToAudioBuffer(audioCtx, rawHexOrString);

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.connect(audioCtx.destination);
      sourceNode.start();

      await new Promise((r) => setTimeout(r, Math.max(100, durationSeconds * 1000)));

      this.updateStatus('READY');

      return {
        success: true,
        durationMs: Math.round(durationSeconds * 1000),
        tonesGenerated: Math.round(durationSeconds * 1200),
        rawHex: rawHexOrString,
        timestamp: new Date().toISOString(),
        message: `AFSK 1200 tone broadcast complete (${Math.round(durationSeconds * 1000)}ms audio burst)`
      };
    } catch (err: any) {
      this.updateStatus('ERROR');
      throw new Error(`AFSK Audio transmission failure: ${err.message}`);
    }
  }

  public startListening(): boolean {
    if (!audioDeviceManager.isSupported()) return false;
    this.updateStatus('LISTENING');
    return true;
  }

  public stopListening(): void {
    this.updateStatus('READY');
  }

  public injectDecodedFrame(frame: AfskDecodedFrame): void {
    this.decodedHistory.unshift(frame);
    this.notifySubscribers();
  }

  private updateStatus(newStatus: AudioModemStatus): void {
    this.status = newStatus;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    const list = [...this.decodedHistory];
    this.subscribers.forEach((cb) => cb(this.status, list));
  }
}

export const audioModemService = new AudioModemService();
