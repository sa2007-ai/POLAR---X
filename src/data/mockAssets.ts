import { PolarAsset } from '../types';

export const mockAssets: PolarAsset[] = [
  {
    id: 'ast-101',
    assetTag: 'PLX-VEH-04',
    name: 'Hägglunds Bv206 Dual-Cab All-Terrain Tracked Carrier #04',
    category: 'Overland Vehicles',
    model: 'BAE Systems Bv206 Polar Spec',
    currentStation: 'Maitri Research Base',
    assignedExpedition: '44th Indian Antarctic Expedition',
    status: 'In Field Use',
    healthScore: 94,
    fuelLevelPercent: 78,
    operatingHours: 2480,
    subZeroRating: '-55°C',
    lastServiceDate: '2026-09-02',
    nextServiceDue: '2026-11-02',
    telemetry: {
      engineTemp: '84°C',
      batteryHealth: '98%',
      gpsLock: true,
      lastPing: '3 mins ago'
    }
  },
  {
    id: 'ast-102',
    assetTag: 'PLX-AIR-02',
    name: 'DHC-6 Twin Otter Ski-Equipped Utility Aircraft #IN-02',
    category: 'Aviation',
    model: 'De Havilland Canada Series 400',
    currentStation: 'Bharati Station',
    assignedExpedition: 'Prydz Bay Coastal Oceanography',
    status: 'Operational',
    healthScore: 89,
    fuelLevelPercent: 92,
    operatingHours: 1140,
    subZeroRating: '-50°C',
    lastServiceDate: '2026-08-28',
    nextServiceDue: '2026-10-28',
    telemetry: {
      engineTemp: 'Standby Cold-Hangar',
      batteryHealth: '95%',
      gpsLock: true,
      lastPing: '12 mins ago'
    }
  },
  {
    id: 'ast-103',
    assetTag: 'PLX-GEN-01',
    name: 'Primary 500kW Cogeneration Diesel-Wind Hybrid Powerhouse Unit #1',
    category: 'Power & Heating Generators',
    model: 'MAN Energy 500kVA Arctic Microgrid',
    currentStation: 'Bharati Station',
    status: 'Operational',
    healthScore: 97,
    fuelLevelPercent: 86,
    operatingHours: 8760,
    subZeroRating: '-60°C',
    lastServiceDate: '2026-09-10',
    nextServiceDue: '2026-10-10',
    telemetry: {
      engineTemp: '89°C',
      batteryHealth: '99%',
      gpsLock: true,
      lastPing: '1 min ago'
    }
  },
  {
    id: 'ast-104',
    assetTag: 'PLX-DRL-01',
    name: 'Electro-Mechanical Intermediate Deep Ice Core Drill Rig',
    category: 'Deep Ice Drill Rigs',
    model: 'BAS / NCPOR 500m Core System',
    currentStation: 'Maitri Research Base',
    assignedExpedition: '44th Indian Antarctic Expedition',
    status: 'In Field Use',
    healthScore: 82,
    operatingHours: 320,
    subZeroRating: '-50°C',
    lastServiceDate: '2026-08-15',
    nextServiceDue: '2026-10-15',
    telemetry: {
      engineTemp: '68°C Drill Motor',
      batteryHealth: '91%',
      gpsLock: true,
      lastPing: '5 mins ago'
    }
  },
  {
    id: 'ast-105',
    assetTag: 'PLX-VEH-09',
    name: 'Kässbohrer PistonBully 300 Polar Heavy Snow Groomer & Tractor',
    category: 'Overland Vehicles',
    model: 'PistonBully 300 Polar Edition',
    currentStation: 'Maitri Research Base',
    status: 'Maintenance Required',
    healthScore: 61,
    fuelLevelPercent: 34,
    operatingHours: 4120,
    subZeroRating: '-50°C',
    lastServiceDate: '2026-07-20',
    nextServiceDue: '2026-09-20 (Overdue)',
    telemetry: {
      engineTemp: 'Cold',
      batteryHealth: '74% (Thermal wrap active)',
      gpsLock: true,
      lastPing: '22 mins ago'
    }
  },
  {
    id: 'ast-106',
    assetTag: 'PLX-SAT-03',
    name: 'C/Ku-Band 4.5m Carbon Fiber Radome Protected Earth Station Dish',
    category: 'Satellite Communications',
    model: 'Orbit Communications AL-7208',
    currentStation: 'Bharati Station',
    status: 'Operational',
    healthScore: 98,
    operatingHours: 14200,
    subZeroRating: '-65°C',
    lastServiceDate: '2026-09-01',
    nextServiceDue: '2026-12-01',
    telemetry: {
      engineTemp: 'Internal Heater 18°C',
      batteryHealth: '100%',
      gpsLock: true,
      lastPing: 'Real-Time Sync'
    }
  },
  {
    id: 'ast-107',
    assetTag: 'PLX-MOD-01',
    name: 'Autonomous Self-Sustaining Polar Field Habitat Pod (4-Person)',
    category: 'Habitation Modules',
    model: 'HexaPod Extreme Shelter Mark IV',
    currentStation: 'Himadri Arctic Station',
    status: 'De-iced / Standby',
    healthScore: 92,
    operatingHours: 950,
    subZeroRating: '-55°C',
    lastServiceDate: '2026-08-10',
    nextServiceDue: '2026-11-10',
    telemetry: {
      engineTemp: 'Solar Staged Standby',
      batteryHealth: '96%',
      gpsLock: true,
      lastPing: '45 mins ago'
    }
  }
];
