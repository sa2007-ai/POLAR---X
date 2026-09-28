import { PolarReport } from '../types';

export const mockReports: PolarReport[] = [
  {
    id: 'rep-01',
    reportCode: 'REP-2026-Q3-LOG',
    title: 'Comprehensive Polar Fuel & Energy Microgrid Consumption Audit Q3',
    category: 'Logistics & Fuel',
    author: 'Cmdr. Suresh Nambiar',
    station: 'Maitri Research Base & Bharati Station',
    dateGenerated: '2026-09-20',
    fileSize: '4.8 MB',
    format: 'PDF',
    summary: 'Quarterly assessment of diesel consumption, wind turbine generation offsets, and thermal cogeneration efficiency across Indian Antarctic stations.',
    metrics: [
      { label: 'Total Diesel Consumed', value: '48,200 Liters' },
      { label: 'Wind Turbine Contribution', value: '38.4% of Total Load' },
      { label: 'Thermal Recovery Efficiency', value: '86.2%' },
      { label: 'Carbon Reduction vs 2025', value: '-14.8%' }
    ]
  },
  {
    id: 'rep-02',
    reportCode: 'REP-2026-ENV-09',
    title: 'Madrid Environmental Protocol Compliance & Waste Neutrality Review',
    category: 'Environmental Compliance',
    author: 'Dr. Priya Sundaram',
    station: 'Bharati Station',
    dateGenerated: '2026-09-18',
    fileSize: '3.2 MB',
    format: 'PDF',
    summary: 'Inspection report certifying zero open burning, biological incinerator emissions metrics, and containerized hazardous waste staging for reverse logistics.',
    metrics: [
      { label: 'Solid Waste Compacted', value: '12.4 Metric Tons' },
      { label: 'Greywater Filtration Index', value: '99.2% Pure' },
      { label: 'Container Staging Compliance', value: '100% Madrid Compliant' },
      { label: 'Fuel Spill Incidents', value: '0 (Zero Incidents)' }
    ]
  },
  {
    id: 'rep-03',
    reportCode: 'REP-2026-SCI-44',
    title: 'Paleoclimate Deep Ice Core Stratigraphy & Isotope Yield Log',
    category: 'Scientific Output',
    author: 'Dr. Vikram Anand',
    station: 'Maitri Research Base',
    dateGenerated: '2026-09-14',
    fileSize: '12.1 MB',
    format: 'CSV',
    summary: 'Continuous 350-meter depth density, electrical conductivity measurement (ECM), and δ18O oxygen isotopic ratios extracted from Schirmacher Glacier.',
    metrics: [
      { label: 'Total Core Extracted', value: '348.6 Meters' },
      { label: 'Core Preservation Temp', value: '-22.5°C Sealed' },
      { label: 'Volcanic Ash Horizons', value: '14 Distinct Bands' },
      { label: 'Estimated Basal Age', value: '142,000 Years BP' }
    ]
  },
  {
    id: 'rep-04',
    reportCode: 'REP-2026-MED-Q3',
    title: 'Winter-Over Crew Vital Biometrics, Circadian Rhythm & Hypothermia Audit',
    category: 'Medical & Health',
    author: 'Dr. Tenzing Norbu',
    station: 'Maitri Research Base',
    dateGenerated: '2026-09-10',
    fileSize: '2.1 MB',
    format: 'PDF',
    summary: 'Quarterly psychological and physiological review of 25 wintering expedition members during the 60-day continuous polar night phase.',
    metrics: [
      { label: 'Mean Crew Heart Rate', value: '71 BPM' },
      { label: 'Vitamin D3 Compliance', value: '100% Supplemented' },
      { label: 'Frostbite / Cold Injuries', value: '0 Major Incidents' },
      { label: 'Sleep Quality Index', value: '82/100 Nominal' }
    ]
  },
  {
    id: 'rep-05',
    reportCode: 'REP-2026-AST-HLTH',
    title: 'Sub-Zero Heavy Machinery & Aerial Asset Telemetry Log',
    category: 'Asset Telemetry',
    author: 'Gurpreet Singh',
    station: 'Maitri & Bharati Fleet Depots',
    dateGenerated: '2026-09-05',
    fileSize: '6.4 MB',
    format: 'JSON',
    summary: 'Engine vibration diagnostics, synthetic hydraulic oil viscosity breakdown, and cold-start heater cycles for all tracked vehicles.',
    metrics: [
      { label: 'Fleet Readiness Rate', value: '91.4%' },
      { label: 'Avg Pre-Heat Cycle Time', value: '28 Minutes' },
      { label: 'Track Tension Integrity', value: '98% Optimal' },
      { label: 'Battery Cold Crank Cap', value: '94% Nominal' }
    ]
  }
];
