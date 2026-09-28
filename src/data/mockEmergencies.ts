import { EmergencyIncident } from '../types';

export const mockEmergencies: EmergencyIncident[] = [
  {
    id: 'emg-01',
    incidentCode: 'SOS-2026-0925-A',
    title: 'Code Red: 3 Glaciologists Stranded Near Erebus Tongue Crevasse Field',
    severity: 'Catastrophic (Code Red)',
    status: 'Active SAR Dispatched',
    stationOrRegion: 'McMurdo Station Sector 4 (Ross Island)',
    reportedAt: '2026-09-25 14:15 UTC',
    reportedBy: 'Capt. Marcus Vance (SAR Lead)',
    involvedPersonnel: ['Dr. Steven Hall', 'Elena Rostova', 'Markus Lindholm'],
    summary: 'Sudden 95 km/h katabatic blizzard trapped survey team 18km from base. Primary snowmobile suffered mechanical track seizure. Team has deployed survival bivouac.',
    weatherCondition: 'Severe Whiteout, Temp: -38°C, Wind: 95 km/h, Visibility: 4 meters',
    protocolsTriggered: [
      'Protocol SAR-ALPHA: Basler BT-67 search aircraft standby',
      'Protocol SAR-BRAVO: PistonBully ground extraction convoy mobilized',
      'Satellite Iridium Beacon Emergency Priority Uplink enabled',
      'Base Medical Trauma Unit primed for acute hypothermia resuscitation'
    ],
    lastUpdate: '12 mins ago: Ground convoy within 4.2 km of emergency beacon coordinate.'
  },
  {
    id: 'emg-02',
    incidentCode: 'SOS-2026-0922-B',
    title: 'Code Orange: Maitri Primary Glycol Heat Exchanger Line Freeze',
    severity: 'Severe (Code Orange)',
    status: 'Investigating',
    stationOrRegion: 'Maitri Research Base (Main Habitation Block)',
    reportedAt: '2026-09-22 03:40 UTC',
    reportedBy: 'Station Engineer Gurpreet Singh',
    involvedPersonnel: ['Maitri Winter-Over Crew (25 Members)'],
    summary: 'Secondary heat recovery loop pressure dropped by 45% due to valve icing on south exposure wall. Habitational temperature dropped from 21°C to 14°C.',
    weatherCondition: 'Clear Sky, Katabatic gusts, Temp: -32°C, Wind: 42 km/h',
    protocolsTriggered: [
      'Activated tertiary auxiliary diesel blowers in living quarters',
      'Thermal camera inspection on exterior conduit pipe bridges',
      'Rationing non-essential electrical draw across science labs'
    ],
    lastUpdate: '35 mins ago: Valve de-iced using infrared radiant heat guns; pressure normalizing.'
  },
  {
    id: 'emg-03',
    incidentCode: 'SOS-2026-0919-C',
    title: 'Code Yellow: Satellite Earth Station Azimuth Tracking Motor Stalled',
    severity: 'Moderate (Code Yellow)',
    status: 'Resolved',
    stationOrRegion: 'Bharati Station Comms Radome',
    reportedAt: '2026-09-19 18:20 UTC',
    reportedBy: 'Neha Chawla (Comms Engineer)',
    involvedPersonnel: ['ISRO Telemetry Team'],
    summary: 'Ice buildup inside gear mesh restricted 360-degree slew rate, dropping GSAT satellite uplink bandwidth by 60%.',
    weatherCondition: 'Light snow, Temp: -24°C, Wind: 28 km/h',
    protocolsTriggered: [
      'Switched emergency telemetry packets to Iridium Low-Earth-Orbit constellation',
      'Radome internal heating boosted to +25°C',
      'Manual mechanical inspection completed'
    ],
    lastUpdate: 'Resolved: Radome heating restored full motor range; bandwidth back to 250 Mbps.'
  },
  {
    id: 'emg-04',
    incidentCode: 'SOS-2026-0915-D',
    title: 'Code Blue: Precautionary Sea Ice Fracture Advisory on Prydz Bay Crossing',
    severity: 'Advisory (Code Blue)',
    status: 'Standby',
    stationOrRegion: 'Bharati Station - Offshore Fast Ice',
    reportedAt: '2026-09-15 08:00 UTC',
    reportedBy: 'Satellite Synthetic Aperture Radar (SAR) Monitoring Desk',
    involvedPersonnel: ['Marine Biology Field Team'],
    summary: 'Sentinel-1 radar imagery indicates a 1.2km tidal crack widening 2km north of the research station vehicle transit route.',
    weatherCondition: 'Overcast, Temp: -18°C, Wind: 30 km/h',
    protocolsTriggered: [
      'Overland vehicle route redirected 4km inland over bedrock terrain',
      'Autonomous acoustic crack monitoring sonar buoy deployed',
      'Daily ground-penetrating radar survey mandated before all sorties'
    ],
    lastUpdate: 'Standby: Crack width stabilized at 1.8m; safe bypass operational.'
  }
];
