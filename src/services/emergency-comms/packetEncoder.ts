/**
 * POLAR-X Emergency Packet Encoder & Checksum Engine
 * Generates ultra-compact binary/hex payloads for low-bandwidth 300-1200 baud radio links.
 */

import { EmergencyPacket, EmergencyMessageType, EmergencyPriority } from './emergencyMessageTypes';

const MESSAGE_TYPE_MAP: Record<EmergencyMessageType, number> = {
  SOS: 0x01,
  POSITION: 0x02,
  MEDICAL: 0x03,
  WEATHER: 0x04,
  ROUTE: 0x05,
  EVACUATION: 0x06,
  ACK: 0x07,
  HEARTBEAT: 0x08
};

const PRIORITY_MAP: Record<EmergencyPriority, number> = {
  ROUTINE: 0x01,
  PRIORITY: 0x02,
  CRITICAL: 0x03,
  FLASH: 0x04
};

/**
 * Calculate standard 16-bit XOR checksum for low-bandwidth frames
 */
export const calculatePacketChecksumHex = (payloadString: string): string => {
  let checksum = 0xffff;
  for (let i = 0; i < payloadString.length; i++) {
    checksum ^= payloadString.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if ((checksum & 0x0001) !== 0) {
        checksum = (checksum >> 1) ^ 0xa001;
      } else {
        checksum = checksum >> 1;
      }
    }
  }
  return (checksum & 0xffff).toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Encode an emergency packet into a compact hexadecimal radio telegram
 * Format: [MAGIC:4B][VER:1B][TYPE:1B][PRIO:1B][LAT:4B][LNG:4B][TIME:4B][PLEN:1B][PAYLOAD][CRC:2B]
 */
export const encodeEmergencyPacket = (packet: Omit<EmergencyPacket, 'checksumHex' | 'rawEncodedHex'>): EmergencyPacket => {
  const typeCode = (MESSAGE_TYPE_MAP[packet.messageType] || 0x01).toString(16).padStart(2, '0');
  const prioCode = (PRIORITY_MAP[packet.priority] || 0x03).toString(16).padStart(2, '0');

  // Convert lat/lng to 32-bit signed fixed point integer (* 1,000,000)
  const latInt = Math.round(packet.latitude * 1000000);
  const lngInt = Math.round(packet.longitude * 1000000);

  const latHex = (latInt >>> 0).toString(16).padStart(8, '0');
  const lngHex = (lngInt >>> 0).toString(16).padStart(8, '0');

  const epochSeconds = Math.floor(new Date(packet.timestamp).getTime() / 1000);
  const timeHex = (epochSeconds >>> 0).toString(16).padStart(8, '0');

  const payloadText = packet.payloadText || '';
  const payloadHex = Array.from(new TextEncoder().encode(payloadText))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const payloadLenHex = (payloadText.length & 0xff).toString(16).padStart(2, '0');

  const frameBody = `PX1${typeCode}${prioCode}${latHex}${lngHex}${timeHex}${payloadLenHex}${payloadHex}`;
  const checksum = calculatePacketChecksumHex(frameBody);
  const fullRawHex = `${frameBody}${checksum}`;

  return {
    ...packet,
    checksumHex: checksum,
    rawEncodedHex: fullRawHex
  };
};
