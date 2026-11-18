import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, updateIncidentStatus } from '../api/incidentsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
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
  Lock,
  LogIn
} from 'lucide-react';

export const Admin = ({ role }) => {
  const { isAdmin, setIsLoginModalOpen, user } = useAuth();
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

  if (role !== 'admin' || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Admin Clearance Required</h2>
        <p className="text-sm text-slate-400">
          You must be authenticated with valid Administrator JWT credentials to access incident verification and moderation controls.
        </p>
        <div className="pt-2">
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-md shadow-amber-950/40"
          >
            <LogIn className="w-4 h-4" />
            <span>Login as Administrator</span>
          </button>
        </div>
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

        {/* Admin Clearance & Quick Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Operator: {user?.name || 'Administrator'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-bold">
            {unverifiedList.length} Pending Verification
          </div>
        </div>
      </div>

      {/* Global Alerts / Banners */}
      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            ✕
          </button>
        </div>
      )}

      {/* Queue Content */}
      {loading && incidents.length === 0 ? (
        <SkeletonLoader count={4} type="table" />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Pending Moderation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Requires Verification</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                  {unverifiedList.length}
                </span>
              </h2>
            </div>

            {unverifiedList.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up!"
                description="No pending incidents in the moderation queue requiring verification."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {unverifiedList.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <HazardIcon type={inc.hazardType} size="sm" />
                        <span className="font-mono text-xs font-bold text-slate-300">{inc.id}</span>
                        <SeverityBadge severity={inc.severity} />
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
                          Pending Review
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inc.location?.name || inc.locationName || 'Coastal Area'}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <GitMerge className="w-3 h-3 text-cyan-400" />
                          <span>{inc.reportCount || 1} aggregated reports</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(inc.lastReportedAt || Date.now()).toLocaleTimeString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Moderation Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                        title="View Detailed Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Inspect</span>
                      </Link>

                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'false_alarm')}
                        disabled={updatingId === inc.id}
                        className="px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/80 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss False Alarm</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(inc.id, 'verified')}
                        disabled={updatingId === inc.id}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-950/40 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Confirm & Verify</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Recently Reviewed History */}
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <h2 className="text-base font-bold text-slate-100">Reviewed / Closed Incidents</h2>
            <div className="grid grid-cols-1 gap-2">
              {reviewedList.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <HazardIcon type={inc.hazardType} size="xs" />
                    <span className="font-mono text-slate-400 font-semibold">{inc.id}</span>
                    <span className="text-slate-200">{inc.location?.name || inc.locationName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        inc.verificationStatus === 'verified'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {inc.verificationStatus.replace('_', ' ')}
                    </span>
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="text-slate-400 hover:text-cyan-400 font-semibold ml-2"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
