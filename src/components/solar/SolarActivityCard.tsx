import React, { useEffect, useState } from 'react';
import {
  Sun,
  Radio,
  Navigation2,
  Sparkles,
  Info
} from 'lucide-react';
import { SolarActivitySnapshot } from '../../services/solar/solarTypes';
import { solarService } from '../../services/solar/solarService';

export const SolarActivityCard: React.FC = () => {
  const [solar, setSolar] = useState<SolarActivitySnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const loadSolar = async () => {
      try {
        const data = await solarService.getSolarActivity();
        if (isMounted) {
          setSolar(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load solar telemetry:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSolar();
    const interval = setInterval(() => {
      void loadSolar();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && !solar) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse text-xs font-mono text-slate-400">
        Tracking Polar Space Weather & Ionospheric Kp...
      </div>
    );
  }

  if (!solar) return null;

  const stormBadgeColors = {
    QUIET: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
    UNSETTLED: 'bg-cyan-950 text-cyan-300 border-cyan-500/30',
    ACTIVE: 'bg-amber-950 text-amber-300 border-amber-500/30',
    MINOR_STORM: 'bg-orange-950 text-orange-300 border-orange-500/40',
    MAJOR_STORM: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse',
    SEVERE_STORM: 'bg-purple-950 text-purple-300 border-purple-500/50 animate-pulse'
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
          <div>
            <h4 className="text-sm font-bold text-white font-sans">Geomagnetic & Solar Activity</h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-amber-500/20 font-bold">
                {solar.source}
              </span>
              <span>• Kp Index: <strong className="text-cyan-300">{solar.kpIndex}</strong></span>
            </div>
          </div>
        </div>

        {/* Storm Level Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${stormBadgeColors[solar.stormLevel]}`}>
          {solar.stormLevel.replace('_', ' ')}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* HF Radio Status */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>HF Radio Link</span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {solar.advisory.hfRadioPropagation}
          </div>
        </div>

        {/* GPS Drift */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Navigation2 className="w-3.5 h-3.5 text-sky-400" />
            <span>GPS Scintillation</span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {solar.advisory.gpsAccuracyRisk}
          </div>
        </div>

        {/* Aurora Likelihood */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Aurora Oval</span>
          </div>
          <div className="text-xs font-bold text-emerald-400">
            {solar.auroraVisibilityLikelihoodPercent}%
          </div>
        </div>
      </div>

      {/* Advisory Text */}
      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {solar.advisory.summary}
        </p>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1 border-t border-slate-800">
          <Info className="w-3 h-3 flex-shrink-0" />
          <span className="italic truncate">{solar.disclaimer}</span>
        </div>
      </div>
    </div>
  );
};
