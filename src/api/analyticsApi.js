import client from './client';
import { USE_MOCKS } from '../config';
import { mockAnalyticsData } from '../mocks/mockAnalytics';

export const getAnalytics = async (params = {}) => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = { ...mockAnalyticsData };
        if (params.hazardType && params.hazardType !== 'all') {
          // Filter by hazard type if requested
          filtered = {
            ...filtered,
            byHazardType: {
              [params.hazardType]: mockAnalyticsData.byHazardType[params.hazardType] || 0
            }
          };
        }
        resolve(filtered);
      }, 400);
    });
  }
  return client.get('/analytics/summary', { params });
};

export const getAnalyticsByHazard = async () => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAnalyticsData.byHazardType), 300);
    });
  }
  return client.get('/analytics/by-hazard');
};

export const getAnalyticsOverTime = async () => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAnalyticsData.overTime), 300);
    });
  }
  return client.get('/analytics/over-time');
};

export const getAnalyticsByRegion = async () => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockAnalyticsData.byRegion), 300);
    });
  }
  return client.get('/analytics/by-region');
};
