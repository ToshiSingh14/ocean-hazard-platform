/**
 * Geocoding Utility for AquaPulse
 * Reverse geocodes [latitude, longitude] to human-readable coastal / city / state address using OpenStreetMap Nominatim.
 * Provides resilient fallbacks and timeouts to avoid blocking report submissions.
 */

export async function reverseGeocode(lat, lng, timeoutMs = 4000) {
  const fallback = `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return fallback;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    const addr = data.address || {};

    // Prioritize natural coastal landmarks or locality
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.beach ||
      addr.coastal ||
      addr.natural ||
      addr.tourism ||
      addr.quarter ||
      addr.village ||
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
      // Remove adjacent duplicate entries if city equals state or locality
      const uniqueParts = parts.filter((part, idx) => parts.indexOf(part) === idx);
      return uniqueParts.join(', ');
    }

    if (data.display_name) {
      // Return first 3 segments of display name
      return data.display_name.split(',').slice(0, 3).map((s) => s.trim()).join(', ');
    }

    return fallback;
  } catch (err) {
    clearTimeout(timeoutId);
    return fallback;
  }
}
