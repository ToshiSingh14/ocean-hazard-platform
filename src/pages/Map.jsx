import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../api/incidentsApi';
import { getHotspots } from '../api/hotspotsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  MapPin,
  Filter,
  Layers,
  Search,
  Flame,
  Clock,
  ExternalLink,
  RefreshCw,
  Eye,
  Crosshair,
  Sliders
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';

// Coastal locations lookup table (~35 coastal locations across India)
const COASTAL_LOCATIONS = [
  { name: 'Puri Beach, Odisha', lat: 19.8135, lng: 85.8312 },
  { name: 'Paradip Port, Odisha', lat: 20.3164, lng: 86.6088 },
  { name: 'Digha Coast, West Bengal', lat: 21.6266, lng: 87.5076 },
  { name: 'Marina Beach, Chennai', lat: 13.0500, lng: 80.2825 },
  { name: 'Fort Kochi, Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'RK Beach, Visakhapatnam', lat: 17.7120, lng: 83.3185 },
  { name: 'Mahabalipuram, Tamil Nadu', lat: 12.6269, lng: 80.1982 },
  { name: 'Gopalpur-on-Sea, Odisha', lat: 19.2606, lng: 84.9080 },
  { name: 'Calangute, Goa', lat: 15.4989, lng: 73.8315 },
  { name: 'Juhu Beach, Mumbai', lat: 19.0988, lng: 72.8264 },
  { name: 'Panambur, Mangalore', lat: 12.9510, lng: 74.8080 },
  { name: 'Kozhikode Beach, Kerala', lat: 11.2588, lng: 75.7725 },
  { name: 'Kanyakumari Pier, Tamil Nadu', lat: 8.0883, lng: 77.5385 },
  { name: 'Pondicherry Promenade', lat: 11.9338, lng: 79.8355 },
  { name: 'Machilipatnam, Andhra Pradesh', lat: 16.1809, lng: 81.1303 },
  { name: 'Kakinada Port, Andhra Pradesh', lat: 16.9891, lng: 82.2475 },
  { name: 'Chandipur Beach, Odisha', lat: 21.4682, lng: 87.0142 },
  { name: 'Haldia Port, West Bengal', lat: 22.0620, lng: 88.0870 },
  { name: 'Dwarka Coast, Gujarat', lat: 22.2442, lng: 68.9685 },
  { name: 'Porbandar Beach, Gujarat', lat: 21.6417, lng: 69.6293 },
  { name: 'Veraval Somnath, Gujarat', lat: 20.9022, lng: 70.3705 },
  { name: 'Alibag Beach, Maharashtra', lat: 18.6414, lng: 72.8722 },
  { name: 'Karwar Beach, Karnataka', lat: 14.8090, lng: 74.1300 },
  { name: 'Malpe Beach, Udupi', lat: 13.3575, lng: 74.7042 },
  { name: 'Kovalam Beach, Trivandrum', lat: 8.4004, lng: 76.9787 },
  { name: 'Tuticorin Port, Tamil Nadu', lat: 8.7642, lng: 78.1348 },
  { name: 'Nagapattinam Coast', lat: 10.7656, lng: 79.8424 },
  { name: 'Cuddalore Beach, Tamil Nadu', lat: 11.7480, lng: 79.7714 },
  { name: 'Mypadu Beach, Nellore', lat: 14.5028, lng: 80.1788 },
  { name: 'Vodarevu Beach, Ongole', lat: 15.7950, lng: 80.0820 }
];

// Helper component to programmatically pan/zoom map
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Leaflet Heatmap Layer Wrapper
function HeatmapLayer({ points }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Convert points to [lat, lng, intensity]
    const heatData = points.map((p) => [
      p.lat,
      p.lng,
      p.severity === 'high' ? 1.0 : p.severity === 'medium' ? 0.6 : 0.3
    ]);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (L.heatLayer && heatData.length > 0) {
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 14,
        gradient: {
          0.2: '#eab308',
          0.5: '#f97316',
          0.9: '#ef4444'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points]);

  return null;
}

// Custom Severity Marker Icon Builder
const createCustomIcon = (severity, reportCount) => {
  const size = severity === 'high' ? 38 : severity === 'medium' ? 32 : 26;
  const color = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f97316' : '#eab308';
  const shadow = severity === 'high' ? 'rgba(239, 68, 68, 0.6)' : severity === 'medium' ? 'rgba(249, 115, 22, 0.6)' : 'rgba(234, 179, 8, 0.6)';

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid #0f172a;
      border-radius: 50%;
      box-shadow: 0 0 15px ${shadow};
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: ${size > 30 ? 12 : 10}px;
    ">
      ${reportCount > 99 ? '99+' : reportCount}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-severity-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

export const MapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedHazards, setSelectedHazards] = useState([
    'coastal_flooding',
    'abnormal_waves',
    'storm_surge',
    'coastal_erosion',
    'marine_incident'
  ]);
  const [selectedSeverity, setSelectedSeverity] = useState('all'); // all, high, medium, low
  const [timeRange, setTimeRange] = useState('all'); // all, 24h, 7d

  // View Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);

  // Location Search & Radius Tool
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(100);
  const [mapCenter, setMapCenter] = useState([19.8135, 85.8312]);
  const [mapZoom, setMapZoom] = useState(7);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incRes, hotRes] = await Promise.all([getIncidents(), getHotspots()]);
      setIncidents(incRes || []);
      setHotspots(hotRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load geospatial incident layers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
    const timer = setInterval(() => fetchMapData(), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter Hazards toggle handler
  const toggleHazard = (hazardType) => {
    setSelectedHazards((prev) =>
      prev.includes(hazardType) ? prev.filter((h) => h !== hazardType) : [...prev, hazardType]
    );
  };

  // Filtered incidents logic
  const filteredIncidents = incidents.filter((inc) => {
    // Hazard filter
    if (!selectedHazards.includes(inc.hazardType)) return false;
    // Severity filter
    if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
    // Time filter
    if (timeRange !== 'all') {
      const incTime = new Date(inc.lastReportedAt || inc.firstReportedAt).getTime();
      const now = new Date().getTime();
      const hours = timeRange === '24h' ? 24 : 168; // 7d
      if (now - incTime > hours * 3600 * 1000) return false;
    }
    return true;
  });

  // Search Location selection handler
  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(11);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setMapCenter([19.8135, 85.8312]);
    setMapZoom(7);
  };

  // Prepare heatmap point dataset: converts GeoJSON [lng, lat] to Leaflet [lat, lng]
  const heatPoints = filteredIncidents.map((inc) => ({
    lat: inc.location.centroid[1],
    lng: inc.location.centroid[0],
    severity: inc.severity
  }));

  return (
    <div className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Live GIS Incident Map</h1>
            <p className="text-xs text-slate-400">
              OpenStreetMap tile stream, marker clusters & thermal threat layer
            </p>
          </div>
        </div>

        {/* Location Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 35+ coastal locations..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}

          {/* Autocomplete Suggestions */}
          {searchQuery && !selectedLocation && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800/60">
              {COASTAL_LOCATIONS.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map((loc) => (
                <div
                  key={loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  className="px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] text-slate-500">
                    {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Container: Sidebar Controls + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Hazard Filters */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hazard Type Filter</span>
              </div>
              <button
                onClick={() =>
                  setSelectedHazards([
                    'coastal_flooding',
                    'abnormal_waves',
                    'storm_surge',
                    'coastal_erosion',
                    'marine_incident'
                  ])
                }
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'coastal_flooding', label: 'Coastal Flooding' },
                { id: 'abnormal_waves', label: 'Abnormal Waves' },
                { id: 'storm_surge', label: 'Storm Surge' },
                { id: 'coastal_erosion', label: 'Coastal Erosion' },
                { id: 'marine_incident', label: 'Marine Incident' }
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={selectedHazards.includes(item.id)}
                    onChange={() => toggleHazard(item.id)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                  />
                  <HazardIcon type={item.id} size="sm" />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Severity & Time Filter */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-slate-400">Severity Filter</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {['all', 'high', 'medium', 'low'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeverity(s)}
                    className={`py-1 text-[11px] font-semibold rounded capitalize transition-colors ${
                      selectedSeverity === s
                        ? 'bg-cyan-600 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[11px] font-bold uppercase text-slate-400">Time Range</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '24h', label: 'Last 24h' },
                  { id: '7d', label: 'Last 7 Days' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeRange(t.id)}
                    className={`py-1 text-[11px] font-semibold rounded transition-colors ${
                      timeRange === t.id
                        ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Map Layer Toggles */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layer Controls</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Heatmap Density</span>
                </span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="flex items-center gap-2 text-slate-200">
                  <Crosshair className="w-4 h-4 text-purple-400" />
                  <span>Hotspot Radii</span>
                </span>
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={(e) => setShowHotspots(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Active Legend */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="block text-[11px] font-bold uppercase text-slate-400">Map Legend</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs shadow-red-500" />
                <span className="text-slate-300">High Severity Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-xs shadow-orange-500" />
                <span className="text-slate-300">Medium Severity Incident</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-xs shadow-amber-400" />
                <span className="text-slate-300">Low Severity Incident</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: GIS Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[580px] bg-slate-950">
          {loading ? (
            <SkeletonLoader type="map" />
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', minHeight: '580px', width: '100%' }}
            >
              <MapFlyTo center={mapCenter} zoom={mapZoom} />

              {/* Default OpenStreetMap Tiles */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Heatmap Layer */}
              {showHeatmap && <HeatmapLayer points={heatPoints} />}

              {/* Hotspot Radius Circles */}
              {showHotspots &&
                hotspots.map((h) => {
                  const [hLng, hLat] = h.centroid;
                  return (
                    <Circle
                      key={h.id}
                      center={[hLat, hLng]}
                      radius={h.boundingRadiusMeters || 3000}
                      pathOptions={{
                        color: h.maxSeverity === 'high' ? '#ef4444' : '#f97316',
                        fillColor: h.maxSeverity === 'high' ? '#ef4444' : '#f97316',
                        fillOpacity: 0.15,
                        dashArray: '6, 6'
                      }}
                    />
                  );
                })}

              {/* Incident Markers */}
              {filteredIncidents.map((incident) => {
                // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                const [lng, lat] = incident.location.centroid;
                const icon = createCustomIcon(incident.severity, incident.reportCount);

                return (
                  <Marker key={incident.id} position={[lat, lng]} icon={icon}>
                    <Popup className="custom-popup">
                      <div className="space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <span className="font-mono text-xs font-bold text-cyan-400">{incident.id}</span>
                          <SeverityBadge severity={incident.severity} />
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{incident.location.name}</h4>
                          <p className="text-xs text-slate-300 mt-1 capitalize flex items-center gap-1.5">
                            <HazardIcon type={incident.hazardType} size="sm" />
                            <span>{incident.hazardType.replace('_', ' ')}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 py-1 text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded border border-slate-800">
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase">Reports</span>
                            <span className="font-bold text-slate-200">{incident.reportCount}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-500 uppercase">Confidence</span>
                            <span className="font-bold text-slate-200">{(incident.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        <Link
                          to={`/incidents/${incident.id}`}
                          className="mt-2 block w-full py-1.5 text-center text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors"
                        >
                          View Details & Reports →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
