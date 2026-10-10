# Ocean Hazard Reporting & Coastal Incident Intelligence Platform

> A centralized platform for collecting, processing, correlating, and visualizing coastal hazard reports as meaningful incident-level information.

---

## 📌 Overview

The **Ocean Hazard Reporting & Coastal Incident Intelligence Platform** is a full-stack system designed to organize fragmented coastal hazard reports from citizens and simulated social-media-style sources.

Multiple reports may describe the same real-world coastal event using different wording, locations, and reporting times. The platform processes these reports and consolidates related reports into a single **incident record**.

Each incident provides a centralized view of:
* Hazard type
* Location & centroid coordinates
* Severity (High, Medium, Low)
* AI / NLP Confidence percentage
* Number of related reports
* Reporting time range
* Associated citizen & agency reports
* Spatial and temporal activity

The resulting information is presented through an interactive React dashboard with maps, filters, charts, hotspot analysis, timeline visualization, and admin moderation controls.

---

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

## 📁 Project Structure

```text
ocean-hazard-platform/
│
├── src/                      # Frontend Application Source Code
│   ├── api/                  # API Client Abstraction Layer
│   │   ├── client.js         # Axios instance with baseURL & error handlers
│   │   ├── reportsApi.js     # getReports(), createReport(), getReportById()
│   │   ├── incidentsApi.js   # getIncidents(), getIncidentById(), updateIncidentStatus()
│   │   ├── analyticsApi.js   # getAnalytics(), by-hazard, over-time, by-region
│   │   └── hotspotsApi.js    # getHotspots()
│   ├── mocks/                # Frozen Mock Data Contracts
│   │   ├── mockReports.js    # 18 sample reports with exact contracts & clusters
│   │   ├── mockIncidents.js  # Incident clusters (PURI-042, CHENNAI-031, etc.)
│   │   └── mockAnalytics.js  # Aggregated analytics metrics & growth rates
│   ├── components/           # Shared UI Components
│   │   ├── SeverityBadge.jsx # Standardized severity colors (High=Red, Med=Orange, Low=Yellow)
│   │   ├── HazardIcon.jsx    # Visual icons for 5 coastal hazard types
│   │   ├── StatCard.jsx      # Interactive KPI cards with filter handler
│   │   ├── SkeletonLoader.jsx# Card, table, and map loading placeholders
│   │   ├── EmptyState.jsx    # Clear empty state handler with action triggers
│   │   └── Navbar.jsx        # Navigation bar & Citizen/Admin role toggle
│   ├── pages/                # 7 Primary Application Views
│   │   ├── Dashboard.jsx          # Stat cards, incident list, mini map link & trend chart
│   │   ├── ReportSubmission.jsx   # Form with GPS, map pin-drop, photo upload & NLP result card
│   │   ├── Map.jsx                # Full GIS map with Leaflet, clusters, heatmaps & search
│   │   ├── IncidentDetails.jsx    # Centroid map, arrival timeline, related reports & admin status
│   │   ├── AnalyticsDashboard.jsx # Multi-chart analytics, region breakdown & hotspot ranks
│   │   ├── Reports.jsx            # Searchable, paginated reports table
│   │   └── Admin.jsx              # Moderation queue with Verify / False Alarm & Merge/Split tooltip
│   ├── App.jsx               # React Router layout & role state management
│   ├── main.jsx              # React DOM entry point
│   ├── index.css             # Tailwind CSS v4 & custom Leaflet dark ocean styles
│   └── config.js             # USE_MOCKS configuration flag
│
├── backend/                  # Node.js / Express Backend REST Service
│   ├── server.js
│   ├── package.json
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── nlp-service/              # Python FastAPI NLP Classification & Extraction Service
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   └── requirements.txt
│
├── docs/                     # System Architecture Documentation
│   └── ARCHITECTURE.md
│
├── .env.example              # VITE_API_BASE_URL template
├── .gitignore                # Git exclusion rules
├── package.json              # Project dependencies & scripts
├── vite.config.js            # Vite build setup with @tailwindcss/vite
└── README.md
```

