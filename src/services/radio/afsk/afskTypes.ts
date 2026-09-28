/**
 * POLAR-X AFSK 1200 / Bell 202 Audio Modem Types
 * 1200 Baud AFSK (Mark: 1200 Hz, Space: 2200 Hz) Audio Interface
 */

export type AudioModemStatus =
  | 'READY'
  | 'LISTENING'
  | 'TRANSMITTING'
  | 'RECEIVING'
  | 'PERMISSION_REQUIRED'
  | 'UNAVAILABLE'
  | 'ERROR';

export interface AudioDeviceInfo {
  inputDeviceId?: string;
  inputDeviceLabel?: string;
  outputDeviceId?: string;
  outputDeviceLabel?: string;
  sampleRate: number;
  isAudioContextActive: boolean;
}

export interface AfskTransmissionResult {
  success: boolean;
  durationMs: number;
  tonesGenerated: number;
  rawHex: string;
  timestamp: string;
  message: string;
}

export interface AfskDecodedFrame {
  isValid: boolean;
  rawHex: string;
  decodedPayload?: string;
  error?: string;
  signalSnrDb?: number;
  timestamp: string;
}
