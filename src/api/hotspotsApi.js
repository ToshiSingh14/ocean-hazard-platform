import client from './client';
import { USE_MOCKS } from '../config';
import { mockHotspots } from '../mocks/mockIncidents';

export const getHotspots = async (params = {}) => {
  if (USE_MOCKS) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let hotspots = [...mockHotspots];
        if (params.lat && params.lng && params.radiusKm) {
          // Mock distance filter (Haversine formula approx)
          const targetLat = parseFloat(params.lat);
          const targetLng = parseFloat(params.lng);
          const radius = parseFloat(params.radiusKm);

          hotspots = hotspots.filter((h) => {
            const [hLng, hLat] = h.centroid;
            const dLat = (hLat - targetLat) * 111; // ~111km per degree lat
            const dLng = (hLng - targetLng) * 111 * Math.cos(targetLat * (Math.PI / 180));
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            return dist <= radius;
          });
        }
        resolve(hotspots);
      }, 350);
    });
  }
  return client.get('/hotspots', { params });
};
