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
  return client.get('/incidents', { params });
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
  return client.get(`/incidents/${id}`);
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
  return client.patch(`/incidents/${id}/status`, { verificationStatus });
};
