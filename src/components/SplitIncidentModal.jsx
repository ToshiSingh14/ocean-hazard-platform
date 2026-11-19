import React, { useState, useEffect } from 'react';
import { Scissors, X, AlertCircle, Loader2, ArrowRight, FileText, MapPin } from 'lucide-react';
import { getIncidentById } from '../api/incidentsApi';
import HazardIcon from './HazardIcon';
import SeverityBadge from './SeverityBadge';

export const SplitIncidentModal = ({ isOpen, onClose, incident, onSplitSuccess }) => {
  const [reports, setReports] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newHazardType, setNewHazardType] = useState('');
  const [fetchingReports, setFetchingReports] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !incident) return;

    setSelectedReportIds([]);
    setError(null);
    setNewLocationName('');
    setNewHazardType(incident.hazardType || 'coastal_flooding');

    const fetchReports = async () => {
      setFetchingReports(true);
      try {
        const id = incident.id || incident.customId;
        const res = await getIncidentById(id);
        const repList = res?.reports || [];
        setReports(repList);
      } catch (err) {
        setError(err.message || 'Failed to load constituent reports');
      } finally {
        setFetchingReports(false);
      }
    };

    fetchReports();
  }, [isOpen, incident]);

  if (!isOpen || !incident) return null;

  const handleToggleReport = (rId) => {
    setSelectedReportIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedReportIds.length === 0) {
      setError('Please select at least one report to split into a new incident.');
      return;
    }

    if (selectedReportIds.length >= reports.length) {
      setError('Cannot extract all reports. At least one report must remain in the original incident.');
      return;
    }

    setLoading(true);
    try {
      const sourceId = incident.id || incident.customId;
      await onSplitSuccess({
        sourceIncidentId: sourceId,
        reportIdsToExtract: selectedReportIds,
        newIncidentLocationName: newLocationName.trim() || undefined,
        newHazardType: newHazardType || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to split incident');
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
          <div className="p-3 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Split Incident Cluster: {incident.id || incident.customId}
            </h2>
            <p className="text-xs text-slate-400">
              Carve out distinct reports to spawn a new, independently tracked incident
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
          {/* Step 1: Select Reports to Extract */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>1. Select Reports to Extract ({reports.length} total in cluster)</span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {selectedReportIds.length} of {reports.length} selected
              </span>
            </label>

            {fetchingReports ? (
              <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Loading constituent reports...</span>
              </div>
            ) : reports.length < 2 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
                This incident only has {reports.length} report. Incidents must contain at least 2 reports to be split.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
                {reports.map((rep) => {
                  const repId = rep.id || rep.customId;
                  const isChecked = selectedReportIds.includes(repId);
                  return (
                    <label
                      key={repId}
                      className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-800/60'
                          : 'bg-slate-900 border-slate-800/80 hover:bg-slate-850'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleReport(repId)}
                        className="mt-1 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-200">{repId}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(rep.createdAt || Date.now()).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">{rep.text}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {rep.location?.name || 'Coastal Area'}
                          </span>
                          <span>•</span>
                          <span className="capitalize text-slate-300">
                            {rep.hazard?.type || rep.hazardType}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: New Incident Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                2. New Incident Location Name
              </label>
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="e.g. North Beach Sector B"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Hazard Type Category
              </label>
              <select
                value={newHazardType}
                onChange={(e) => setNewHazardType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="coastal_flooding">Coastal Flooding</option>
                <option value="abnormal_waves">Abnormal Waves</option>
                <option value="storm_surge">Storm Surge</option>
                <option value="coastal_erosion">Coastal Erosion</option>
                <option value="marine_incident">Marine Incident</option>
              </select>
            </div>
          </div>

          {/* Split Preview */}
          {selectedReportIds.length > 0 && selectedReportIds.length < reports.length && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-1 text-slate-300">
              <div className="font-semibold text-cyan-300">Partition Preview:</div>
              <div>
                • Original <strong className="font-mono">{incident.id || incident.customId}</strong> will retain{' '}
                <strong className="text-cyan-400">{reports.length - selectedReportIds.length}</strong> reports.
              </div>
              <div>
                • Brand New Incident cluster will be spawned with{' '}
                <strong className="text-cyan-400">{selectedReportIds.length}</strong> reports.
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
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
              disabled={
                loading ||
                fetchingReports ||
                selectedReportIds.length === 0 ||
                selectedReportIds.length >= reports.length
              }
              className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-cyan-950/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Splitting Incident...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Execute Split</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitIncidentModal;
