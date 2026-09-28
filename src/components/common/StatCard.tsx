import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  variant?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'cyan',
  onClick,
  className = ''
}) => {
  const variantMap = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      bar: 'bg-gradient-to-r from-cyan-500 to-sky-400'
    },
    blue: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
      bar: 'bg-gradient-to-r from-sky-500 to-blue-500'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-400'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      bar: 'bg-gradient-to-r from-amber-500 to-orange-400'
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      bar: 'bg-gradient-to-r from-rose-500 to-red-400'
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      bar: 'bg-gradient-to-r from-purple-500 to-indigo-400'
    }
  };

  const style = variantMap[variant];

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800/80 p-5 backdrop-blur-md transition-all duration-300 ${style.border} ${style.glow} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Subtle top indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">{value}</span>
          </div>
        </div>

        <div className={`flex items-center justify-center w-11 h-11 rounded-lg border p-2 transition-transform duration-300 group-hover:scale-110 ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-800/60 pt-3">
          {subtitle && (
            <span className="text-slate-400 font-medium truncate max-w-[180px]">{subtitle}</span>
          )}
          {trend && (
            <div
              className={`inline-flex items-center gap-1 font-mono font-medium ${
                trend.isNeutral
                  ? 'text-slate-400'
                  : trend.isPositive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {trend.isNeutral ? (
                <Minus className="w-3.5 h-3.5" />
              ) : trend.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.label && <span className="text-slate-500 ml-0.5">{trend.label}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
