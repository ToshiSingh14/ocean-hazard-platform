import React from 'react';
import { AlertCircle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  title = 'No incidents found',
  message = 'No reports match your selected criteria. Submit a new report or adjust your search filters.',
  actionLabel = 'Submit New Report',
  actionLink = '/report',
  icon: Icon = AlertCircle,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm ${className}`}>
      <div className="p-4 rounded-full bg-slate-800/80 text-cyan-400 border border-slate-700/60 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-200">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 max-w-md">{message}</p>

      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-cyan-950/40"
        >
          <PlusCircle className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
