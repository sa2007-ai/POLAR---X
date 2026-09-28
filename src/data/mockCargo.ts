import { CargoItem } from '../types';

export const mockCargo: CargoItem[] = [
  {
    id: 'crg-901',
    trackingNumber: 'PLX-SHP-2026-0881',
    title: 'Deep Ice Drill Titanium Bit Assembly & Cryogenic Core Barrels',
    category: 'Scientific Equipment',
    origin: 'Cape Town Port, South Africa',
    destinationStation: 'Maitri Research Base',
    transportMode: 'Icebreaker Ship (MV Golovnin)',
    weightKg: 3450,
    volumeM3: 12.4,
    hazardousMaterial: false,
    temperatureControlled: false,
    status: 'In Transit',
    eta: '2026-11-04',
    departureDate: '2026-10-12',
    carrier: 'Russian Maritime Icebreaker Agency',
    priority: 'Urgent Expedition Critical',
    manifestDetails: [
      '2x 120mm Tungsten-Carbide Coring Heads',
      '4x 3-meter Kevlar-Reinforced Core Extraction Tubes',
      '1x Glycol Closed-Loop Thermal Melting Coil'
    ]
  },
  {
    id: 'crg-902',
    trackingNumber: 'PLX-AIR-2026-1044',
    title: 'Freeze-Tolerant High-Density LiFePO4 Energy Storage Pods',
    category: 'Station Spare Parts',
    origin: 'Christchurch Logistics Depot, New Zealand',
    destinationStation: 'Bharati Station',
    transportMode: 'C-130 Hercules Air',
    weightKg: 1850,
    volumeM3: 4.8,
    hazardousMaterial: true,
    temperatureControlled: true,
    tempRequirement: 'Keep above -15°C',
    status: 'Staged at Port',
    eta: '2026-10-28',
    departureDate: '2026-10-22',
    carrier: 'RNZAF Polar Airlift Squad',
    priority: 'High Priority',
    manifestDetails: [
      '8x 48V 200Ah Arctic-Insulated Lithium Battery Racks',
      '2x Microprocessor-Controlled Self-Heating Battery Inverters',
      '1x Remote Telemetry BMS Unit'
    ]
  },
  {
    id: 'crg-903',
    trackingNumber: 'PLX-SNO-2026-3312',
    title: 'Emergency Medical Trauma Kits & Freeze-Dried Blood Plasma',
    category: 'Medical Supplies',
    origin: 'Maitri Base Clinic',
    destinationStation: 'Maitri Research Base',
    transportMode: 'Twin Otter Ski-Plane',
    weightKg: 280,
    volumeM3: 1.2,
    hazardousMaterial: false,
    temperatureControlled: true,
    tempRequirement: 'Active Cryo-Cooling at -20°C',
    status: 'Air-Dropped',
    eta: '2026-09-26',
    departureDate: '2026-09-26',
    carrier: 'Kenn Borek Air Charter',
    priority: 'Urgent Expedition Critical',
    manifestDetails: [
      '4x Portable Field Defibrillators with Thermal Blankets',
      '50x Ampoules Lyophilized Universal Plasma',
      '10x Arctic Hypothermia Rewarming Suits'
    ]
  },
  {
    id: 'crg-904',
    trackingNumber: 'PLX-TRAV-2026-4011',
    title: 'Jet A-1 Freeze-Inhibited Aviation & Generator Fuel Bladders',
    category: 'Fuel & Lubricants',
    origin: 'Bharati Fuel Depot',
    destinationStation: 'Bharati Station',
    transportMode: 'PistonBully Overland Traverse',
    weightKg: 14200,
    volumeM3: 18.0,
    hazardousMaterial: true,
    temperatureControlled: false,
    status: 'In Transit',
    eta: '2026-10-02',
    departureDate: '2026-09-24',
    carrier: 'NCPOR Heavy Traverse Unit-3',
    priority: 'High Priority',
    manifestDetails: [
      '4x 4000L Reinforced Arctic Flexi-Tanks',
      '12x Sub-Zero Diaphragm Transfer Pumps',
      '6x Spill Containment Absorbent Booms'
    ]
  },
  {
    id: 'crg-905',
    trackingNumber: 'PLX-RAT-2026-5590',
    title: 'Winter-Over High-Caloric Food Provisions & Freeze-Dried Rations',
    category: 'Food & Rations',
    origin: 'Goa NCPOR Central Warehouse',
    destinationStation: 'Maitri Research Base',
    transportMode: 'Icebreaker Ship (MV Golovnin)',
    weightKg: 8900,
    volumeM3: 24.5,
    hazardousMaterial: false,
    temperatureControlled: false,
    status: 'Delivered',
    eta: '2026-09-15',
    departureDate: '2026-08-01',
    carrier: 'Indian Antarctic Logistic Vessel',
    priority: 'Routine',
    manifestDetails: [
      '500x Vacuum-Packed 30-Day Expedition Ration Blocks',
      '120x Dehydrated Dairy and Protein Fortified Powders',
      '80x Tins of Cold-Climate High Energy Nut Pastes'
    ]
  },
  {
    id: 'crg-906',
    trackingNumber: 'PLX-EXP-2026-8801',
    title: 'Autonomous Ocean Glider & CTD Sensor Array Pods',
    category: 'Scientific Equipment',
    origin: 'Hobart Oceanographic Facility, Australia',
    destinationStation: 'Bharati Station',
    transportMode: 'C-130 Hercules Air',
    weightKg: 620,
    volumeM3: 2.9,
    hazardousMaterial: false,
    temperatureControlled: true,
    tempRequirement: 'Store between +5°C and +20°C',
    status: 'Delayed by Weather',
    eta: '2026-10-05',
    departureDate: '2026-09-22',
    carrier: 'Australian Antarctic Air Cargo',
    priority: 'High Priority',
    manifestDetails: [
      '2x Slocum Deep Gliders with Acoustic Modems',
      '6x Expendable Bathythermograph (XBT) Launchers',
      '1x Calibration Pressure Tank'
    ]
  }
];
