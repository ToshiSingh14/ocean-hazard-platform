import React, { useState } from 'react';
import { GitMerge, X, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import HazardIcon from './HazardIcon';
import SeverityBadge from './SeverityBadge';

export const MergeIncidentsModal = ({ isOpen, onClose, incidents = [], onMergeSuccess }) => {
  const [primaryId, setPrimaryId] = useState('');
  const [selectedSecondaryIds, setSelectedSecondaryIds] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleToggleSecondary = (id) => {
    setSelectedSecondaryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const primaryIncident = incidents.find((i) => (i.id || i.customId) === primaryId);
  const secondaryIncidents = incidents.filter((i) =>
    selectedSecondaryIds.includes(i.id || i.customId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!primaryId) {
      setError('Please select a primary incident to absorb the cluster.');
      return;
    }
    if (selectedSecondaryIds.length === 0) {
      setError('Please select at least one secondary incident to merge.');
      return;
    }

    setLoading(true);
    try {
      await onMergeSuccess({
        primaryIncidentId: primaryId,
        secondaryIncidentIds: selectedSecondaryIds,
        resolutionNote: note
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to merge incidents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/80">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Merge Incident Clusters</h2>
            <p className="text-xs text-slate-400">
              Combine overlapping or fragmented incidents into a unified primary cluster
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Primary Incident */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              1. Select Primary Incident (Retained)
            </label>
            <select
              value={primaryId}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryId(val);
                setSelectedSecondaryIds((prev) => prev.filter((id) => id !== val));
              }}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="">-- Choose Primary Incident --</option>
              {incidents.map((inc) => {
                const incId = inc.id || inc.customId;
                return (
                  <option key={incId} value={incId}>
                    {incId} • {inc.location?.name || inc.locationName} ({inc.hazardType} • {inc.reportCount || 1} reports)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Step 2: Select Secondary Incidents */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>2. Select Secondary Incidents to Merge (Absorbed & Closed)</span>
              <span className="text-[11px] text-purple-400 font-mono">
                {selectedSecondaryIds.length} selected
              </span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-850">
              {incidents
                .filter((inc) => (inc.id || inc.customId) !== primaryId)
                .map((inc) => {
                  const incId = inc.id || inc.customId;
                  const isChecked = selectedSecondaryIds.includes(incId);
                  return (
                    <label
                      key={incId}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? 'bg-purple-950/40 border border-purple-800/60' : 'hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSecondary(incId)}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <HazardIcon type={inc.hazardType} size="xs" />
                        <div>
                          <div className="font-semibold text-xs text-slate-200">{incId}</div>
                          <div className="text-[11px] text-slate-400">
                            {inc.location?.name || inc.locationName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={inc.severity} />
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {inc.reportCount || 1} reports
                        </span>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Optional Resolution Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              3. Resolution / Audit Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Merged contiguous beach flooding into single incident cluster"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Merge Preview Summary */}
          {primaryIncident && selectedSecondaryIds.length > 0 && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-1.5">
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <span>Resulting Cluster Preview:</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-mono font-bold">{primaryId}</span>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Will aggregate approximately{' '}
                  <strong className="text-purple-300">
                    {(primaryIncident.reportCount || 1) +
                      secondaryIncidents.reduce((sum, s) => sum + (s.reportCount || 1), 0)}{' '}
                    total reports
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !primaryId || selectedSecondaryIds.length === 0}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Merging Clusters...</span>
                </>
              ) : (
                <>
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Confirm Merge</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MergeIncidentsModal;
