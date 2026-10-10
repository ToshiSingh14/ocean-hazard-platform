export const mockAnalyticsData = {
  totals: {
    reports: 412,
    incidents: 38,
    highSeverity: 9,
    activeIncidents: 8,
    reportsToday: 18
  },
  byHazardType: {
    coastal_flooding: 140,
    abnormal_waves: 90,
    storm_surge: 60,
    coastal_erosion: 50,
    marine_incident: 72
  },
  overTime: [
    { date: "2026-09-01", count: 20 },
    { date: "2026-09-02", count: 34 },
    { date: "2026-09-03", count: 42 },
    { date: "2026-09-04", count: 58 },
    { date: "2026-09-05", count: 95 },
    { date: "2026-09-06", count: 78 },
    { date: "2026-09-07", count: 85 }
  ],
  byRegion: [
    { region: "Puri", count: 60, highSeverityCount: 3 },
    { region: "Chennai", count: 45, highSeverityCount: 2 },
    { region: "Paradip", count: 38, highSeverityCount: 2 },
    { region: "Visakhapatnam", count: 32, highSeverityCount: 1 },
    { region: "Digha", count: 28, highSeverityCount: 0 },
    { region: "Kochi", count: 24, highSeverityCount: 0 },
    { region: "Mahabalipuram", count: 18, highSeverityCount: 0 },
    { region: "Gopalpur", count: 15, highSeverityCount: 1 }
  ],
  severityDistribution: [
    { severity: "high", count: 9, percentage: 24 },
    { severity: "medium", count: 18, percentage: 47 },
    { severity: "low", count: 11, percentage: 29 }
  ],
  incidentGrowthRates: [
    { incidentId: "PURI-042", region: "Puri", reportsPerHour: 6.2, trend: "up" },
    { incidentId: "CHENNAI-031", region: "Chennai", reportsPerHour: 4.8, trend: "up" },
    { incidentId: "PARADIP-018", region: "Paradip", reportsPerHour: 3.5, trend: "stable" },
    { incidentId: "VIZAG-012", region: "Visakhapatnam", reportsPerHour: 2.1, trend: "up" },
    { incidentId: "DIGHA-009", region: "Digha", reportsPerHour: 1.0, trend: "down" }
  ]
};
