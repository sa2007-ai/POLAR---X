/**
 * POLAR-X Audio Device & WebAudio Context Manager
 * Manages audio permissions, microphone inputs, and speaker outputs.
 */

import { AudioDeviceInfo, AudioModemStatus } from './afskTypes';

export class AudioDeviceManager {
  private audioCtx: AudioContext | null = null;
  private inputDevices: MediaDeviceInfo[] = [];
  private outputDevices: MediaDeviceInfo[] = [];
  private currentStatus: AudioModemStatus = 'READY';

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
  }

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public async enumerateDevices(): Promise<{ inputs: MediaDeviceInfo[]; outputs: MediaDeviceInfo[] }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return { inputs: [], outputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.inputDevices = devices.filter((d) => d.kind === 'audioinput');
      this.outputDevices = devices.filter((d) => d.kind === 'audiooutput');
      return { inputs: this.inputDevices, outputs: this.outputDevices };
    } catch {
      return { inputs: [], outputs: [] };
    }
  }

  public getDeviceInfo(): AudioDeviceInfo {
    const ctx = this.audioCtx;
    return {
      inputDeviceLabel: this.inputDevices[0]?.label || 'Default System Microphone',
      outputDeviceLabel: this.outputDevices[0]?.label || 'Default System Speakers / Handheld Radio 3.5mm Jack',
      sampleRate: ctx?.sampleRate || 44100,
      isAudioContextActive: ctx?.state === 'running'
    };
  }
}

export const audioDeviceManager = new AudioDeviceManager();
