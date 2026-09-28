/**
 * POLAR-X Emergency Packet Decoder & Validator
 */

import { EmergencyPacket, EmergencyMessageType, EmergencyPriority } from './emergencyMessageTypes';
import { calculatePacketChecksumHex } from './packetEncoder';

const REVERSE_TYPE_MAP: Record<number, EmergencyMessageType> = {
  0x01: 'SOS',
  0x02: 'POSITION',
  0x03: 'MEDICAL',
  0x04: 'WEATHER',
  0x05: 'ROUTE',
  0x06: 'EVACUATION',
  0x07: 'ACK',
  0x08: 'HEARTBEAT'
};

const REVERSE_PRIORITY_MAP: Record<number, EmergencyPriority> = {
  0x01: 'ROUTINE',
  0x02: 'PRIORITY',
  0x03: 'CRITICAL',
  0x04: 'FLASH'
};

export const decodeEmergencyPacket = (rawHex: string): { isValid: boolean; packet?: EmergencyPacket; error?: string } => {
  const cleanHex = rawHex.trim().toUpperCase();
  if (!cleanHex.startsWith('PX1') || cleanHex.length < 35) {
    return { isValid: false, error: 'Malformed packet header or insufficient length' };
  }

  // Extract body and checksum (last 4 chars)
  const body = cleanHex.slice(0, -4);
  const receivedChecksum = cleanHex.slice(-4);
  const calculatedChecksum = calculatePacketChecksumHex(body);

  if (receivedChecksum !== calculatedChecksum) {
    return { isValid: false, error: `CRC Checksum mismatch (calc: ${calculatedChecksum}, recv: ${receivedChecksum})` };
  }

  try {
    const typeByte = parseInt(body.slice(3, 5), 16);
    const prioByte = parseInt(body.slice(5, 7), 16);

    const latRaw = parseInt(body.slice(7, 15), 16);
    // Convert 32-bit unsigned to signed integer
    const latSigned = latRaw > 0x7fffffff ? latRaw - 0x100000000 : latRaw;
    const latitude = latSigned / 1000000;

    const lngRaw = parseInt(body.slice(15, 23), 16);
    const lngSigned = lngRaw > 0x7fffffff ? lngRaw - 0x100000000 : lngRaw;
    const longitude = lngSigned / 1000000;

    const epochSeconds = parseInt(body.slice(23, 31), 16);
    const timestamp = new Date(epochSeconds * 1000).toISOString();

    const payloadLen = parseInt(body.slice(31, 33), 16);
    let payloadText = '';
    if (payloadLen > 0 && body.length >= 33 + payloadLen * 2) {
      const payloadHex = body.slice(33, 33 + payloadLen * 2);
      const bytes = new Uint8Array(payloadHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
      payloadText = new TextDecoder().decode(bytes);
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return { isValid: false, error: `Decoded coordinates out of geographic limits: (${latitude}, ${longitude})` };
    }

    const packet: EmergencyPacket = {
      packetVersion: 1,
      messageId: `PKT-RX-${Date.now()}`,
      senderId: 'RADIO-REMOTE-STATION',
      expeditionId: 'EXP-REMOTE-TRAVERSE',
      timestamp,
      priority: REVERSE_PRIORITY_MAP[prioByte] || 'CRITICAL',
      messageType: REVERSE_TYPE_MAP[typeByte] || 'SOS',
      latitude,
      longitude,
      status: 'SENT',
      payloadText,
      checksumHex: receivedChecksum,
      retryCount: 0,
      maxRetries: 3,
      rawEncodedHex: cleanHex
    };

    return { isValid: true, packet };
  } catch (err: any) {
    return { isValid: false, error: `Failed to decode packet fields: ${err.message}` };
  }
};
