import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, updateIncidentStatus } from '../api/incidentsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitMerge,
  ExternalLink,
  MapPin,
  Clock,
  UserCheck,
  Lock
} from 'lucide-react';

export const Admin = ({ role }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchIncidentsForReview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getIncidents();
      setIncidents(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsForReview();
    const timer = setInterval(() => fetchIncidentsForReview(), 8000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      setActionMsg(null);
      await updateIncidentStatus(id, status);
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, verificationStatus: status } : inc))
      );
      setActionMsg(`Incident ${id} marked as "${status}"`);
    } catch (err) {
      setError(err.message || 'Failed to update verification status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter incidents needing review (unverified first)
  const unverifiedList = incidents.filter((inc) => inc.verificationStatus === 'unverified');
  const reviewedList = incidents.filter((inc) => inc.verificationStatus !== 'unverified');

  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Admin Clearance Required</h2>
        <p className="text-sm text-slate-400">
          You are currently in <strong className="text-slate-200">Citizen Role</strong>. Switch to <strong className="text-amber-300">Admin Role</strong> using the toggle switch in the top header navbar to access incident verification and moderation controls.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-100">Moderation & Verification Queue</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verify pending citizen incidents, dismiss false alarms & manage threat clusters
            </p>
          </div>
        </div>

        {actionMsg && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/90 px-3.5 py-1.5 rounded-xl border border-emerald-800">
            {actionMsg}
          </span>
        )}
      </div>

      {/* Main Review List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Incidents Awaiting Review ({unverifiedList.length})</span>
          </h2>
        </div>

        {loading ? (
          <SkeletonLoader count={3} />
        ) : unverifiedList.length === 0 ? (
          <EmptyState
            title="Queue Clear — No Pending Reviews"
            message="All reported incidents have been reviewed and verified by the moderation team."
            actionLabel="View Dashboard"
            actionLink="/"
          />
        ) : (
          <div className="space-y-4">
            {unverifiedList.map((incident) => (
              <div
                key={incident.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 hover:border-amber-500/40 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <HazardIcon type={incident.hazardType} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          {incident.id}
                        </span>
                        <h3 className="font-bold text-base text-slate-100">{incident.location.name}</h3>
                        <SeverityBadge severity={incident.severity} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        First reported: {new Date(incident.firstReportedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/incidents/${incident.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-cyan-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                    >
                      <span>View Details</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Report Count</span>
                    <span className="font-extrabold text-slate-200">{incident.reportCount} reports</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">AI Confidence</span>
                    <span className="font-extrabold text-cyan-400">{(incident.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Verification</span>
                    <span className="font-bold text-amber-400 capitalize">{incident.verificationStatus}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-semibold">Radius</span>
                    <span className="font-bold text-slate-300">{incident.location.radiusMeters} meters</span>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateStatus(incident.id, 'verified')}
                      disabled={updatingId === incident.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-md transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Incident</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(incident.id, 'false_alarm')}
                      disabled={updatingId === incident.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Mark False Alarm</span>
                    </button>
                  </div>

                  {/* Disabled Merge / Split Button with Tooltip */}
                  <div className="relative group">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold border border-slate-700/60 cursor-not-allowed opacity-60"
                    >
                      <GitMerge className="w-4 h-4" />
                      <span>Merge / Split Clusters</span>
                    </button>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 text-slate-200 text-[11px] font-bold px-2.5 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-30">
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previously Reviewed Incidents Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-slate-300 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>Recently Moderated Incidents ({reviewedList.length})</span>
        </h2>

        <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          {reviewedList.map((inc) => (
            <div key={inc.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-cyan-400">{inc.id}</span>
                <span className="text-xs font-semibold text-slate-200">{inc.location.name}</span>
                <SeverityBadge severity={inc.severity} />
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded capitalize ${
                    inc.verificationStatus === 'verified'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {inc.verificationStatus}
                </span>

                <Link to={`/incidents/${inc.id}`} className="text-xs text-slate-400 hover:text-cyan-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
