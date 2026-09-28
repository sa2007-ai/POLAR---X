/**
 * POLAR-X UAV / Drone Scouting & Crevasse Risk Types
 */

export type UavFlightStatus = 'READY' | 'AIRBORNE' | 'SCOUTING' | 'RETURNING' | 'LANDED' | 'OFFLINE' | 'SIMULATED';

export type SensorPayloadType = 'THERMAL_INFRARED' | 'HIGH_RES_RGB' | 'MULTISPECTRAL_LIDAR' | 'GPR_RADAR';

export type CrevasseRiskLevel = 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK' | 'UNKNOWN';

export interface CrevasseDetection {
  id: string;
  missionId: string;
  uavId: string;
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedWidthMeters: number;
  estimatedLengthMeters: number;
  apparentDepthMeters?: number;
  riskLevel: CrevasseRiskLevel;
  confidenceScorePercent: number; // 0 to 100%
  thermalGradientDeltaC: number; // Surface temperature variance e.g. -4.8°C
  sensorType: SensorPayloadType;
  processingMethod: 'THERMAL_GRADIENT_ANOMALY' | 'SHADOW_EDGE_ANALYSIS' | 'SIMULATED_MODEL';
  isSimulated: boolean;
  notes: string;
}

export interface UavTelemetry {
  uavId: string;
  code: string; // e.g. UAV-ARCTIC-01
  model: string; // e.g. "DJI Matrice 350 RTK Polar Spec"
  missionId?: string;
  missionName?: string;
  coordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  speedKmh: number;
  headingDegrees: number;
  batteryLevelPercent: number;
  flightTimeMinutes: number;
  status: UavFlightStatus;
  activeSensor: SensorPayloadType;
  thermalCameraFeedActive: boolean;
  detectionsCount: number;
  isSimulated: boolean;
  lastHeartbeat: string;
}

export interface UavScoutingMission {
  id: string;
  code: string;
  title: string;
  uavId: string;
  expeditionCode: string;
  corridorStart: { lat: number; lng: number; name: string };
  corridorEnd: { lat: number; lng: number; name: string };
  plannedAltitudeMeters: number;
  startTime: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'ABORTED';
  detections: CrevasseDetection[];
}
