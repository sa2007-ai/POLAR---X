import React, { useState } from 'react';
import { usePolar } from '../../context';
import { PolarStation } from '../../types';
import { Compass, Wind, Thermometer, Radio, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const PolarRadarMap: React.FC = () => {
  const { stations } = usePolar();
  const [selectedStation, setSelectedStation] = useState<PolarStation>(stations[0]);
  const [mapMode, setMapMode] = useState<'antarctic' | 'arctic'>('antarctic');

  // Filter stations based on hemisphere
  const activeStations = stations.filter(s => 
    mapMode === 'antarctic' ? s.coordinates.lat < 0 : s.coordinates.lat > 0
  );

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <span>Polar Mesh Radar & Geospatial Stations</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                LIVE SAT-GRID
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive telemetry monitoring for research stations and active field expeditions
            </p>
          </div>
        </div>

        {/* Hemisphere Toggle */}
        <div className="flex items-center p-1 bg-slate-950/80 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMapMode('antarctic')}
            className={`px-3 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
              mapMode === 'antarctic'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Antarctic (South 90°S)
          </button>
          <button
            type="button"
            onClick={() => setMapMode('arctic')}
            className={`px-3 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
              mapMode === 'arctic'
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Arctic (Ny-Ålesund 78°N)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Map Graphic View */}
        <div className="lg:col-span-7 relative flex items-center justify-center p-4 min-h-[380px] bg-slate-950/70 rounded-xl border border-slate-800/80 overflow-hidden group">
          {/* Subtle Grid Lines and Concentric Circles */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
          
          {/* Radar Circles */}
          <div className="absolute w-80 h-80 rounded-full border border-cyan-500/15" />
          <div className="absolute w-60 h-60 rounded-full border border-cyan-500/20" />
          <div className="absolute w-40 h-40 rounded-full border border-cyan-500/25 border-dashed" />
          <div className="absolute w-20 h-20 rounded-full border border-cyan-500/30" />
          
          {/* Radar Sweep Line */}
          <div className="absolute w-80 h-80 rounded-full overflow-hidden pointer-events-none">
            <div className="w-1/2 h-1/2 origin-bottom-right animate-radar bg-gradient-to-br from-cyan-500/25 via-cyan-500/5 to-transparent rounded-tl-full" />
          </div>

          {/* Coordinate Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/10 pointer-events-none" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/10 pointer-events-none" />

          {/* Polar Center Label */}
          <div className="absolute z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8]" />
            <span className="text-[9px] font-mono text-cyan-400/80 mt-1">
              {mapMode === 'antarctic' ? 'SOUTH POLE 90°S' : 'NORTH POLE 90°N'}
            </span>
          </div>

          {/* Interactive Station Markers */}
          {activeStations.map((st, idx) => {
            const isSelected = selectedStation?.id === st.id;
            // Simulated polar orbital offsets
            const angles = [45, 135, 220, 310, 180, 270];
            const dists = [120, 110, 80, 130, 40, 100];
            const angle = angles[idx % angles.length] * (Math.PI / 180);
            const dist = dists[idx % dists.length];
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStation(st)}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                className={`absolute z-20 flex flex-col items-center group/marker transition-all duration-200 cursor-pointer ${
                  isSelected ? 'scale-125 z-30' : 'hover:scale-110 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {st.blizzardWarning && (
                    <span className="absolute -inset-1.5 rounded-full bg-rose-500/50 animate-ping" />
                  )}
                  {isSelected && (
                    <span className="absolute -inset-2 rounded-full border border-cyan-400/60 animate-polar-pulse" />
                  )}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors shadow-lg ${
                      st.blizzardWarning
                        ? 'bg-rose-950 text-rose-300 border border-rose-500'
                        : isSelected
                        ? 'bg-cyan-500 text-slate-950 border border-white'
                        : 'bg-slate-800 text-cyan-300 border border-slate-600 group-hover/marker:border-cyan-400'
                    }`}
                  >
                    {st.country.includes('India') ? '🇮🇳' : '🇺🇸'}
                  </div>
                </div>
                <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap backdrop-blur-md transition-all ${
                  isSelected ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-slate-900/90 text-slate-300 border border-slate-800'
                }`}>
                  {st.name.split(' ')[0]} ({st.currentTemp}°C)
                </div>
              </button>
            );
          })}

          {/* Compass labels */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500">000° (GRID NORTH)</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500">180° (GRID SOUTH)</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">270° W</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">090° E</span>
        </div>

        {/* Station Telemetry Details Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  {selectedStation.country}
                </span>
                <h4 className="text-lg font-bold text-white font-sans">
                  {selectedStation.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Coordinates: {selectedStation.coordinates.formatted}
                </p>
              </div>

              <StatusBadge
                status={selectedStation.blizzardWarning ? 'BLIZZARD ACTIVE' : 'NOMINAL'}
                variant={selectedStation.blizzardWarning ? 'danger' : 'success'}
                size="sm"
                pulse={selectedStation.blizzardWarning}
              />
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1 font-mono">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ambient Temp</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {selectedStation.currentTemp}°C
                </div>
                <span className="text-[10px] text-cyan-400/80 font-mono">
                  Windchill: {selectedStation.windChill}°C
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1 font-mono">
                  <Wind className="w-3.5 h-3.5 text-sky-400" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {selectedStation.windSpeedKmh} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Alt: {selectedStation.altitude}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1 font-mono">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sat Bandwidth</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {selectedStation.satelliteUplinkMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
                </div>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  Mesh Ping: 42ms
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Station Crew</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">
                  {selectedStation.population.current} <span className="text-xs font-normal text-slate-400">souls</span>
                </div>
                <span className="text-[10px] text-purple-400/80 font-mono">
                  Winter cap: {selectedStation.population.winter}
                </span>
              </div>
            </div>

            {/* Power Grid Status */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Power & Microgrid:</span>
              <span className="font-semibold text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedStation.powerGridStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
