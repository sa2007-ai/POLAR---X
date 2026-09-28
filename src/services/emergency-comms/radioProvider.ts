/**
 * POLAR-X Radio Gateway Providers
 * Multi-band emergency radio transport abstractions.
 */

import { EmergencyPacket, RadioGatewayStatus, RadioGatewayType } from './emergencyMessageTypes';

export interface RadioProvider {
  type: RadioGatewayType;
  getStatus(): RadioGatewayStatus;
  transmitPacket(packet: EmergencyPacket): Promise<{
    success: boolean;
    ackReceived: boolean;
    gatewayMessage: string;
    acknowledgedBy?: string;
  }>;
}

export class VhfAx25GatewayProvider implements RadioProvider {
  public type: RadioGatewayType = 'VHF';

  public getStatus(): RadioGatewayStatus {
    return {
      gatewayType: 'VHF',
      name: 'VHF AX.25 Packet Radio (144.390 MHz)',
      frequencyOrBand: '144.390 MHz / 1200 Baud AFSK',
      status: 'UNCONFIGURED',
      isHardwareAttached: false,
      signalQualityPercent: 0,
      description: 'AX.25 packet radio terminal node controller (TNC). Requires physical USB KISS TNC modem.'
    };
  }

  public async transmitPacket(_packet: EmergencyPacket) {
    return {
      success: false,
      ackReceived: false,
      gatewayMessage: 'RADIO GATEWAY: UNCONFIGURED (No physical 144.390 MHz VHF TNC detected)'
    };
  }
}

export class HfAleGatewayProvider implements RadioProvider {
  public type: RadioGatewayType = 'HF';

  public getStatus(): RadioGatewayStatus {
    return {
      gatewayType: 'HF',
      name: 'HF ALE Transceiver (3 - 30 MHz)',
      frequencyOrBand: 'MIL-STD-188-141B Automatic Link Establishment',
      status: 'UNCONFIGURED',
      isHardwareAttached: false,
      signalQualityPercent: 0,
      description: 'Long-range trans-continental polar HF ionospheric radio. Requires serial CAT interface.'
    };
  }

  public async transmitPacket(_packet: EmergencyPacket) {
    return {
      success: false,
      ackReceived: false,
      gatewayMessage: 'RADIO GATEWAY: UNCONFIGURED (No Barrett / Codan HF modem connected)'
    };
  }
}

export class SatelliteSbdGatewayProvider implements RadioProvider {
  public type: RadioGatewayType = 'SATELLITE';

  public getStatus(): RadioGatewayStatus {
    return {
      gatewayType: 'SATELLITE',
      name: 'Iridium SBD Modem (9603N)',
      frequencyOrBand: '1616 - 1626.5 MHz L-Band',
      status: 'UNCONFIGURED',
      isHardwareAttached: false,
      signalQualityPercent: 0,
      description: 'Direct Short Burst Data satellite transceiver. Requires hardware gateway daemon.'
    };
  }

  public async transmitPacket(_packet: EmergencyPacket) {
    return {
      success: false,
      ackReceived: false,
      gatewayMessage: 'SATELLITE GATEWAY: STANDBY / UNCONFIGURED'
    };
  }
}

export class DemoRadioGatewayProvider implements RadioProvider {
  public type: RadioGatewayType = 'SIMULATED';

  public getStatus(): RadioGatewayStatus {
    return {
      gatewayType: 'SIMULATED',
      name: 'Simulated Emergency Radio Link',
      frequencyOrBand: 'Tactical UHF / VHF Simulation',
      status: 'SIMULATED',
      isHardwareAttached: true,
      signalQualityPercent: 92,
      lastTxAt: new Date().toISOString(),
      description: 'Software-simulated emergency packet transport with realistic propagation delay and ACK handshake.'
    };
  }

  public async transmitPacket(_packet: EmergencyPacket) {
    // Simulate propagation time and station ACK
    await new Promise((r) => setTimeout(r, 650));
    return {
      success: true,
      ackReceived: true,
      gatewayMessage: 'Packet broadcast confirmed via simulated tactical mesh radio',
      acknowledgedBy: 'MAITRI-BASE-COMMS-01'
    };
  }
}

export const vhfProvider = new VhfAx25GatewayProvider();
export const hfProvider = new HfAleGatewayProvider();
export const satelliteRadioProvider = new SatelliteSbdGatewayProvider();
export const demoRadioProvider = new DemoRadioGatewayProvider();
