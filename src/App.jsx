import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReportSubmission from './pages/ReportSubmission';
import MapPage from './pages/Map';
import IncidentDetails from './pages/IncidentDetails';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import { Waves } from 'lucide-react';

export function App() {
  // Citizen/Admin role state (default: admin for demonstration)
  const [role, setRole] = useState('admin');

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
        {/* Top Navbar */}
        <Navbar role={role} onToggleRole={setRole} />

        {/* Main Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard role={role} />} />
            <Route path="/report" element={<ReportSubmission />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/incidents/:id" element={<IncidentDetails role={role} />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin role={role} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">Ocean Hazard Reporting & Coastal Incident Intelligence</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Contract Standard v1.0 • GeoJSON [lng, lat] format • Polling telemetry enabled
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
