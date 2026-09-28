import React from 'react';

export type CapabilityState =
  | 'LIVE'
  | 'READY'
  | 'SIMULATED'
  | 'CACHED'
  | 'UNAVAILABLE'
  | 'CONFIGURATION_REQUIRED'
  | 'HARDWARE_REQUIRED'
  | 'OFFLINE';

interface CapabilityStatusBadgeProps {
  state: CapabilityState;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelPrefix?: string;
  customText?: string;
  className?: string;
}

export const CapabilityStatusBadge: React.FC<CapabilityStatusBadgeProps> = ({
  state,
  size = 'sm',
  showLabel = true,
  labelPrefix,
  customText,
  className = ''
}) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs shadow-emerald-900/40',
          dot: 'bg-emerald-400',
          pulse: true,
          label: customText || 'LIVE HARDWARE'
        };
      case 'READY':
        return {
          bg: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
          dot: 'bg-teal-400',
          pulse: false,
          label: customText || 'READY'
        };
      case 'SIMULATED':
        return {
          bg: 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-xs shadow-purple-900/30',
          dot: 'bg-purple-400',
          pulse: true,
          label: customText || 'SIMULATED'
        };
      case 'CACHED':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          pulse: false,
          label: customText || 'CACHED (OFFLINE)'
        };
      case 'CONFIGURATION_REQUIRED':
        return {
          bg: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400',
          pulse: false,
          label: customText || 'CONFIG REQUIRED'
        };
      case 'HARDWARE_REQUIRED':
        return {
          bg: 'bg-orange-950/80 text-orange-300 border-orange-500/40',
          dot: 'bg-orange-400',
          pulse: false,
          label: customText || 'HARDWARE REQUIRED'
        };
      case 'OFFLINE':
        return {
          bg: 'bg-slate-900/90 text-slate-300 border-slate-700/60',
          dot: 'bg-slate-500',
          pulse: false,
          label: customText || 'OFFLINE'
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          pulse: false,
          label: customText || 'UNAVAILABLE'
        };
    }
  };

  const config = getBadgeConfig();

  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.5 font-mono gap-1',
    sm: 'text-[10px] px-2 py-0.5 font-mono gap-1.5',
    md: 'text-xs px-2.5 py-1 font-mono gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-mono gap-2'
  };

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <span
      className={`inline-flex items-center rounded border font-semibold tracking-wider uppercase ${config.bg} ${sizeStyles[size]} ${className}`}
      title={`Data Honesty State: ${state}`}
    >
      <span className="relative flex items-center justify-center">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${config.dot}`} />
      </span>
      {showLabel && (
        <span>
          {labelPrefix && <span className="opacity-70 font-normal">{labelPrefix} </span>}
          {config.label}
        </span>
      )}
    </span>
  );
};
