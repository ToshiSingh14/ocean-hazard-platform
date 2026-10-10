import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncidentById, updateIncidentStatus } from '../api/incidentsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  ArrowLeft,
  FileText,
  UserCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export const IncidentDetails = ({ role }) => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getIncidentById(id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetails();
    const timer = setInterval(() => fetchIncidentDetails(), 8000);
    return () => clearInterval(timer);
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      setUpdateMsg(null);
      const updated = await updateIncidentStatus(id, newStatus);
      setData((prev) => ({
        ...prev,
        incident: updated
      }));
      setUpdateMsg(`Verification status updated to "${newStatus}"`);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader count={1} />
        <SkeletonLoader type="table" count={4} />
      </div>
    );
  }

  if (error || !data?.incident) {
    return (
      <div className="space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <EmptyState
          title="Incident Not Found"
          message={error || `Incident ID "${id}" could not be retrieved from the API.`}
          actionLabel="Return to Live Map"
          actionLink="/map"
        />
      </div>
    );
  }

  const { incident, reports } = data;

  // Convert GeoJSON [lng, lat] centroid to Leaflet [lat, lng]
  const leafletCentroid = [incident.location.centroid[1], incident.location.centroid[0]];

  // Generate timeline chart dataset from related reports
  const timelineData = reports.map((r, i) => ({
    time: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    count: i + 1,
    severity: r.severity
  }));

  return (
    <div className="space-y-6">
      {/* Top Navigation Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents Feed</span>
        </Link>

        {updateMsg && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
            {updateMsg}
          </span>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <HazardIcon type={incident.hazardType} size="xl" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-extrabold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                  {incident.id}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-100">{incident.location.name}</h1>
                <SeverityBadge severity={incident.severity} />
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Radius: {incident.location.radiusMeters}m
                </span>
                <span>•</span>
                <span>AI Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
                <span>•</span>
                <span>Total Linked Reports: {reports.length || incident.reportCount}</span>
              </div>
            </div>
          </div>

          {/* Admin Verification Control */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Verification Status
              </span>
              {role !== 'admin' && (
                <span className="text-[10px] text-slate-500 lowercase">(read-only mode)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  incident.verificationStatus === 'verified'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : incident.verificationStatus === 'false_alarm'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {incident.verificationStatus}
              </span>
            </div>

            {/* Admin Action Buttons (Visible for Admin role only) */}
            {role === 'admin' && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange('verified')}
                  disabled={updating || incident.verificationStatus === 'verified'}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>

                <button
                  onClick={() => handleStatusChange('false_alarm')}
                  disabled={updating || incident.verificationStatus === 'false_alarm'}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-xs border border-rose-700 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>False Alarm</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Chart & Location Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports Arrival Timeline Chart */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Reports Arrival Timeline</span>
              </div>
              <span className="text-[11px] text-slate-400">Cumulative Intake</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncident" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorIncident)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini GIS Map Pin Location */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Incident Centroid</span>
            </div>

            <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-800">
              <MapContainer
                center={leafletCentroid}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={leafletCentroid} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Associated Citizen & Field Reports</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {reports.length}
            </span>
          </h2>
        </div>

        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {report.id}
                  </span>
                  <SeverityBadge severity={report.severity} />
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {report.location.raw || report.location.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                  <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    Source: {report.source}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                "{report.text}"
              </p>

              {report.photoUrl && (
                <div className="pt-1">
                  <img
                    src={report.photoUrl}
                    alt="Report Attachment"
                    className="w-48 h-32 object-cover rounded-lg border border-slate-800 shadow-md"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
