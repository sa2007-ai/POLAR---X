import React, { useEffect, useState } from 'react';
import {
  CloudSnow,
  Wind,
  Thermometer,
  Eye,
  AlertTriangle,
  Gauge,
  Info
} from 'lucide-react';
import { WeatherSnapshot } from '../../services/weather/weatherTypes';
import { weatherService } from '../../services/weather/weatherService';

interface WeatherIntelligenceCardProps {
  stationName?: string;
  lat?: number;
  lng?: number;
  compact?: boolean;
}

export const WeatherIntelligenceCard: React.FC<WeatherIntelligenceCardProps> = ({
  stationName = 'Maitri Station',
  lat = -70.7667,
  lng = 11.7333,
  compact = false
}) => {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      try {
        const data = await weatherService.getWeatherForStation(stationName, lat, lng);
        if (isMounted) {
          setSnapshot(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load weather:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadWeather();
    const interval = setInterval(() => {
      void loadWeather();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stationName, lat, lng]);

  if (loading && !snapshot) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse text-xs font-mono text-slate-400">
        Querying Antarctic Polar Met Telemetry...
      </div>
    );
  }

  if (!snapshot) return null;

  const riskBadgeColors = {
    LOW: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
    MODERATE: 'bg-amber-950 text-amber-300 border-amber-500/30',
    HIGH: 'bg-orange-950 text-orange-300 border-orange-500/40',
    EXTREME: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSnow className="w-5 h-5 text-cyan-400" />
          <div>
            <h4 className="text-sm font-bold text-white font-sans truncate">{snapshot.stationOrRegion}</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20 font-bold">
                {snapshot.source}
              </span>
              <span>• Updated {new Date(snapshot.timestamp).toUTCString().slice(17, 22)} UTC</span>
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${riskBadgeColors[snapshot.assessment.overallRisk]}`}>
          {snapshot.assessment.overallRisk} RISK
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Temperature */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Air / Wind Chill</span>
          </div>
          <div className="text-sm font-bold text-white">
            {snapshot.temperatureC}°C
            <span className="text-[10px] font-normal text-slate-400 ml-1">
              ({snapshot.apparentTemperatureC}°C)
            </span>
          </div>
        </div>

        {/* Wind */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Wind / Gust</span>
          </div>
          <div className="text-sm font-bold text-white">
            {snapshot.windSpeedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
            <span className="text-[10px] font-normal text-amber-400 ml-1">
              G{snapshot.windGustKmh}
            </span>
          </div>
        </div>

        {/* Visibility */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Visibility</span>
          </div>
          <div className="text-sm font-bold text-white">
            {snapshot.visibilityKm} <span className="text-[10px] font-normal text-slate-400">km</span>
          </div>
        </div>

        {/* Atmospheric Pressure */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pressure</span>
          </div>
          <div className="text-sm font-bold text-white">
            {snapshot.pressureHpa} <span className="text-[10px] font-normal text-slate-400">hPa</span>
          </div>
        </div>
      </div>

      {/* Advisory & Honesty Banner */}
      {!compact && (
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              snapshot.assessment.overallRisk === 'EXTREME' ? 'text-rose-400' : snapshot.assessment.overallRisk === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
            }`} />
            <p className="text-slate-200 text-[11px] leading-relaxed">
              {snapshot.assessment.advisoryText}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span className="italic truncate">{snapshot.assessment.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
