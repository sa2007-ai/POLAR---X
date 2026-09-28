import { PolarStation } from '../types';

export const mockStations: PolarStation[] = [
  {
    id: 'st-maitri',
    name: 'Maitri Research Base',
    country: 'India (NCPOR)',
    established: '1989',
    coordinates: {
      lat: -70.767,
      lng: 11.733,
      formatted: '70°46′00″S, 11°44′00″E'
    },
    altitude: '117 m',
    currentTemp: -28.4,
    windSpeedKmh: 46,
    windChill: -41.2,
    blizzardWarning: false,
    population: {
      summer: 65,
      winter: 25,
      current: 42
    },
    satelliteUplinkMbps: 120,
    powerGridStatus: 'Nominal 100%'
  },
  {
    id: 'st-bharati',
    name: 'Bharati Station (Larsemann Hills)',
    country: 'India (NCPOR)',
    established: '2012',
    coordinates: {
      lat: -69.407,
      lng: 76.191,
      formatted: '69°24′28″S, 76°11′14″E'
    },
    altitude: '35 m',
    currentTemp: -22.1,
    windSpeedKmh: 32,
    windChill: -32.5,
    blizzardWarning: false,
    population: {
      summer: 72,
      winter: 23,
      current: 51
    },
    satelliteUplinkMbps: 250,
    powerGridStatus: 'Nominal 100%'
  },
  {
    id: 'st-himadri',
    name: 'Himadri Arctic Station (Ny-Ålesund)',
    country: 'India (NCPOR / Arctic)',
    established: '2008',
    coordinates: {
      lat: 78.923,
      lng: 11.928,
      formatted: '78°55′24″N, 11°55′41″E'
    },
    altitude: '12 m',
    currentTemp: -14.8,
    windSpeedKmh: 24,
    windChill: -21.0,
    blizzardWarning: false,
    population: {
      summer: 30,
      winter: 8,
      current: 14
    },
    satelliteUplinkMbps: 500,
    powerGridStatus: 'Nominal 100%'
  },
  {
    id: 'st-mcmurdo',
    name: 'McMurdo Station',
    country: 'United States (USAP)',
    established: '1956',
    coordinates: {
      lat: -77.848,
      lng: 166.668,
      formatted: '77°50′53″S, 166°40′06″E'
    },
    altitude: '24 m',
    currentTemp: -31.5,
    windSpeedKmh: 58,
    windChill: -48.3,
    blizzardWarning: true,
    population: {
      summer: 1000,
      winter: 250,
      current: 310
    },
    satelliteUplinkMbps: 350,
    powerGridStatus: 'Secondary Turbines'
  },
  {
    id: 'st-amundsen',
    name: 'Amundsen-Scott South Pole Station',
    country: 'International / USAP',
    established: '1956',
    coordinates: {
      lat: -90.000,
      lng: 0.000,
      formatted: '90°00′00″S, 00°00′00″E'
    },
    altitude: '2,835 m',
    currentTemp: -54.2,
    windSpeedKmh: 28,
    windChill: -68.9,
    blizzardWarning: false,
    population: {
      summer: 150,
      winter: 50,
      current: 48
    },
    satelliteUplinkMbps: 180,
    powerGridStatus: 'Nominal 100%'
  },
  {
    id: 'st-concordia',
    name: 'Concordia Dome C Station',
    country: 'France & Italy (IPEV/PNRA)',
    established: '2005',
    coordinates: {
      lat: -75.099,
      lng: 123.332,
      formatted: '75°05′59″S, 123°19′57″E'
    },
    altitude: '3,233 m',
    currentTemp: -62.8,
    windSpeedKmh: 19,
    windChill: -74.1,
    blizzardWarning: false,
    population: {
      summer: 70,
      winter: 14,
      current: 13
    },
    satelliteUplinkMbps: 95,
    powerGridStatus: 'Battery Backup (78%)'
  }
];
