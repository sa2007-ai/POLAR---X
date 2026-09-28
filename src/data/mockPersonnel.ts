import { Personnel } from '../types';

export const mockPersonnel: Personnel[] = [
  {
    id: 'pers-101',
    badgeId: 'POLAR-IND-0101',
    name: 'Dr. Vikram Anand',
    role: 'Chief Scientist',
    team: 'Science',
    station: 'Maitri Research Base',
    expeditionId: 'exp-44-iae',
    expeditionName: '44th Indian Antarctic Expedition',
    nationality: 'Indian',
    bloodGroup: 'O+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 3,
    survivalCertExpiry: '2028-05-15',
    status: 'In Field',
    email: 'v.anand@ncpor.res.in',
    satPhone: '+8816-3184-9021',
    emergencyContact: {
      name: 'Sunita Anand',
      relation: 'Spouse',
      phone: '+91-98765-43210'
    },
    vitalStatus: {
      heartRate: 72,
      bodyTemp: '36.8°C',
      lastChecked: '10 mins ago'
    }
  },
  {
    id: 'pers-102',
    badgeId: 'POLAR-IND-0102',
    name: 'Dr. Ananya Roy',
    role: 'Station Commander',
    team: 'Operations',
    station: 'Bharati Station',
    expeditionId: 'exp-larsemann-ocean',
    expeditionName: 'Prydz Bay Coastal Oceanography',
    nationality: 'Indian',
    bloodGroup: 'A+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 2,
    survivalCertExpiry: '2027-11-30',
    status: 'At Base Station',
    email: 'ananya.roy@ncpor.res.in',
    satPhone: '+8816-3184-9022',
    emergencyContact: {
      name: 'Debashis Roy',
      relation: 'Father',
      phone: '+91-98300-11223'
    },
    vitalStatus: {
      heartRate: 68,
      bodyTemp: '37.0°C',
      lastChecked: '45 mins ago'
    }
  },
  {
    id: 'pers-103',
    badgeId: 'POLAR-IND-0103',
    name: 'Dr. Rohan Mehra',
    role: 'Meteorologist',
    team: 'Science',
    station: 'Himadri Arctic Station',
    expeditionId: 'exp-himadri-arctic-core',
    expeditionName: 'Svalbard Ny-Ålesund Atmospheric Intercept',
    nationality: 'Indian',
    bloodGroup: 'B+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 1,
    survivalCertExpiry: '2028-01-20',
    status: 'In Field',
    email: 'r.mehra@imd.gov.in',
    satPhone: '+8816-3184-9023',
    emergencyContact: {
      name: 'Kavita Mehra',
      relation: 'Spouse',
      phone: '+91-99101-88990'
    },
    vitalStatus: {
      heartRate: 78,
      bodyTemp: '36.6°C',
      lastChecked: '5 mins ago'
    }
  },
  {
    id: 'pers-104',
    badgeId: 'POLAR-IND-0104',
    name: 'Cmdr. Suresh Nambiar',
    role: 'Logistics Coordinator',
    team: 'Logistics',
    station: 'Bharati Station',
    expeditionId: 'exp-southpole-traverse',
    expeditionName: 'Overland Scientific Traverse',
    nationality: 'Indian',
    bloodGroup: 'AB+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 4,
    survivalCertExpiry: '2029-02-14',
    status: 'At Base Station',
    email: 'suresh.n@polarlogistics.in',
    satPhone: '+8816-3184-9024',
    emergencyContact: {
      name: 'Gayathri Nambiar',
      relation: 'Spouse',
      phone: '+91-94471-55443'
    },
    vitalStatus: {
      heartRate: 64,
      bodyTemp: '36.9°C',
      lastChecked: '1 hour ago'
    }
  },
  {
    id: 'pers-105',
    badgeId: 'POLAR-IND-0105',
    name: 'Dr. Priya Sundaram',
    role: 'Glaciologist',
    team: 'Science',
    station: 'Maitri Research Base',
    nationality: 'Indian',
    bloodGroup: 'O- Negative',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 2,
    survivalCertExpiry: '2027-08-10',
    status: 'At Base Station',
    email: 'priya.sundaram@gsi.gov.in',
    satPhone: '+8816-3184-9025',
    emergencyContact: {
      name: 'K. Sundaram',
      relation: 'Brother',
      phone: '+91-97900-33221'
    },
    vitalStatus: {
      heartRate: 70,
      bodyTemp: '36.7°C',
      lastChecked: '30 mins ago'
    }
  },
  {
    id: 'pers-106',
    badgeId: 'POLAR-US-0089',
    name: 'Capt. Marcus Vance',
    role: 'Field Survival Guide',
    team: 'Operations',
    station: 'McMurdo Station',
    expeditionId: 'exp-mcmurdo-sar',
    expeditionName: 'Emergency SAR: Erebus Party Recovery',
    nationality: 'American',
    bloodGroup: 'A- Negative',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 6,
    survivalCertExpiry: '2029-10-01',
    status: 'In Field',
    email: 'm.vance@usap.gov',
    satPhone: '+8816-5541-0089',
    emergencyContact: {
      name: 'Sarah Vance',
      relation: 'Sister',
      phone: '+1-303-555-0199'
    },
    vitalStatus: {
      heartRate: 88,
      bodyTemp: '36.4°C',
      lastChecked: '2 mins ago'
    }
  },
  {
    id: 'pers-107',
    badgeId: 'POLAR-IND-0107',
    name: 'Dr. Tenzing Norbu',
    role: 'Medical Officer',
    team: 'Medical',
    station: 'Maitri Research Base',
    nationality: 'Indian',
    bloodGroup: 'B- Negative',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 3,
    survivalCertExpiry: '2028-09-12',
    status: 'Medical Bay',
    email: 't.norbu@aiims.edu',
    satPhone: '+8816-3184-9027',
    emergencyContact: {
      name: 'Dolma Norbu',
      relation: 'Spouse',
      phone: '+91-98190-67890'
    },
    vitalStatus: {
      heartRate: 74,
      bodyTemp: '36.9°C',
      lastChecked: '15 mins ago'
    }
  },
  {
    id: 'pers-108',
    badgeId: 'POLAR-IND-0108',
    name: 'Gurpreet Singh',
    role: 'Heavy Vehicle Mechanic',
    team: 'Engineering',
    station: 'Bharati Station',
    nationality: 'Indian',
    bloodGroup: 'O+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 5,
    survivalCertExpiry: '2027-04-18',
    status: 'At Base Station',
    email: 'g.singh@polarassets.in',
    satPhone: '+8816-3184-9028',
    emergencyContact: {
      name: 'Harpreet Kaur',
      relation: 'Spouse',
      phone: '+91-98720-44556'
    },
    vitalStatus: {
      heartRate: 76,
      bodyTemp: '37.1°C',
      lastChecked: '50 mins ago'
    }
  },
  {
    id: 'pers-109',
    badgeId: 'POLAR-IND-0109',
    name: 'Lt. Col. Arvind Sharma',
    role: 'Polar Pilot',
    team: 'Aviation',
    station: 'Maitri Research Base',
    nationality: 'Indian',
    bloodGroup: 'A+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 2,
    survivalCertExpiry: '2028-03-30',
    status: 'In Transit',
    email: 'a.sharma@iaf.gov.in',
    satPhone: '+8816-3184-9029',
    emergencyContact: {
      name: 'Pooja Sharma',
      relation: 'Spouse',
      phone: '+91-98200-77665'
    },
    vitalStatus: {
      heartRate: 80,
      bodyTemp: '36.8°C',
      lastChecked: '20 mins ago'
    }
  },
  {
    id: 'pers-110',
    badgeId: 'POLAR-IND-0110',
    name: 'Neha Chawla',
    role: 'Comms & Radar Engineer',
    team: 'Engineering',
    station: 'Bharati Station',
    nationality: 'Indian',
    bloodGroup: 'B+ Positive',
    medicalClearance: 'Class-1 Polar Unrestricted',
    winterOverExperience: 1,
    survivalCertExpiry: '2028-07-22',
    status: 'At Base Station',
    email: 'neha.c@isro.gov.in',
    satPhone: '+8816-3184-9030',
    emergencyContact: {
      name: 'Sunil Chawla',
      relation: 'Father',
      phone: '+91-99887-11224'
    },
    vitalStatus: {
      heartRate: 69,
      bodyTemp: '36.7°C',
      lastChecked: '35 mins ago'
    }
  }
];
