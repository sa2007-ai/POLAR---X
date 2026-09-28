/**
 * POLAR-X Weather Provider Interface
 * Allows seamless switching between Demo Simulation and Real Weather APIs (e.g., Open-Meteo, ECMWF, NOAA).
 */

import { WeatherSnapshot } from './weatherTypes';

export interface WeatherProvider {
  readonly name: string;
  readonly isSimulated: boolean;

  getWeatherForStation(stationName: string, lat: number, lng: number): Promise<WeatherSnapshot>;
  getWeatherForCoordinates(lat: number, lng: number, label?: string): Promise<WeatherSnapshot>;
  getAllStationWeather(): Promise<WeatherSnapshot[]>;
}
