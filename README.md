# Ocean Hazard Reporting & Coastal Incident Intelligence Platform

A high-performance React (Vite) frontend application built for real-time coastal threat monitoring, citizen hazard reporting, and geospatial GIS incident analytics.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Mock Layer vs Real API Toggle

By default, the application runs with **`USE_MOCKS = true`** in `src/config.js`. All data is retrieved asynchronously through the `src/api/*.js` abstraction layer with simulated network latency to exercise loading skeleton states.

### How to switch to a Real Backend:
1. Open [`src/config.js`](file:///c:/Users/agraw/OneDrive/Desktop/Mini%20project/src/config.js) and flip `USE_MOCKS` to `false`:
   ```javascript
   export const USE_MOCKS = false;
   ```
2. Create or configure `.env` (derived from `.env.example`):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
3. Restart the dev server (`npm run dev`). **Zero component code changes are required.**

---

## 📁 Project Architecture

```
src/
  api/
    client.js          # Axios client with base URL & interceptors
    reportsApi.js      # getReports(), createReport(), getReportById()
    incidentsApi.js    # getIncidents(), getIncidentById(), updateIncidentStatus()
    analyticsApi.js    # getAnalytics(), by-hazard, over-time, by-region
    hotspotsApi.js     # getHotspots()
  mocks/
    mockReports.js     # 18 sample reports with exact contracts & clusters
    mockIncidents.js   # Incident clusters (PURI-042, CHENNAI-031, etc.)
    mockAnalytics.js   # Aggregated analytics metrics & growth rates
  components/
    SeverityBadge.jsx  # Standardized severity colors (High=Red, Med=Orange, Low=Yellow)
    HazardIcon.jsx     # Visual icons for 5 coastal hazard types
    StatCard.jsx       # Interactive KPI cards with filter handler
    SkeletonLoader.jsx # Card, table, and map loading placeholders
    EmptyState.jsx     # Clear empty state handler with action triggers
    Navbar.jsx         # Sticky navigation, status indicator & Citizen/Admin role toggle
  pages/
    Dashboard.jsx           # Stat cards, incident list, mini map link & trend chart
    ReportSubmission.jsx    # Form with GPS, map pin-drop, photo upload & NLP result card
    Map.jsx                 # Full GIS map with Leaflet, clusters, heatmaps & search
    IncidentDetails.jsx     # Centroid map, arrival timeline, related reports & admin status
    AnalyticsDashboard.jsx  # Multi-chart analytics, region breakdown & hotspot ranks
    Reports.jsx             # Searchable, paginated reports table
    Admin.jsx               # Moderation queue with Verify / False Alarm & Merge/Split tooltip
  config.js            # USE_MOCKS configuration flag
.env.example           # VITE_API_BASE_URL template
```

---

## ⚡ Technical Highlights

- **Frozen Data Contracts**: Coordinates follow GeoJSON `[longitude, latitude]` format across API contracts, seamlessly converted to Leaflet `[lat, lng]` at the map layer only.
- **5 Coastal Hazard Types**: `coastal_flooding`, `abnormal_waves`, `storm_surge`, `coastal_erosion`, `marine_incident`.
- **Role Control**: Minimal Citizen/Admin toggle in top header navbar.
- **Polling Telemetry**: Background polling every 8 seconds for live telemetry updates.
