import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-400',
  bgColor = 'bg-slate-900/80',
  borderColor = 'border-slate-800',
  active = false,
  onClick,
  trend,
  className = ''
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden p-5 rounded-xl border backdrop-blur-md transition-all duration-200 ${
        active
          ? 'border-cyan-500 bg-slate-800/90 shadow-lg shadow-cyan-950/50 scale-[1.02]'
          : `${bgColor} ${borderColor} hover:border-slate-700 hover:bg-slate-800/60`
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {value !== undefined && value !== null ? value : '—'}
            </span>
            {trend && (
              <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-lg bg-slate-800/90 border border-slate-700/60 ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {onClick && (
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-cyan-400 font-medium group-hover:text-cyan-300">
          <span>Filter incidents</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
