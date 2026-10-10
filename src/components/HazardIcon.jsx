import React from 'react';
import { Waves, WavesIcon, CloudLightning, Mountain, Anchor, AlertTriangle } from 'lucide-react';

export const hazardMeta = {
  coastal_flooding: {
    label: 'Coastal Flooding',
    icon: Waves,
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-800/60',
    badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50'
  },
  abnormal_waves: {
    label: 'Abnormal Waves',
    icon: WavesIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-950/60',
    border: 'border-blue-800/60',
    badge: 'bg-blue-900/40 text-blue-300 border-blue-700/50'
  },
  storm_surge: {
    label: 'Storm Surge',
    icon: CloudLightning,
    color: 'text-purple-400',
    bg: 'bg-purple-950/60',
    border: 'border-purple-800/60',
    badge: 'bg-purple-900/40 text-purple-300 border-purple-700/50'
  },
  coastal_erosion: {
    label: 'Coastal Erosion',
    icon: Mountain,
    color: 'text-amber-400',
    bg: 'bg-amber-950/60',
    border: 'border-amber-800/60',
    badge: 'bg-amber-900/40 text-amber-300 border-amber-700/50'
  },
  marine_incident: {
    label: 'Marine Incident',
    icon: Anchor,
    color: 'text-rose-400',
    bg: 'bg-rose-950/60',
    border: 'border-rose-800/60',
    badge: 'bg-rose-900/40 text-rose-300 border-rose-700/50'
  }
};

export const HazardIcon = ({ type, showLabel = false, size = 'md', className = '' }) => {
  const meta = hazardMeta[type] || {
    label: type ? type.replace('_', ' ') : 'Hazard',
    icon: AlertTriangle,
    color: 'text-slate-400',
    bg: 'bg-slate-800/60',
    border: 'border-slate-700',
    badge: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const IconComp = meta.icon;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  }[size] || 'w-5 h-5';

  if (showLabel) {
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium ${meta.badge} ${className}`}>
        <IconComp className={`${sizeClasses} ${meta.color}`} />
        <span>{meta.label}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center p-2 rounded-lg border ${meta.bg} ${meta.border} ${className}`}>
      <IconComp className={`${sizeClasses} ${meta.color}`} />
    </div>
  );
};

export default HazardIcon;
