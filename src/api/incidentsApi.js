import client from './client';
import { USE_MOCKS } from '../config';
import { mockIncidents } from '../mocks/mockIncidents';
import { mockReports } from '../mocks/mockReports';

let localMockIncidents = [...mockIncidents];

export const getIncidents = async (params = {}) => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...localMockIncidents];
        if (params.hazardType && params.hazardType !== 'all') {
          filtered = filtered.filter((inc) => inc.hazardType === params.hazardType);
        }
        if (params.severity && params.severity !== 'all') {
          filtered = filtered.filter((inc) => inc.severity === params.severity);
        }
        if (params.status && params.status !== 'all') {
          filtered = filtered.filter((inc) => inc.status === params.status || inc.verificationStatus === params.status);
        }
        resolve(filtered);
      }, 400);
    });
  }
  const res = await client.get('/incidents', { params });
  return Array.isArray(res) ? res : (res?.data || []);
};

export const getIncidentById = async (id) => {
  if (USE_MOCKS) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const incident = localMockIncidents.find((inc) => inc.id === id);
        if (!incident) {
          return reject(new Error(`Incident with ID ${id} not found`));
        }
        // Match related reports by reportIds or matching incidentId
        const relatedReports = mockReports.filter(
          (r) => incident.reportIds.includes(r.id) || r.incidentId === incident.id
        );
        resolve({
          incident,
          reports: relatedReports
        });
      }, 400);
    });
  }
  const res = await client.get(`/incidents/${id}`);
  return res?.data || res;
};

export const updateIncidentStatus = async (id, verificationStatus) => {
  if (USE_MOCKS) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = localMockIncidents.findIndex((inc) => inc.id === id);
        if (index !== -1) {
          localMockIncidents[index] = {
            ...localMockIncidents[index],
            verificationStatus,
            status: verificationStatus === 'false_alarm' ? 'resolved' : localMockIncidents[index].status
          };
          resolve(localMockIncidents[index]);
        } else {
          reject(new Error(`Incident with ID ${id} not found`));
        }
      }, 350);
    });
  }
  const res = await client.patch(`/incidents/${id}/status`, { verificationStatus });
  return res?.data || res;
};

export const mergeIncidents = async ({ primaryIncidentId, secondaryIncidentIds, resolutionNote }) => {
  if (USE_MOCKS) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const primary = localMockIncidents.find((i) => i.id === primaryIncidentId);
        if (!primary) return reject(new Error('Primary incident not found'));
        localMockIncidents = localMockIncidents.filter((i) => !secondaryIncidentIds.includes(i.id));
        resolve({ primaryIncident: primary, mergedCount: secondaryIncidentIds.length });
      }, 400);
    });
  }
  const res = await client.post('/incidents/merge', {
    primaryIncidentId,
    secondaryIncidentIds,
    resolutionNote
  });
  return res?.data || res;
};

export const splitIncident = async ({
  sourceIncidentId,
  reportIdsToExtract,
  newIncidentLocationName,
  newHazardType
}) => {
  if (USE_MOCKS) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const source = localMockIncidents.find((i) => i.id === sourceIncidentId);
        if (!source) return reject(new Error('Source incident not found'));
        const newInc = {
          ...source,
          id: `INC-SPLIT-${Math.floor(100 + Math.random() * 900)}`,
          reportCount: reportIdsToExtract.length,
          locationName: newIncidentLocationName || source.locationName
        };
        localMockIncidents.push(newInc);
        resolve({ sourceIncident: source, newIncident: newInc });
      }, 400);
    });
  }
  const res = await client.post('/incidents/split', {
    sourceIncidentId,
    reportIdsToExtract,
    newIncidentLocationName,
    newHazardType
  });
  return res?.data || res;
};
