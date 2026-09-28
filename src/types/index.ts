// Core Type Definitions for POLAR-X

export type ExpeditionStatus =
  | 'Planning'
  | 'Scheduled'
  | 'Active'
  | 'Completed'
  | 'Cancelled'
  | 'Wintering'
  | 'Emergency Hold';

export type ExpeditionPriority = 'Normal' | 'High' | 'Critical';
export type ExpeditionType =
  | 'Glaciology & Ice Core'
  | 'Atmospheric Physics'
  | 'Marine Biology'
  | 'Geological Survey'
  | 'Logistics Resupply'
  | 'Search & Rescue';

export interface Expedition {
  id: string;
  code: string;
  title: string;
  type: ExpeditionType;
  leader: string;
  leaderId: string;
  station: string;
  region: string;
  startDate: string;
  endDate: string;
  status: ExpeditionStatus;
  priority: ExpeditionPriority;
  personnelCount: number;
  assignedVehicles: string[];
  progressPercent: number;
  budgetAllocated: number;
  budgetUsed: number;
  coordinates: {
    lat: number;
    lng: number;
    altitude: string;
  };
  objectives: string[];
  weatherAlert?: string;
}

export type PersonnelRole =
  | 'Station Commander'
  | 'Chief Scientist'
  | 'Glaciologist'
  | 'Meteorologist'
  | 'Medical Officer'
  | 'Heavy Vehicle Mechanic'
  | 'Comms & Radar Engineer'
  | 'Logistics Coordinator'
  | 'Polar Pilot'
  | 'Field Survival Guide';

export type PersonnelTeam =
  | 'Science'
  | 'Logistics'
  | 'Medical'
  | 'Operations'
  | 'Aviation'
  | 'Engineering';

export type PersonnelStatus =
  | 'Active'
  | 'Available'
  | 'On Leave'
  | 'Emergency'
  | 'Inactive'
  | 'In Field'
  | 'At Base Station'
  | 'In Transit'
  | 'Medical Bay'
  | 'Off-Duty';

export type MedicalClearance =
  | 'Class-1 Polar Unrestricted'
  | 'Class-2 Field Restricted'
  | 'Review Pending'
  | 'Grounded';

export interface Personnel {
  id: string;
  badgeId: string;
  name: string;
  role: PersonnelRole;
  team: PersonnelTeam;
  station: string;
  expeditionId?: string;
  expeditionName?: string;
  nationality: string;
  bloodGroup: string;
  medicalClearance: MedicalClearance;
  winterOverExperience: number;
  survivalCertExpiry: string;
  status: PersonnelStatus;
  email: string;
  satPhone: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  vitalStatus: {
    heartRate: number;
    bodyTemp: string;
    lastChecked: string;
  };
}

export type CargoStatus =
  | 'Prepared'
  | 'Loaded'
  | 'In Transit'
  | 'Arrived'
  | 'Delivered'
  | 'Delayed'
  | 'Lost'
  | 'Customs Cleared'
  | 'Staged at Port'
  | 'Air-Dropped'
  | 'Delayed by Weather';

export type TransportMode =
  | 'Icebreaker Ship (MV Golovnin)'
  | 'C-130 Hercules Air'
  | 'Twin Otter Ski-Plane'
  | 'PistonBully Overland Traverse';

export interface CargoItem {
  id: string;
  trackingNumber: string;
  title: string;
  category:
    | 'Scientific Equipment'
    | 'Fuel & Lubricants'
    | 'Food & Rations'
    | 'Survival & Cold Gear'
    | 'Station Spare Parts'
    | 'Medical Supplies';
  origin: string;
  destinationStation: string;
  expeditionId?: string;
  expeditionName?: string;
  transportMode: TransportMode;
  weightKg: number;
  volumeM3: number;
  hazardousMaterial: boolean;
  temperatureControlled: boolean;
  tempRequirement?: string;
  status: CargoStatus;
  eta: string;
  departureDate: string;
  carrier: string;
  priority: 'Routine' | 'High Priority' | 'Urgent Expedition Critical';
  manifestDetails: string[];
}

export type InventoryCategory =
  | 'Survival Rations'
  | 'Fuel Reserves'
  | 'Medical Stock'
  | 'Extreme Cold Wear'
  | 'Vehicle Spare Parts'
  | 'Oxygen & Gas Cylinders';