---

## 🎯 Key Features & Pages

### 1. Dashboard (Home)
- Real-time stat cards (Total Reports, Active Incidents, High-Severity Count, Reports Today).
- Clickable stat cards for instant incident filtering.
- Compact GIS map preview link, recent incidents feed, and 7-day trend chart.

### 2. Citizen Hazard Reporting (`/report`)
- Text description input for coastal hazard observations.
- Location tools: GPS auto-detect button, interactive Leaflet mini-map pin-drop, and landmark text fallback.
- Optional photo attachment preview.
- **Post-Submission AI Intelligence Confirmation Card**: Visualizes detected hazard type, AI confidence %, assigned severity, and extracted location.

### 3. Interactive GIS Map (`/map`)
- Leaflet map with OpenStreetMap tiles.
- Custom severity markers (High=Red, Medium=Orange, Low=Yellow).
- Marker clustering at zoom-out (`leaflet.markercluster`).
- Thermal heatmap density toggle (`leaflet.heat`).
- Hotspot radius circles.
- Filters: Hazard type checkboxes (5 categories), severity levels, and time ranges (Last 24h, Last 7 Days, All Time).
- Location search tool with autocomplete across 35+ coastal locations in India.

### 4. Incident Details (`/incidents/:id`)
- Header displaying Incident ID, hazard type, severity badge, confidence %, location name, and centroid coordinates.
- Mini centroid map and cumulative reports arrival timeline chart.
- List of associated citizen and field reports.
- **Admin Verification Control**: `verified`, `unverified`, or `false_alarm` status update buttons.

### 5. Analytics & Intelligence Command (`/analytics`)
- Aggregated KPI summary cards.
- Reports by hazard type bar chart.
- Temporal report ingestion line chart.
- Regional incident distribution bar chart.
- Severity breakdown donut chart.
- Top-ranked coastal hotspots list with bounding radius metrics.
- Active incident growth velocity tracker (reports/hour).

### 6. Reports Log (`/reports`)
- Comprehensive tabular view of all ingested reports.
- Search box filtering text, report ID, or location.
- Hazard and severity dropdown filters.
- Paginated table navigation.

### 7. Admin Console (`/admin`)
- Incident moderation queue showing unverified incidents awaiting review.
- Direct **Verify Incident** and **Mark False Alarm** action controls.
- Disabled **"Merge / Split Clusters"** button with a *"Coming soon"* tooltip.

---

## ⚡ Technical & Data Contract Highlights

- **Coordinates Standard**: Coordinates follow GeoJSON `[longitude, latitude]` format across API contracts, seamlessly converted to Leaflet `[lat, lng]` at the map layer only.
- **5 Coastal Hazard Types**: `coastal_flooding`, `abnormal_waves`, `storm_surge`, `coastal_erosion`, `marine_incident`.
- **Role Control**: Navbar includes a Citizen / Admin role toggle switch (default: Admin for demo).
- **Live Polling Telemetry**: Background polling every 8 seconds for live telemetry updates.

---

## 👥 Team Members

| Name | Role |
| --- | --- |
| **Kartik Gupta** | Backend & Database |
| **Kesar Agrawal** | NLP / AI |
| **Tanya Agrawal** | Frontend & UI |
| **Toshi Singh** | Geospatial Analytics |

---

## 👨‍🏫 Project Supervisor

**Mr. Ankit Gaur**  
Assistant Professor, CEA Department

---

## 📚 Resources & References

- React — Official Documentation
- Vite & Tailwind CSS v4 — Official Documentation
- Leaflet & OpenStreetMap — Official Documentation
- Express.js & MongoDB — Official Documentation
- FastAPI & Python NLP — Official Documentation
