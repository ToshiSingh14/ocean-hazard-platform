import React from 'react';

export const SeverityBadge = ({ severity, className = '' }) => {
  const normSev = (severity || 'low').toLowerCase();

  const config = {
    high: {
      bg: 'bg-red-950/70',
      border: 'border-red-500/50',
      text: 'text-red-400',
      dot: 'bg-red-500',
      label: 'High Severity',
    },
    medium: {
      bg: 'bg-orange-950/70',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      dot: 'bg-orange-500',
      label: 'Medium Severity',
    },
    low: {
      bg: 'bg-amber-950/70',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: 'Low Severity',
    },
  };

  const current = config[normSev] || config.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-xs ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${current.dot}`} />
      {current.label}
    </span>
  );
};

export default SeverityBadge;
