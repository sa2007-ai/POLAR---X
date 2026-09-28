/**
 * POLAR-X Simulated UAV Recon & Crevasse Detection Engine
 */

import { UavTelemetry, CrevasseDetection } from '../../types/uav';

export const INITIAL_UAV_FLEET: UavTelemetry[] = [
  {
    uavId: 'uav-01',
    code: 'UAV-RECON-ALPHA',
    model: 'Polar-Spec Matrice 350 RTK (Heated Avionics)',
    missionId: 'msn-01',
    missionName: 'Wohlthat Ridge Crevasse Scouting Flight',
    coordinates: {
      lat: -70.92,
      lng: 11.85,
      altitudeMeters: 145
    },
    speedKmh: 48.0,
    headingDegrees: 160,
    batteryLevelPercent: 78,
    flightTimeMinutes: 18,
    status: 'SCOUTING',
    activeSensor: 'THERMAL_INFRARED',
    thermalCameraFeedActive: true,
    detectionsCount: 3,
    isSimulated: true,
    lastHeartbeat: new Date().toISOString()
  },
  {
    uavId: 'uav-02',
    code: 'UAV-RECON-BRAVO',
    model: 'WingtraOne Gen II VTOL Mapping Drone',
    missionId: 'msn-02',
    missionName: 'Bharati Coastal Shelf Ice Barrier Recon',
    coordinates: {
      lat: -69.44,
      lng: 76.28,
      altitudeMeters: 210
    },
    speedKmh: 58.0,
    headingDegrees: 115,
    batteryLevelPercent: 84,
    flightTimeMinutes: 12,
    status: 'AIRBORNE',
    activeSensor: 'MULTISPECTRAL_LIDAR',
    thermalCameraFeedActive: true,
    detectionsCount: 2,
    isSimulated: true,
    lastHeartbeat: new Date().toISOString()
  }
];

export const INITIAL_CREVASSE_DETECTIONS: CrevasseDetection[] = [
  {
    id: 'crv-01',
    missionId: 'msn-01',
    uavId: 'uav-01',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    coordinates: {
      lat: -70.95,
      lng: 11.9
    },
    estimatedWidthMeters: 6.5,
    estimatedLengthMeters: 180,
    apparentDepthMeters: 25,
    riskLevel: 'HIGH_RISK',
    confidenceScorePercent: 94,
    thermalGradientDeltaC: -5.4,
    sensorType: 'THERMAL_INFRARED',
    processingMethod: 'THERMAL_GRADIENT_ANOMALY',
    isSimulated: true,
    notes: 'Sub-surface snow bridge fracture detected via thermal contrast difference.'
  },
  {
    id: 'crv-02',
    missionId: 'msn-01',
    uavId: 'uav-01',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    coordinates: {
      lat: -71.02,
      lng: 12.02
    },
    estimatedWidthMeters: 3.2,
    estimatedLengthMeters: 95,
    apparentDepthMeters: 14,
    riskLevel: 'MODERATE_RISK',
    confidenceScorePercent: 88,
    thermalGradientDeltaC: -3.2,
    sensorType: 'THERMAL_INFRARED',
    processingMethod: 'THERMAL_GRADIENT_ANOMALY',
    isSimulated: true,
    notes: 'Transverse crevasse flank margin along blue ice transition zone.'
  },
  {
    id: 'crv-03',
    missionId: 'msn-02',
    uavId: 'uav-02',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    coordinates: {
      lat: -69.455,
      lng: 76.325
    },
    estimatedWidthMeters: 8.0,
    estimatedLengthMeters: 320,
    apparentDepthMeters: 35,
    riskLevel: 'HIGH_RISK',
    confidenceScorePercent: 96,
    thermalGradientDeltaC: -6.8,
    sensorType: 'MULTISPECTRAL_LIDAR',
    processingMethod: 'THERMAL_GRADIENT_ANOMALY',
    isSimulated: true,
    notes: 'Tidal hinge crevasse opening directly across coastal snowcat corridor.'
  }
];

class UavReconService {
  private uavList: UavTelemetry[] = [...INITIAL_UAV_FLEET];
  private detections: CrevasseDetection[] = [...INITIAL_CREVASSE_DETECTIONS];
  private subscribers: Set<(uavs: UavTelemetry[], detections: CrevasseDetection[]) => void> = new Set();
  private intervalId: any = null;

  constructor() {
    this.startSimulation();
  }

  public getUavFleet(): UavTelemetry[] {
    return this.uavList;
  }

  public getDetections(): CrevasseDetection[] {
    return this.detections;
  }

  public subscribe(callback: (uavs: UavTelemetry[], detections: CrevasseDetection[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.uavList, this.detections);
    return () => this.subscribers.delete(callback);
  }

  public async triggerManualDetection(detection: Omit<CrevasseDetection, 'id' | 'timestamp'>): Promise<CrevasseDetection> {
    const newDet: CrevasseDetection = {
      id: `crv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...detection
    };
    this.detections = [newDet, ...this.detections];
    this.notify();
    return newDet;
  }

  private startSimulation(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.uavList = this.uavList.map((uav) => {
        if (uav.status !== 'SCOUTING' && uav.status !== 'AIRBORNE') return uav;
        const newLat = uav.coordinates.lat - 0.001;
        const newLng = uav.coordinates.lng + 0.0015;
        const newBattery = Math.max(15, uav.batteryLevelPercent - 0.1);

        return {
          ...uav,
          coordinates: {
            ...uav.coordinates,
            lat: Math.round(newLat * 100000) / 100000,
            lng: Math.round(newLng * 100000) / 100000
          },
          batteryLevelPercent: Math.round(newBattery * 10) / 10,
          flightTimeMinutes: uav.flightTimeMinutes + 0.1,
          lastHeartbeat: new Date().toISOString()
        };
      });
      this.notify();
    }, 4000);
  }

  private notify(): void {
    this.subscribers.forEach((cb) => cb([...this.uavList], [...this.detections]));
  }
}

export const uavReconService = new UavReconService();
