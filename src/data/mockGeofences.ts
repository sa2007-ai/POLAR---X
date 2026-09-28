import { GeofenceZone } from '../types/geofence';

export const mockGeofences: GeofenceZone[] = [
  {
    id: 'geo-crevasse-maitri-01',
    code: 'GEO-HAZ-01',
    name: 'Schirmacher Oasis Deep Crevasse Field',
    type: 'hazard',
    severity: 'Critical',
    stationOrRegion: 'Maitri Station (Queen Maud Land)',
    shape: 'polygon',
    center: {
      lat: -70.762,
      lng: 11.741
    },
    polygonPoints: [
      { lat: -70.745, lng: 11.705 },
      { lat: -70.748, lng: 11.785 },
      { lat: -70.778, lng: 11.792 },
      { lat: -70.781, lng: 11.712 }
    ],
    description: 'Active subsurface shear fractures and hidden blue ice crevasses exceeding 35m depth.',
    rules: [
      'Ground Penetrating Radar (GPR) mandatory before vehicle crossing',
      'Maximum convoy speed: 10 km/h',
      'Continuous tethering protocol enforced for all field personnel'
    ],
    status: 'active',
    createdAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'geo-wildlife-bharati-02',
    code: 'GEO-WLD-02',
    name: 'Prydz Bay Emperor Penguin Sanctuary',
    type: 'wildlife',
    severity: 'Warning',
    stationOrRegion: 'Bharati Station (Larsemann Hills)',
    shape: 'circle',
    center: {
      lat: -69.408,
      lng: 76.195
    },
    radiusMeters: 3500,
    description: 'Protected Emperor Penguin breeding colony under Antarctic Treaty Environmental Protocol (Madrid 1991).',
    rules: [
      'No motorized aircraft below 2,000 ft AGL within 3 km',
      'Heavy tracked vehicles prohibited; pedestrian biological survey only',
      'Minimum observation stand-off distance: 50 meters'
    ],
    status: 'active',
    createdAt: '2026-01-12T00:00:00.000Z'
  },
  {
    id: 'geo-shelf-dg-03',
    code: 'GEO-HAZ-03',
    name: 'Dakshin Gangotri Calving Ice Shelf Barrier',
    type: 'hazard',
    severity: 'Critical',
    stationOrRegion: 'Princess Astrid Coast (Dakshin Gangotri)',
    shape: 'polygon',
    center: {
      lat: -70.082,
      lng: 12.005
    },
    polygonPoints: [
      { lat: -70.065, lng: 11.950 },
      { lat: -70.062, lng: 12.065 },
      { lat: -70.098, lng: 12.072 },
      { lat: -70.102, lng: 11.942 }
    ],
    description: 'High risk iceberg calving zone with recurring tidal fractures and collapsing ice cliffs.',
    rules: [
      'Overland vehicle staging strictly forbidden within 500m of ice front',
      'Emergency beacon listening watch on 406.025 MHz',
      'Vessel approach requires continuous sonar depth sounding'
    ],
    status: 'active',
    createdAt: '2026-01-20T00:00:00.000Z'
  },
  {
    id: 'geo-cleanair-domec-04',
    code: 'GEO-SCI-04',
    name: 'Dome C Paleoclimate Clean Air Sector',
    type: 'scientific',
    severity: 'Advisory',
    stationOrRegion: 'Plateau Traverse Sector (Dome C)',
    shape: 'circle',
    center: {
      lat: -75.100,
      lng: 123.350
    },
    radiusMeters: 5000,
    description: 'Zero emission atmospheric physics sampling array measuring pre-industrial aerosol baselines.',
    rules: [
      'Combustion generators forbidden upwind',
      'Solar & hydrogen cell propulsion permitted only',
      'Footwear decontamination before ice core horizon entry'
    ],
    status: 'active',
    createdAt: '2026-02-01T00:00:00.000Z'
  },
  {
    id: 'geo-radio-himadri-05',
    code: 'GEO-RES-05',
    name: 'Ny-Ålesund Radio Quiet Exclusion Zone',
    type: 'restricted',
    severity: 'Warning',
    stationOrRegion: 'Himadri Station (Ny-Ålesund, Arctic)',
    shape: 'circle',
    center: {
      lat: -78.923,
      lng: 11.922
    },
    radiusMeters: 4000,
    description: 'Ultra-sensitive radio astronomy and cosmic ray telemetry array.',
    rules: [
      'Active WiFi (2.4 / 5.0 GHz) & Bluetooth transmitters forbidden',
      'Satellite uplink transceivers must operate on shielded waveguides',
      'Mobile communication handsets must be powered down in sector'
    ],
    status: 'active',
    createdAt: '2026-02-15T00:00:00.000Z'
  }
];