export type InventoryCalculatedStatus =
  | 'NORMAL'
  | 'LOW STOCK'
  | 'CRITICAL'
  | 'EXPIRED'
  | 'Adequate'
  | 'Low Stock'
  | 'Critical Shortage'
  | 'Expiring Soon';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  station: string;
  locationBin: string;
  quantity: number;
  unit: string;
  minimumThreshold: number;
  maximumCapacity: number;
  expiryDate: string;
  status: InventoryCalculatedStatus;
  costPerUnit: number;
  lastAudited: string;
  supplier: string;
}

export type AssetCategory =
  | 'Overland Vehicles'
  | 'Aviation'
  | 'Power & Heating Generators'
  | 'Satellite Communications'
  | 'Deep Ice Drill Rigs'
  | 'Habitation Modules';

export type AssetOperationalStatus =
  | 'Available'
  | 'In Use'
  | 'Under Maintenance'
  | 'Unavailable'
  | 'Operational'
  | 'In Field Use'
  | 'Maintenance Required'
  | 'De-iced / Standby'
  | 'Severe Breakdown';

export interface PolarAsset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  model: string;
  currentStation: string;
  assignedExpedition?: string;
  status: AssetOperationalStatus;
  healthScore: number;
  fuelLevelPercent?: number;
  operatingHours: number;
  subZeroRating: string;
  lastServiceDate: string;
  nextServiceDue: string;
  telemetry: {
    engineTemp: string;
    batteryHealth: string;
    gpsLock: boolean;
    lastPing: string;
  };
}

export type EmergencySeverity =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Catastrophic (Code Red)'
  | 'Severe (Code Orange)'
  | 'Moderate (Code Yellow)'
  | 'Advisory (Code Blue)';

export type EmergencyWorkflowStatus =
  | 'REPORTED'
  | 'ACKNOWLEDGED'
  | 'RESPONSE STARTED'
  | 'UNDER CONTROL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'Active SAR Dispatched'
  | 'Shelter-In-Place'
  | 'Investigating'
  | 'Resolved'
  | 'Standby';

export interface EmergencyIncident {
  id: string;
  incidentCode: string;
  title: string;
  severity: EmergencySeverity;
  status: EmergencyWorkflowStatus;
  stationOrRegion: string;
  reportedAt: string;
  reportedBy: string;
  assignedTeam?: string;
  involvedPersonnel: string[];
  summary: string;
  weatherCondition: string;
  protocolsTriggered: string[];
  lastUpdate: string;
}

export interface PolarStation {
  id: string;
  name: string;
  country: string;
  established: string;
  coordinates: {
    lat: number;
    lng: number;
    formatted: string;
  };
  altitude: string;
  currentTemp: number;
  windSpeedKmh: number;
  windChill: number;
  blizzardWarning: boolean;
  population: {
    summer: number;
    winter: number;
    current: number;
  };
  satelliteUplinkMbps: number;
  powerGridStatus: 'Nominal 100%' | 'Secondary Turbines' | 'Battery Backup (78%)';
}

export interface PolarReport {
  id: string;
  reportCode: string;
  title: string;
  category: 'Logistics & Fuel' | 'Environmental Compliance' | 'Scientific Output' | 'Medical & Health' | 'Asset Telemetry';
  author: string;
  station: string;
  dateGenerated: string;
  fileSize: string;
  format: 'PDF' | 'CSV' | 'JSON';
  summary: string;
  metrics: {
    label: string;
    value: string;
  }[];
}

export interface PolarNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'emergency' | 'warning' | 'info' | 'success';
  read: boolean;
  link?: string;
}

export interface PolarActivityLog {
  id: string;
  timestamp: string;
  module: 'expeditions' | 'personnel' | 'cargo' | 'inventory' | 'assets' | 'emergency' | 'system';
  action: string;
  details: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  user: string;
}

// Dynamic Calculation Helpers
export const getInventoryCalculatedStatus = (
  quantity: number,
  minThreshold: number,
  expiryDate?: string
): InventoryCalculatedStatus => {
  if (expiryDate) {
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    if (exp <= now) {
      return 'EXPIRED';
    }
    // Expiring within 60 days
    if (exp - now < 60 * 24 * 60 * 60 * 1000) {
      return 'Expiring Soon';
    }
  }

  if (quantity <= minThreshold * 0.4) {
    return 'CRITICAL';
  }
  if (quantity <= minThreshold) {
    return 'LOW STOCK';
  }
  return 'NORMAL';
};

export * from './auth';

