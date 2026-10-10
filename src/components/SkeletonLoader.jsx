import React from 'react';

export const SkeletonLoader = ({ type = 'card', count = 3, className = '' }) => {
  const items = Array.from({ length: count });

  if (type === 'table') {
    return (
      <div className={`w-full divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}>
        <div className="h-6 w-full bg-slate-800/80 rounded animate-pulse mb-4" />
        {items.map((_, i) => (
          <div key={i} className="py-3 flex items-center justify-between gap-4">
            <div className="h-4 w-1/6 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-1/5 bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-1/6 bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'map') {
    return (
      <div className={`w-full h-80 rounded-xl border border-slate-800 bg-slate-900/90 flex flex-col items-center justify-center p-6 animate-pulse ${className}`}>
        <div className="w-12 h-12 rounded-full bg-slate-800 mb-3" />
        <div className="h-4 w-48 bg-slate-800 rounded mb-2" />
        <div className="h-3 w-32 bg-slate-800/60 rounded" />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${Math.min(count, 4)} gap-4 ${className}`}>
      {items.map((_, i) => (
        <div key={i} className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="w-8 h-8 rounded-lg bg-slate-800" />
          </div>
          <div className="h-8 w-16 bg-slate-800 rounded" />
          <div className="h-3 w-36 bg-slate-800/60 rounded" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
