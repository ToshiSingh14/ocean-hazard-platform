import client from './client';
import { USE_MOCKS } from '../config';
import { mockReports } from '../mocks/mockReports';

// In-memory store for newly added mock reports during the session
let localMockReports = [...mockReports];

export const getReports = async (params = {}) => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...localMockReports];
        if (params.hazardType && params.hazardType !== 'all') {
          filtered = filtered.filter((r) => r.hazard.type === params.hazardType);
        }
        if (params.severity && params.severity !== 'all') {
          filtered = filtered.filter((r) => r.severity === params.severity);
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.text.toLowerCase().includes(q) ||
              r.location.name.toLowerCase().includes(q) ||
              r.id.toLowerCase().includes(q)
          );
        }
        resolve(filtered);
      }, 400);
    });
  }
  return client.get('/reports', { params });
};

export const getReportById = async (id) => {
  if (USE_MOCKS) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const report = localMockReports.find((r) => r.id === id);
        if (report) {
          resolve(report);
        } else {
          reject(new Error(`Report with ID ${id} not found`));
        }
      }, 300);
    });
  }
  return client.get(`/reports/${id}`);
};

export const createReport = async (reportData) => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = `RPT-${Math.floor(10000 + Math.random() * 90000)}`;
        
        // Simple NLP mock inferring from report text if hazard not explicitly set
        let detectedHazard = reportData.hazardType || 'coastal_flooding';
        const textLower = (reportData.text || '').toLowerCase();
        
        if (!reportData.hazardType) {
          if (textLower.includes('wave') || textLower.includes('tide')) {
            detectedHazard = 'abnormal_waves';
          } else if (textLower.includes('surge') || textLower.includes('sea level')) {
            detectedHazard = 'storm_surge';
          } else if (textLower.includes('erosion') || textLower.includes('sand') || textLower.includes('wall')) {
            detectedHazard = 'coastal_erosion';
          } else if (textLower.includes('boat') || textLower.includes('rescue') || textLower.includes('capsize')) {
            detectedHazard = 'marine_incident';
          }
        }

        const locationName = reportData.locationName || 'Puri Shoreline';
        const coords = reportData.coordinates || [85.8312, 19.8135];

        const classificationResult = {
          hazardType: detectedHazard,
          secondaryTypes: detectedHazard === 'coastal_flooding' ? ['abnormal_waves'] : [],
          confidence: parseFloat((0.85 + Math.random() * 0.12).toFixed(2)),
          extractedLocation: {
            text: reportData.locationText || locationName,
            resolved: locationName,
            coordinates: coords
          }
        };

        const newReport = {
          id: newId,
          text: reportData.text,
          photoUrl: reportData.photoUrl || null,
          location: {
            raw: reportData.locationText || locationName,
            name: locationName,
            coordinates: coords,
            source: reportData.locationSource || 'extracted'
          },
          hazard: {
            type: classificationResult.hazardType,
            secondaryTypes: classificationResult.secondaryTypes,
            confidence: classificationResult.confidence
          },
          severity: reportData.severity || 'medium',
          incidentId: 'PURI-042',
          status: 'unverified',
          createdAt: new Date().toISOString(),
          source: 'citizen'
        };

        localMockReports.unshift(newReport);

        resolve({
          report: newReport,
          classification: classificationResult
        });
      }, 500);
    });
  }
  return client.post('/reports', reportData);
};
