/**
 * POLAR-X Demo Polar Meteorological Provider
 * Provides realistic Antarctic weather simulations with explicit honesty badges.
 */

import { WeatherProvider } from './weatherProvider';
import { WeatherSnapshot, WeatherConditionType } from './weatherTypes';
import { assessWeatherRisk, calculateWindChill } from './weatherRisk';

export class DemoWeatherProvider implements WeatherProvider {
  public readonly name = 'Antarctic Polar Met Simulation Engine';
  public readonly isSimulated = true;

  private stationBaselines: Record<
    string,
    {
      lat: number;
      lng: number;
      baseTemp: number;
      baseWind: number;
      basePressure: number;
      baseVisibility: number;
      condition: WeatherConditionType;
    }
  > = {
    'Maitri Station': {
      lat: -70.7667,
      lng: 11.7333,
      baseTemp: -18,
      baseWind: 42,
      basePressure: 985,
      baseVisibility: 6.5,
      condition: 'Blowing Snow'
    },
    'Bharati Station': {
      lat: -69.4072,
      lng: 76.1953,
      baseTemp: -12,
      baseWind: 28,
      basePressure: 994,
      baseVisibility: 8.0,
      condition: 'Partly Cloudy'
    },
    'Amundsen-Scott South Pole': {
      lat: -90.0,
      lng: 0.0,
      baseTemp: -48,
      baseWind: 36,
      basePressure: 680,
      baseVisibility: 1.2,
      condition: 'Whiteout'
    },
    'Concordia Station (Dome C)': {
      lat: -75.1,
      lng: 123.3333,
      baseTemp: -52,
      baseWind: 22,
      basePressure: 645,
      baseVisibility: 12.0,
      condition: 'Clear'
    },
    'McMurdo Station': {
      lat: -77.8463,
      lng: 166.6682,
      baseTemp: -14,
      baseWind: 55,
      basePressure: 978,
      baseVisibility: 3.5,
      condition: 'Freezing Fog'
    },
    'Princess Elisabeth': {
      lat: -71.95,
      lng: 23.35,
      baseTemp: -22,
      baseWind: 30,
      basePressure: 830,
      baseVisibility: 9.0,
      condition: 'Clear'
    }
  };

  public async getWeatherForStation(
    stationName: string,
    lat: number,
    lng: number
  ): Promise<WeatherSnapshot> {
    const baseline = this.stationBaselines[stationName] || {
      lat,
      lng,
      baseTemp: -24,
      baseWind: 38,
      basePressure: 980,
      baseVisibility: 5.0,
      condition: 'Overcast' as WeatherConditionType
    };

    return this.generateSnapshot(stationName, baseline.lat, baseline.lng, baseline);
  }

  public async getWeatherForCoordinates(
    lat: number,
    lng: number,
    label: string = 'Traverse Coordinate'
  ): Promise<WeatherSnapshot> {
    // Generate realistic Antarctic latitude lapse rate (colder near -90 latitude)
    const polarLatitudeFactor = Math.abs(lat) / 90; // 0.7 to 1.0
    const baseTemp = -10 - polarLatitudeFactor * 38;
    const baseWind = 30 + Math.abs(Math.sin(lat * 10)) * 35;
    const basePressure = 980 - polarLatitudeFactor * 150;
    const baseVisibility = Math.max(0.5, 10 - polarLatitudeFactor * 6);

    const condition: WeatherConditionType =
      baseWind > 60 ? 'Blizzard' : baseTemp < -40 ? 'Whiteout' : baseWind > 35 ? 'Blowing Snow' : 'Partly Cloudy';

    return this.generateSnapshot(label, lat, lng, {
      baseTemp: Math.round(baseTemp),
      baseWind: Math.round(baseWind),
      basePressure: Math.round(basePressure),
      baseVisibility: Math.round(baseVisibility * 10) / 10,
      condition
    });
  }

  public async getAllStationWeather(): Promise<WeatherSnapshot[]> {
    const stations = Object.keys(this.stationBaselines);
    const results = await Promise.all(
      stations.map((st) => this.getWeatherForStation(st, this.stationBaselines[st].lat, this.stationBaselines[st].lng))
    );
    return results;
  }

  private generateSnapshot(
    label: string,
    lat: number,
    lng: number,
    base: {
      baseTemp: number;
      baseWind: number;
      basePressure: number;
      baseVisibility: number;
      condition: WeatherConditionType;
    }
  ): WeatherSnapshot {
    // Controlled deterministic variation based on time
    const minute = new Date().getUTCMinutes();
    const tempVar = Math.sin(minute / 10) * 1.5;
    const windVar = Math.cos(minute / 7) * 4;

    const tempC = Math.round((base.baseTemp + tempVar) * 10) / 10;
    const windSpeedKmh = Math.max(5, Math.round(base.baseWind + windVar));
    const windGustKmh = Math.round(windSpeedKmh * 1.35);
    const apparentTempC = calculateWindChill(tempC, windSpeedKmh);
    const pressureHpa = Math.round(base.basePressure);
    const visibilityKm = base.baseVisibility;
    const condition = base.condition;

    const assessment = assessWeatherRisk(
      tempC,
      windSpeedKmh,
      windGustKmh,
      visibilityKm,
      condition,
      pressureHpa
    );

    return {
      stationOrRegion: label,
      coordinates: { lat, lng },
      timestamp: new Date().toISOString(),
      temperatureC: tempC,
      apparentTemperatureC: apparentTempC,
      windSpeedKmh,
      windGustKmh,
      windDirectionDeg: 165,
      windDirectionCardinal: 'SSE',
      pressureHpa,
      visibilityKm,
      humidityPercent: 78,
      condition,
      uvIndex: 1,
      source: 'SIMULATED',
      isSimulated: true,
      providerName: this.name,
      assessment
    };
  }
}

export const demoWeatherProvider = new DemoWeatherProvider();
