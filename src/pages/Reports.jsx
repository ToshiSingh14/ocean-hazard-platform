import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReports } from '../api/reportsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import {
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Clock,
  RefreshCw
} from 'lucide-react';

export const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [hazardFilter, setHazardFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReports({
        search,
        hazardType: hazardFilter,
        severity: severityFilter
      });
      setReports(res || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
    const timer = setInterval(() => fetchReportsData(), 8000);
    return () => clearInterval(timer);
  }, [search, hazardFilter, severityFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, hazardFilter, severityFilter]);

  const totalPages = Math.ceil(reports.length / pageSize) || 1;
  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-950 text-blue-400 border border-blue-800">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Citizen Reports Log</h1>
            <p className="text-xs text-slate-400">
              Raw intake table of ocean hazard observations, location extractions & confidence scores
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchReportsData()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report text, ID, or location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Hazard & Severity Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table View */}
      {loading ? (
        <SkeletonLoader type="table" count={8} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Reports Ingested"
          message="No citizen reports matched your search term or filter selection."
          actionLabel="Submit First Report"
          actionLink="/report"
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Report ID & Time</th>
                <th className="py-3.5 px-4">Hazard Classification</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">NLP Confidence</th>
                <th className="py-3.5 px-4 text-right">Clustered Incident</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {paginatedReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                  {/* Report ID & Time */}
                  <td className="py-4 px-4">
                    <div className="font-mono font-bold text-cyan-400">{r.id}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(r.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  {/* Hazard Classification */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <HazardIcon type={r.hazard?.type} size="sm" />
                      <span className="font-semibold text-slate-100 capitalize">
                        {r.hazard?.type ? r.hazard.type.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xs italic">
                      "{r.text}"
                    </p>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4">
                    <div className="font-semibold text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {r.location?.name || 'Coastal Point'}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block max-w-xs">
                      {r.location?.raw}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-4 px-4">
                    <SeverityBadge severity={r.severity} />
                  </td>

                  {/* Confidence */}
                  <td className="py-4 px-4 font-mono font-bold text-slate-300">
                    {r.hazard?.confidence ? `${(r.hazard.confidence * 100).toFixed(0)}%` : '—'}
                  </td>

                  {/* Incident Link */}
                  <td className="py-4 px-4 text-right">
                    {r.incidentId ? (
                      <Link
                        to={`/incidents/${r.incidentId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800"
                      >
                        <span>{r.incidentId}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-slate-500 italic">Unclustered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, reports.length)} of{' '}
              {reports.length} reports
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
