export const mockIncidents = [
  {
    id: "PURI-042",
    hazardType: "coastal_flooding",
    severity: "high",
    confidence: 0.94,
    location: { name: "Puri Coast", centroid: [85.8312, 19.8135], radiusMeters: 1200 },
    reportCount: 23,
    reportIds: ["RPT-00201", "RPT-00202", "RPT-00203", "RPT-00204", "RPT-00218"],
    firstReportedAt: "2026-09-05T09:50:00Z",
    lastReportedAt: "2026-09-05T11:10:00Z",
    status: "active",
    verificationStatus: "unverified"
  },
  {
    id: "PARADIP-018",
    hazardType: "storm_surge",
    severity: "high",
    confidence: 0.95,
    location: { name: "Paradip Port Area", centroid: [86.6088, 20.3164], radiusMeters: 1800 },
    reportCount: 14,
    reportIds: ["RPT-00205", "RPT-00206"],
    firstReportedAt: "2026-09-05T08:15:00Z",
    lastReportedAt: "2026-09-05T08:40:00Z",
    status: "active",
    verificationStatus: "verified"
  },
  {
    id: "CHENNAI-031",
    hazardType: "marine_incident",
    severity: "high",
    confidence: 0.96,
    location: { name: "Chennai Marina Shoreline", centroid: [80.2825, 13.0500], radiusMeters: 800 },
    reportCount: 18,
    reportIds: ["RPT-00209", "RPT-00210", "RPT-00211"],
    firstReportedAt: "2026-09-05T11:00:00Z",
    lastReportedAt: "2026-09-05T11:20:00Z",
    status: "active",
    verificationStatus: "verified"
  },
  {
    id: "DIGHA-009",
    hazardType: "coastal_erosion",
    severity: "medium",
    confidence: 0.84,
    location: { name: "Digha Sea Beach", centroid: [87.5076, 21.6266], radiusMeters: 2500 },
    reportCount: 8,
    reportIds: ["RPT-00207", "RPT-00208"],
    firstReportedAt: "2026-09-05T07:00:00Z",
    lastReportedAt: "2026-09-05T07:45:00Z",
    status: "active",
    verificationStatus: "unverified"
  },
  {
    id: "KOCHI-005",
    hazardType: "coastal_flooding",
    severity: "low",
    confidence: 0.82,
    location: { name: "Kochi Fort & Marine Drive", centroid: [76.2673, 9.9312], radiusMeters: 1500 },
    reportCount: 6,
    reportIds: ["RPT-00212", "RPT-00213"],
    firstReportedAt: "2026-09-05T06:30:00Z",
    lastReportedAt: "2026-09-05T06:50:00Z",
    status: "active",
    verificationStatus: "unverified"
  },
  {
    id: "VIZAG-012",
    hazardType: "marine_incident",
    severity: "high",
    confidence: 0.95,
    location: { name: "Visakhapatnam RK Beach Offshore", centroid: [83.3185, 17.7120], radiusMeters: 3000 },
    reportCount: 11,
    reportIds: ["RPT-00214"],
    firstReportedAt: "2026-09-05T12:15:00Z",
    lastReportedAt: "2026-09-05T12:15:00Z",
    status: "active",
    verificationStatus: "verified"
  },
  {
    id: "MAHA-007",
    hazardType: "coastal_erosion",
    severity: "medium",
    confidence: 0.89,
    location: { name: "Mahabalipuram Shore", centroid: [80.1982, 12.6269], radiusMeters: 900 },
    reportCount: 5,
    reportIds: ["RPT-00215"],
    firstReportedAt: "2026-09-05T09:00:00Z",
    lastReportedAt: "2026-09-05T09:00:00Z",
    status: "active",
    verificationStatus: "unverified"
  },
  {
    id: "GOPAL-014",
    hazardType: "storm_surge",
    severity: "medium",
    confidence: 0.90,
    location: { name: "Gopalpur Sea Coast", centroid: [84.9080, 19.2606], radiusMeters: 2000 },
    reportCount: 7,
    reportIds: ["RPT-00216"],
    firstReportedAt: "2026-09-05T13:00:00Z",
    lastReportedAt: "2026-09-05T13:00:00Z",
    status: "active",
    verificationStatus: "unverified"
  },
  {
    id: "GOA-003",
    hazardType: "coastal_flooding",
    severity: "low",
    confidence: 0.70,
    location: { name: "Goa Calangute Shore", centroid: [73.8315, 15.4989], radiusMeters: 1000 },
    reportCount: 2,
    reportIds: ["RPT-00217"],
    firstReportedAt: "2026-09-05T14:00:00Z",
    lastReportedAt: "2026-09-05T14:00:00Z",
    status: "resolved",
    verificationStatus: "false_alarm"
  }
];

export const mockHotspots = [
  { id: "HOT-01", centroid: [85.8312, 19.8135], incidentCount: 4, dominantHazard: "coastal_flooding", maxSeverity: "high", boundingRadiusMeters: 3000, regionName: "Puri Coast" },
  { id: "HOT-02", centroid: [80.2825, 13.0500], incidentCount: 3, dominantHazard: "marine_incident", maxSeverity: "high", boundingRadiusMeters: 2500, regionName: "Chennai Shore" },
  { id: "HOT-03", centroid: [86.6088, 20.3164], incidentCount: 2, dominantHazard: "storm_surge", maxSeverity: "high", boundingRadiusMeters: 3500, regionName: "Paradip Port Zone" },
  { id: "HOT-04", centroid: [87.5076, 21.6266], incidentCount: 2, dominantHazard: "coastal_erosion", maxSeverity: "medium", boundingRadiusMeters: 2000, regionName: "Digha Beach" },
  { id: "HOT-05", centroid: [76.2673, 9.9312], incidentCount: 2, dominantHazard: "coastal_flooding", maxSeverity: "low", boundingRadiusMeters: 1800, regionName: "Kochi Coastline" }
];
