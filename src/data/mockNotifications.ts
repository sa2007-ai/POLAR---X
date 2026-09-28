import { PolarNotification } from '../types';

export const mockNotifications: PolarNotification[] = [
  {
    id: 'notif-1',
    title: 'Code Red SOS: Erebus Crevasse SAR Active',
    description: 'Ground extraction convoy mobilized. Distance to stranded party: 4.2 km.',
    timestamp: '12 mins ago',
    type: 'emergency',
    read: false,
    link: '/emergency'
  },
  {
    id: 'notif-2',
    title: 'Low Stock Alert: Freeze-Dried Blood Plasma',
    description: 'Maitri Cryo-Unit down to 14 units (Threshold: 25). Resupply requested.',
    timestamp: '45 mins ago',
    type: 'warning',
    read: false,
    link: '/inventory'
  },
  {
    id: 'notif-3',
    title: 'Cargo In-Transit: Ice Core Drill Titanium Bit',
    description: 'Icebreaker MV Vasiliy Golovnin passed 60°S latitude heading to Maitri.',
    timestamp: '2 hours ago',
    type: 'info',
    read: true,
    link: '/cargo'
  },
  {
    id: 'notif-4',
    title: 'Satellite Uplink Nominal',
    description: 'GSAT Comms dish tracked at 250 Mbps high-throughput link with ISRO Ground Station.',
    timestamp: '4 hours ago',
    type: 'success',
    read: true,
    link: '/assets'
  },
  {
    id: 'notif-5',
    title: 'Expedition Milestone: 348m Core Reached',
    description: 'Dr. Anand reported successful sample recovery from 140,000-year paleoclimate stratum.',
    timestamp: '6 hours ago',
    type: 'success',
    read: true,
    link: '/expeditions'
  }
];
