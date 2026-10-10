import React, { useState, useEffect } from 'react';
import { getAnalytics } from '../api/analyticsApi';
import { getHotspots } from '../api/hotspotsApi';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  MapPin,
  Flame,
  FileText,
  AlertTriangle,
  Filter,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const HAZARD_COLORS = {
  coastal_flooding: '#06b6d4',
  abnormal_waves: '#3b82f6',
  storm_surge: '#a855f7',
  coastal_erosion: '#f59e0b',
  marine_incident: '#f43f5e'
};

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#eab308'
};

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [hazardFilter, setHazardFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('7d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [analyticsRes, hotspotsRes] = await Promise.all([
        getAnalytics({ hazardType: hazardFilter, timeRange: timeFilter }),
        getHotspots()
      ]);
      setData(analyticsRes);
      setHotspots(hotspotsRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [hazardFilter, timeFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader count={3} />
        <SkeletonLoader type="table" count={4} />
      </div>
    );
  }

  // Formatting datasets for Recharts
  const hazardChartData = Object.entries(data?.byHazardType || {}).map(([key, value]) => ({
    name: key.replace('_', ' '),
    rawKey: key,
    count: value,
    color: HAZARD_COLORS[key] || '#94a3b8'
  }));

  const severityChartData = (data?.severityDistribution || [
    { severity: 'high', count: 9, percentage: 24 },
    { severity: 'medium', count: 18, percentage: 47 },
    { severity: 'low', count: 11, percentage: 29 }
  ]).map((item) => ({
    name: `${item.severity.toUpperCase()} (${item.percentage}%)`,
    count: item.count,
    color: SEVERITY_COLORS[item.severity] || '#64748b'
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Analytics & Intelligence Command</h1>
            <p className="text-xs text-slate-400">
              Aggregated coastal metrics, hazard type breakdown, hotspots & temporal growth velocity
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={hazardFilter}
              onChange={(e) => setHazardFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Hazard Types</option>
              <option value="coastal_flooding">Coastal Flooding</option>
              <option value="abnormal_waves">Abnormal Waves</option>
              <option value="storm_surge">Storm Surge</option>
              <option value="coastal_erosion">Coastal Erosion</option>
              <option value="marine_incident">Marine Incident</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Ingested Reports"
          value={data?.totals?.reports || 412}
          subtitle="Citizen & Telemetry Submissions"
          icon={FileText}
          iconColor="text-blue-400"
        />

        <StatCard
          title="Active Threat Incidents"
          value={data?.totals?.incidents || 38}
          subtitle="Clustered GIS Hotspots"
          icon={AlertTriangle}
          iconColor="text-cyan-400"
        />

        <StatCard
          title="High Severity Count"
          value={data?.totals?.highSeverity || 9}
          subtitle="Immediate Priority Level"
          icon={Flame}
          iconColor="text-red-400"
        />
      </div>

      {/* Main Charts Grid 1: Hazard Distribution & Reports Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Hazard Type (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">Reports by Hazard Type</h2>
            </div>
            <span className="text-xs text-slate-400">Total volume</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hazardChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {hazardChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Over Time (Line / Area Chart) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-slate-100">Temporal Report Ingestion</h2>
            </div>
            <span className="text-xs text-slate-400">Daily intake trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.overTime || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ fill: '#a855f7', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts Grid 2: Incidents by Region & Severity Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents by Region (Bar Chart / Table) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100">Incidents Distribution by Region</h2>
            </div>
            <span className="text-xs text-slate-400">Ranked by volume</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byRegion || []} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="region" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-slate-100">Severity Breakdown</h2>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityChartData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 3: Top Hotspots Ranked & Incident Growth Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Hotspots Ranked List */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Top Ranked Coastal Hotspots</h2>
            </div>
            <span className="text-xs text-slate-400">GIS Bounding Radius</span>
          </div>

          <div className="space-y-3">
            {hotspots.map((h, index) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{h.regionName || `Hotspot ${h.id}`}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Dominant: <strong className="text-slate-200 capitalize">{h.dominantHazard.replace('_', ' ')}</strong></span>
                      <span>•</span>
                      <span>Radius: {h.boundingRadiusMeters / 1000} km</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-cyan-400">{h.incidentCount} Incidents</span>
                  <div className="mt-1">
                    <SeverityBadge severity={h.maxSeverity} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Growth Rate (Reports / Hour for Active Incidents) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-slate-100">Active Incident Growth Rate</h2>
            </div>
            <span className="text-xs text-slate-400">Reports / Hour Velocity</span>
          </div>

          <div className="space-y-3">
            {(
              data?.incidentGrowthRates || [
                { incidentId: 'PURI-042', region: 'Puri', reportsPerHour: 6.2, trend: 'up' },
                { incidentId: 'CHENNAI-031', region: 'Chennai', reportsPerHour: 4.8, trend: 'up' },
                { incidentId: 'PARADIP-018', region: 'Paradip', reportsPerHour: 3.5, trend: 'stable' },
                { incidentId: 'VIZAG-012', region: 'Visakhapatnam', reportsPerHour: 2.1, trend: 'up' },
                { incidentId: 'DIGHA-009', region: 'Digha', reportsPerHour: 1.0, trend: 'down' }
              ]
            ).map((item) => (
              <div
                key={item.incidentId}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {item.incidentId}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{item.region} Coast</h3>
                    <span className="text-xs text-slate-400">Velocity Tracker</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-extrabold text-slate-100">
                    <span>{item.reportsPerHour}</span>
                    <span className="text-xs text-slate-400">rpt/hr</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      item.trend === 'up' ? 'text-red-400' : item.trend === 'down' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    Trend: {item.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
