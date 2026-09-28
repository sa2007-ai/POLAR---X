import React from 'react';
import { LucideIcon, Compass } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon = Compass,
  badge,
  breadcrumbs,
  children
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between border-b border-slate-800/80 pb-5">
      <div className="space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <span className="text-slate-600">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-cyan-400 font-medium' : 'hover:text-slate-200'}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-sans">
                {title}
              </h1>
              {badge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 sm:self-end md:self-auto">
          {children}
        </div>
      )}
    </div>
  );
};
