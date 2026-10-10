import React, { useState } from 'react';
import { createReport } from '../api/reportsApi';
import SeverityBadge from '../components/SeverityBadge';
import HazardIcon from '../components/HazardIcon';
import {
  Send,
  MapPin,
  Crosshair,
  Upload,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Custom marker icon for mini map
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationPicker({ position, setPosition, setLocationText }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      setLocationText(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
    }
  });

  return position ? <Marker position={position} icon={defaultIcon} /> : null;
}

export const ReportSubmission = () => {
  const [text, setText] = useState('');
  const [locationText, setLocationText] = useState('Puri Beach Shore');
  const [coords, setCoords] = useState([19.8135, 85.8312]); // [lat, lng]
  const [hazardType, setHazardType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Post-submission result state
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords([lat, lng]);
        setLocationText(`GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsLocating(false);
      },
      () => {
        alert('Could not auto-detect GPS location. Defaulting to Puri coastal coordinates.');
        setIsLocating(false);
      }
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please describe what ocean hazard you are observing.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Note: Data contract coordinates are [lng, lat] (GeoJSON format)
      const res = await createReport({
        text,
        locationText,
        locationName: locationText.split(',')[0] || 'Puri Shoreline',
        coordinates: [coords[1], coords[0]], // [lng, lat]
        locationSource: isLocating ? 'gps' : 'extracted',
        hazardType: hazardType || null,
        severity,
        photoUrl
      });

      setSubmissionResult(res);
    } catch (err) {
      setError(err.message || 'Failed to submit hazard report.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmissionResult(null);
    setText('');
    setLocationText('Puri Beach Shore');
    setCoords([19.8135, 85.8312]);
    setHazardType('');
    setSeverity('medium');
    setPhotoUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Submit Ocean Hazard Report</h1>
            <p className="text-sm text-slate-400">
              Report flooding, abnormal waves, or marine threats. AI NLP automatically classifies and clusters your input.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Intelligence Card (Shown after successful submission) */}
      {submissionResult ? (
        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-2 border-cyan-500 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Report Ingested</span>
                <h2 className="text-xl font-extrabold text-slate-100">
                  Report #{submissionResult.report.id} Processed
                </h2>
              </div>
            </div>
            <span className="font-mono text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Status: Unverified (Pending Review)
            </span>
          </div>

          {/* Key AI Intelligence Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-cyan-800/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI NLP Threat Classification Intelligence</span>
              </div>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                {(submissionResult.classification.confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Detected Hazard</span>
                <div className="flex items-center gap-2">
                  <HazardIcon type={submissionResult.classification.hazardType} size="sm" />
                  <span className="text-sm font-bold text-slate-100 capitalize">
                    {submissionResult.classification.hazardType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Assigned Severity</span>
                <div>
                  <SeverityBadge severity={submissionResult.report.severity} />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Extracted Location</span>
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {submissionResult.classification.extractedLocation.resolved}
                </p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 italic">
              "{submissionResult.report.text}"
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              onClick={resetForm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>

            <Link
              to={`/incidents/${submissionResult.report.incidentId}`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all"
            >
              <span>View Clustered Incident ({submissionResult.report.incidentId})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Text Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Hazard Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you're seeing in detail (e.g. 'Road near Puri beach completely flooded after huge waves. Water entering houses.')"
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              required
            />
          </div>

          {/* Location Picker Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Location & Coordinates
              </label>

              <button
                type="button"
                onClick={handleGpsDetect}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/70 border border-cyan-800/80 px-3 py-1.5 rounded-lg"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Auto-Detect GPS'}</span>
              </button>
            </div>

            {/* Location Text Fallback */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Enter landmark or beach name (e.g. Puri beach road)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Mini Map Pin Drop */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Click on map below to adjust pin drop location:</span>
              <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
                <MapContainer
                  center={coords}
                  zoom={12}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <LocationPicker position={coords} setPosition={setCoords} setLocationText={setLocationText} />
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Additional Metadata: Hazard Dropdown & Severity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Hazard Type (Optional Override)
              </label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">Auto-Detect via NLP (Recommended)</option>
                <option value="coastal_flooding">Coastal Flooding</option>
                <option value="abnormal_waves">Abnormal Waves</option>
                <option value="storm_surge">Storm Surge</option>
                <option value="coastal_erosion">Coastal Erosion</option>
                <option value="marine_incident">Marine Incident</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Observed Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="high">High (Flooding houses, capsized boats, road blocked)</option>
                <option value="medium">Medium (Large waves, visible erosion, warnings issued)</option>
                <option value="low">Low (Mild backwater overflow, beach litter)</option>
              </select>
            </div>
          </div>

          {/* Optional Photo Attachment */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Attach Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Choose Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {photoUrl && (
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-200">
                  <img src={photoUrl} alt="Preview" className="w-8 h-8 rounded object-cover" />
                  <span>Photo Attached</span>
                  <button type="button" onClick={() => setPhotoUrl('')} className="text-red-400 ml-2 hover:underline">
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-950/60 transition-all hover:scale-[1.01]"
            >
              {submitting ? (
                <span>Submitting & Running NLP Intelligence...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Incident Intelligence Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportSubmission;
