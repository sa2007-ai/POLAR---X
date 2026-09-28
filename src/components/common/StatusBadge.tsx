import React from 'react';

export type StatusVariant = 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'purple' 
  | 'cyan';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  showDot = true,
  pulse = false,
  className = ''
}) => {
  // Auto-detect variant based on common status terms if not explicitly provided
  const getVariant = (): StatusVariant => {
    if (variant) return variant;
    
    const s = status.toLowerCase();
    if (s.includes('active') || s.includes('delivered') || s.includes('adequate') || s.includes('operational') || s.includes('nominal') || s.includes('resolved') || s.includes('completed')) {
      return 'success';
    }
    if (s.includes('warning') || s.includes('low') || s.includes('investigating') || s.includes('delayed') || s.includes('standby') || s.includes('planning') || s.includes('expiring')) {
      return 'warning';
    }
    if (s.includes('critical') || s.includes('catastrophic') || s.includes('danger') || s.includes('severe') || s.includes('emergency') || s.includes('grounded') || s.includes('breakdown') || s.includes('cancelled')) {
      return 'danger';
    }
    if (s.includes('transit') || s.includes('field') || s.includes('staged') || s.includes('air-dropped')) {
      return 'cyan';
    }
    if (s.includes('wintering') || s.includes('medical') || s.includes('customs')) {
      return 'purple';
    }
    return 'neutral';
  };

  const currentVariant = getVariant();

  const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
    success: {
      badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400'
    },
    warning: {
      badge: 'bg-amber-950/70 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400'
    },
    danger: {
      badge: 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/50',
      dot: 'bg-rose-400'
    },
    info: {
      badge: 'bg-sky-950/70 text-sky-300 border-sky-500/30',
      dot: 'bg-sky-400'
    },
    cyan: {
      badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400'
    },
    purple: {
      badge: 'bg-purple-950/70 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400'
    },
    neutral: {
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
      dot: 'bg-slate-400'
    }
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1.5',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-2'
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const { badge, dot } = variantStyles[currentVariant];

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase font-mono ${badge} ${sizeStyles[size]} ${className}`}
    >
      {showDot && (
        <span className="relative flex items-center justify-center">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${dot}`} />
        </span>
      )}
      <span>{status}</span>
    </span>
  );
};
