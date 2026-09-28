import { Expedition } from '../types';

export const mockExpeditions: Expedition[] = [
  {
    id: 'exp-44-iae',
    code: 'IND-44-IAE',
    title: '44th Indian Antarctic Expedition: Schirmacher Glacier Deep Survey',
    type: 'Glaciology & Ice Core',
    leader: 'Dr. Vikram Anand',
    leaderId: 'pers-101',
    station: 'Maitri Research Base',
    region: 'Queen Maud Land / Schirmacher Oasis',
    startDate: '2026-11-15',
    endDate: '2027-04-10',
    status: 'Active',
    priority: 'Critical',
    personnelCount: 28,
    assignedVehicles: ['Hagglunds Bv206 #04', 'PistonBully PB300 #01', 'Polaris Titan Pro #08'],
    progressPercent: 68,
    budgetAllocated: 45000000,
    budgetUsed: 31200000,
    coordinates: {
      lat: -70.767,
      lng: 11.733,
      altitude: '180 m'
    },
    objectives: [
      'Extract 350m deep ice core to study 150,000-year paleoclimate records',
      'Deploy autonomous seismic acoustic sensors across the ice shelf boundary',
      'Assess sub-surface crevasse movement near Lake Priyadarshini'
    ],
    weatherAlert: 'Moderate Katabatic wind advisory (55 km/h)'
  },
  {
    id: 'exp-larsemann-ocean',
    code: 'IND-44-LSO',
    title: 'Prydz Bay Coastal Oceanography & Phytoplankton Bloom Dynamics',
    type: 'Marine Biology',
    leader: 'Dr. Ananya Roy',
    leaderId: 'pers-102',
    station: 'Bharati Station',
    region: 'Larsemann Hills, East Antarctica',
    startDate: '2026-12-01',
    endDate: '2027-03-25',
    status: 'Active',
    priority: 'High',
    personnelCount: 16,
    assignedVehicles: ['Hagglunds Bv206 #02', 'Twin Otter Ski-Plane #IN-02'],
    progressPercent: 82,
    budgetAllocated: 28000000,
    budgetUsed: 23800000,
    coordinates: {
      lat: -69.407,
      lng: 76.191,
      altitude: '40 m'
    },
    objectives: [
      'Collect microplastic baseline samples along coastal sea-ice edges',
      'Tag 12 Weddell seals with satellite CTD sensors',
      'Continuous acoustic tracking of krill swarm distributions'
    ]
  },
  {
    id: 'exp-himadri-arctic-core',
    code: 'IND-ARC-26',
    title: 'Svalbard Ny-Ålesund Atmospheric Aerosol & Black Carbon Intercept',
    type: 'Atmospheric Physics',
    leader: 'Dr. Rohan Mehra',
    leaderId: 'pers-103',
    station: 'Himadri Arctic Station',
    region: 'Kongsfjorden, Svalbard Archipelago',
    startDate: '2026-06-10',
    endDate: '2026-10-20',
    status: 'Active',
    priority: 'Normal',
    personnelCount: 8,
    assignedVehicles: ['Lynx Commander Snowmobile #01', 'Lynx Commander Snowmobile #02'],
    progressPercent: 92,
    budgetAllocated: 14000000,
    budgetUsed: 12900000,
    coordinates: {
      lat: 78.923,
      lng: 11.928,
      altitude: '15 m'
    },
    objectives: [
      'High-altitude tethered balloon LIDAR sounding profiles',
      'Monitor persistent organic pollutants (POPs) in snow precipitation',
      'Calibrate ground sun photometer with Copernicus Sentinel-5P'
    ]
  },
  {
    id: 'exp-southpole-traverse',
    code: 'IND-INT-SPT',
    title: 'Overland Scientific Traverse: Bharati to Dome Concordia Axis',
    type: 'Logistics Resupply',
    leader: 'Cmdr. Suresh Nambiar',
    leaderId: 'pers-104',
    station: 'Bharati Station',
    region: 'Princess Elizabeth Land Interior',
    startDate: '2027-01-05',
    endDate: '2027-02-28',
    status: 'Planning',
    priority: 'Critical',
    personnelCount: 12,
    assignedVehicles: ['PistonBully PB300 #02', 'Caterpillar Challenger #01', 'Kässbohrer Heavy Sledge'],
    progressPercent: 25,
    budgetAllocated: 52000000,
    budgetUsed: 8400000,
    coordinates: {
      lat: -72.500,
      lng: 85.200,
      altitude: '1,950 m'
    },
    objectives: [
      'Transport 40,000 Liters of freeze-grade polar aviation fuel to Waypoint Zulu',
      'Test ground-penetrating radar for rapid crevasse auto-detection',
      'Establish emergency autonomous weather outpost at 72°S'
    ]
  },
  {
    id: 'exp-dronning-geology',
    code: 'IND-43-DML',
    title: 'Wohlthat Mountains Gneiss Metamorphism & Mineral Specimen Expedition',
    type: 'Geological Survey',
    leader: 'Dr. Priya Sundaram',
    leaderId: 'pers-105',
    station: 'Maitri Research Base',
    region: 'Central Dronning Maud Land',
    startDate: '2025-11-20',
    endDate: '2026-03-10',
    status: 'Completed',
    priority: 'Normal',
    personnelCount: 14,
    assignedVehicles: ['Hagglunds Bv206 #01', 'Ski-Doo Skandic #03'],
    progressPercent: 100,
    budgetAllocated: 22000000,
    budgetUsed: 21450000,
    coordinates: {
      lat: -71.583,
      lng: 12.333,
      altitude: '1,450 m'
    },
    objectives: [
      'Collect 180 rock drill core samples from Nunatak outcroppings',
      'Map Gondwana supercontinent suture zones',
      'Complete aerial magnetometry survey with drone swarms'
    ]
  },
  {
    id: 'exp-mcmurdo-sar',
    code: 'SAR-2026-09',
    title: 'Emergency SAR: Erebus Ice Tongue Stuck Survey Party Recovery',
    type: 'Search & Rescue',
    leader: 'Capt. Marcus Vance',
    leaderId: 'pers-106',
    station: 'McMurdo Station',
    region: 'Ross Island / Erebus Glacier',
    startDate: '2026-09-25',
    endDate: '2026-09-28',
    status: 'Emergency Hold',
    priority: 'Critical',
    personnelCount: 6,
    assignedVehicles: ['Basler BT-67 Turbo Dakota #US-01', 'SAR Snowcat #09'],
    progressPercent: 40,
    budgetAllocated: 8500000,
    budgetUsed: 3100000,
    coordinates: {
      lat: -77.650,
      lng: 166.450,
      altitude: '210 m'
    },
    objectives: [
      'Locate and extract 3 glaciologists stranded during 80kt whiteout',
      'Deliver emergency survival pod with thermal blankets and rations',
      'Tow disabled snowmobile back to McMurdo vehicle depot'
    ],
    weatherAlert: 'CRITICAL: Severe blizzard (95 km/h gusts, visibility < 5m)'
  }
];
