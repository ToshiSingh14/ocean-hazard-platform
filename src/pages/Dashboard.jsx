import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getIncidents } from '../api/incidentsApi';
import { getReports } from '../api/reportsApi';
import { getAnalytics } from '../api/analyticsApi';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  FileText,
  AlertTriangle,
  Flame,
  Clock,
  MapPin,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard = ({ role }) => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'high', 'active', 'today'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (isPoll = false) => {
    try {
      if (!isPoll) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const [incidentsRes, reportsRes, analyticsRes] = await Promise.all([
        getIncidents(),
        getReports(),
        getAnalytics()
      ]);

      setIncidents(incidentsRes || []);
      setReports(reportsRes || []);
      setAnalytics(analyticsRes || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard intelligence data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // 8 second live polling requirement
    const pollInterval = setInterval(() => {
      fetchData(true);
    }, 8000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filtered incidents based on stat card click
  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'high') return inc.severity === 'high';
    if (activeFilter === 'active') return inc.status === 'active';
    if (activeFilter === 'today') return true; // all recent
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Coastal Hazard Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              Live Feed
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Real-time citizen reports, AI NLP incident clustering & ocean threat assessment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/report"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-950/50 hover:scale-[1.02]"
          >
            <span>Report Coastal Hazard</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchData()} className="text-xs underline hover:text-red-100">
            Retry API
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      {loading ? (
        <SkeletonLoader count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Reports"
            value={analytics?.totals?.reports || reports.length || 0}
            subtitle="Citizen & Agency Submissions"
            icon={FileText}
            iconColor="text-blue-400"
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />

          <StatCard
            title="Active Incidents"
            value={analytics?.totals?.activeIncidents || incidents.filter((i) => i.status === 'active').length || 0}
            subtitle="Clustered Threat Zones"
            icon={AlertTriangle}
            iconColor="text-cyan-400"
            active={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
          />

          <StatCard
            title="High Severity"
            value={analytics?.totals?.highSeverity || incidents.filter((i) => i.severity === 'high').length || 0}
            subtitle="Immediate Action Required"
            icon={Flame}
            iconColor="text-red-400"
            active={activeFilter === 'high'}
            onClick={() => setActiveFilter('high')}
          />

          <StatCard
            title="Reports Today"
            value={analytics?.totals?.reportsToday || 18}
            subtitle="Last 24 Hours Intake"
            icon={Clock}
            iconColor="text-emerald-400"
            active={activeFilter === 'today'}
            onClick={() => setActiveFilter('today')}
          />
        </div>
      )}

      {/* Main Content Grid: Recent Incidents & Intelligence Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Incidents List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                {activeFilter === 'high'
                  ? 'High Severity Incidents'
                  : activeFilter === 'active'
                  ? 'Active Threat Incidents'
                  : activeFilter === 'today'
                  ? 'Today’s Reported Incidents'
                  : 'Recent Coastal Incidents'}
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredIncidents.length}
              </span>
            </div>

            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <SkeletonLoader type="table" count={5} />
          ) : filteredIncidents.length === 0 ? (
            <EmptyState
              title="No Incidents Match Filter"
              message="There are no incidents currently matching the selected filter criteria."
              actionLabel="Reset Filters"
              actionLink="#"
            />
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="group relative p-4 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <HazardIcon type={incident.hazardType} size="lg" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                            {incident.id}
                          </span>
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {incident.location.name}
                          </h3>
                          <SeverityBadge severity={incident.severity} />
                        </div>

                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {incident.reportCount} reports linked
                          </span>
                          <span>•</span>
                          <span>Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
                          <span>•</span>
                          <span>
                            {new Date(incident.lastReportedAt || incident.firstReportedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          incident.verificationStatus === 'verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : incident.verificationStatus === 'false_alarm'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {incident.verificationStatus}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Quick Map Preview & Over Time Trend Chart */}
        <div className="space-y-6">
          {/* Quick Interactive Map Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">GIS Map Intelligence</h3>
              </div>
              <Link
                to="/map"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                Full Screen Map <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Interactive cluster markers, thermal heatmaps, and coastal boundary alerts.
            </p>

            <Link
              to="/map"
              className="block w-full py-8 text-center rounded-xl border border-dashed border-cyan-800/80 bg-slate-950/60 hover:bg-slate-900/90 transition-colors group"
            >
              <MapPin className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">View Geospatial Threat Layer</span>
            </Link>
          </div>

          {/* Small Trend Chart */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">7-Day Incident Trend</h3>
              </div>
              <span className="text-[11px] text-slate-400">Reports / Day</span>
            </div>

            <div className="h-44 w-full">
              {analytics?.overTime ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.overTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Loading trend telemetry...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
