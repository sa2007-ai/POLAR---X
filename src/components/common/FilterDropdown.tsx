import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  label?: string;
  value: string;
  options: (string | FilterOption)[];
  onChange: (value: string) => void;
  icon?: boolean;
  className?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  icon = true,
  className = ''
}) => {
  const normalizedOptions: FilterOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && (
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/80 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-9' : 'pl-3.5'} pr-8 py-2 bg-slate-900/90 hover:bg-slate-900 border border-slate-700/70 focus:border-cyan-400 rounded-lg text-xs font-medium text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/20 appearance-none cursor-pointer`}
      >
        {label && <option value="" disabled>{label}</option>}
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 py-1">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};
