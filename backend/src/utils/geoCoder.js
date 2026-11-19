/**
 * Server-side reverse geocoder with resilient fallback.
 * Uses Nominatim OpenStreetMap API via global fetch (Node 18+).
 * @param {number} lng - Longitude (GeoJSON)
 * @param {number} lat - Latitude (GeoJSON)
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<string|null>} Resolved location name or null
 */
async function reverseGeocodeServer(lng, lat, timeoutMs = 5000) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AquaPulse-OceanHazardPlatform/1.0',
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const addr = data.address || {};

    const locality =
      addr.beach ||
      addr.suburb ||
      addr.neighbourhood ||
      addr.coastal ||
      addr.natural ||
      addr.tourism ||
      addr.quarter ||
      addr.village ||
      addr.residential ||
      addr.road ||
      '';

    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      '';

    const state = addr.state || '';
    const parts = [locality, city, state].filter(Boolean);

    if (parts.length > 0) {
      const uniqueParts = parts.filter((part, idx) => parts.indexOf(part) === idx);
      return uniqueParts.join(', ');
    }

    if (data.display_name) {
      return data.display_name.split(',').slice(0, 3).map((s) => s.trim()).join(', ');
    }

    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    return null;
  }
}

module.exports = { reverseGeocodeServer };
