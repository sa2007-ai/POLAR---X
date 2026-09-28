import React from 'react';
import { Radio } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
  rows?: number;
  type?: 'radar' | 'skeleton';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Synchronizing Polar Telemetry...',
  subtext = 'Connecting via Iridium low-latency satellite uplink',
  rows = 4,
  type = 'radar',
  className = ''
}) => {
  if (type === 'skeleton') {
    return (
      <div className={`space-y-3 p-4 bg-slate-900/40 rounded-xl border border-slate-800 ${className}`}>
        <div className="h-6 w-1/3 bg-slate-800 rounded animate-pulse" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center w-20 h-20 mb-4">
        {/* Radar Rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-cyan-400/40" />
        <div className="absolute inset-5 rounded-full border border-sky-400/60" />
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-400/80">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
      </div>

      <p className="text-sm font-semibold text-cyan-300 font-mono tracking-wider">{message}</p>
      {subtext && (
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      )}
    </div>
  );
};
