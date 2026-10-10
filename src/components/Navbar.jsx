import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Waves,
  LayoutDashboard,
  MapPin,
  BarChart3,
  FileText,
  ShieldCheck,
  PlusCircle,
  Radio,
  UserCheck,
  User
} from 'lucide-react';
import { USE_MOCKS } from '../config';

export const Navbar = ({ role, onToggleRole }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Live Map', icon: MapPin },
    { to: '/report', label: 'Report Hazard', icon: PlusCircle, highlight: true },
    { to: '/reports', label: 'Reports Log', icon: FileText },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck, badge: 'Admin' }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-slate-950 shadow-md shadow-cyan-900/50 group-hover:scale-105 transition-transform">
              <Waves className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-100 tracking-tight">
                  AquaPulse
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  Coastal Intel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Ocean Hazard Intelligence Platform</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      item.highlight
                        ? 'bg-cyan-600 text-slate-950 hover:bg-cyan-500 font-semibold shadow-md shadow-cyan-950/40 ml-1'
                        : isActive
                        ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700/60'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 uppercase">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section: Status Indicator & Role Toggle */}
          <div className="flex items-center gap-3">
            {/* Live Polling & Mocks Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Live Polling (8s)</span>
              {USE_MOCKS && (
                <span className="text-slate-400 border-l border-slate-800 pl-2">
                  Mocks ON
                </span>
              )}
            </div>

            {/* Role Toggle Switch */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onToggleRole('citizen')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  role === 'citizen'
                    ? 'bg-slate-800 text-cyan-400 shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Citizen Role"
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleRole('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  role === 'admin'
                    ? 'bg-amber-950/80 text-amber-300 shadow-xs border border-amber-800/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to Admin Role"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium ${
                    isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
