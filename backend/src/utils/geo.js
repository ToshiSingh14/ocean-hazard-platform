/**
 * Geospatial Utilities for Ocean Hazard Platform
 * Uses GeoJSON coordinate order: [longitude, latitude]
 */

// Earth radius in meters (exact standard specified for geospatial operations)
const EARTH_RADIUS_METERS = 6378100;
// Earth radius in kilometers derived directly from meters
const EARTH_RADIUS_KM = EARTH_RADIUS_METERS / 1000; // 6378.1 km

/**
 * Validates whether longitude and latitude fall within valid geographical bounds.
 *
 * Bounds:
 *   Longitude: [-180, 180]
 *   Latitude:  [-90, 90]
 *
 * Supports invocation as:
 *   isValidCoordinate(lng, lat)
 *   isValidCoordinate([lng, lat])
 *   isValidCoordinate({ lng, lat })
 *
 * @param {number|number[]|object} lngOrCoord - Longitude value or coordinate array/object
 * @param {number} [lat] - Latitude value (if passed as separate arguments)
 * @returns {boolean} True if coordinates are valid finite numbers within bounds
 */
const isValidCoordinate = (lngOrCoord, lat) => {
  let longitude;
  let latitude;

  if (Array.isArray(lngOrCoord)) {
    [longitude, latitude] = lngOrCoord;
  } else if (lngOrCoord && typeof lngOrCoord === 'object') {
    longitude = lngOrCoord.lng !== undefined ? lngOrCoord.lng : lngOrCoord.longitude;
    latitude = lngOrCoord.lat !== undefined ? lngOrCoord.lat : lngOrCoord.latitude;
  } else {
    longitude = lngOrCoord;
    latitude = lat;
  }

  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return false;
  }

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return false;
  }

  return (
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

/**
 * Normalizes coordinate input into an object { lng, lat }.
 * Expects GeoJSON format [longitude, latitude] by default for arrays.
 *
 * @param {number[]|object} coord - Coordinate in [lng, lat] or { lng, lat }
 * @returns {{ lng: number, lat: number }}
 * @throws {Error} If coordinate is malformed or invalid
 */
const normalizeCoordinate = (coord) => {
  let lng;
  let lat;

  if (Array.isArray(coord)) {
    if (coord.length < 2) {
      throw new Error('Coordinate array must contain at least [longitude, latitude]');
    }
    lng = Number(coord[0]);
    lat = Number(coord[1]);
  } else if (coord && typeof coord === 'object') {
    if (Array.isArray(coord.coordinates) && coord.coordinates.length >= 2) {
      lng = Number(coord.coordinates[0]);
      lat = Number(coord.coordinates[1]);
    } else {
      lng = coord.lng !== undefined ? Number(coord.lng) : Number(coord.longitude);
      lat = coord.lat !== undefined ? Number(coord.lat) : Number(coord.latitude);
    }
  } else {
    throw new Error('Invalid coordinate format. Expected [lng, lat] or { lng, lat }');
  }

  if (!isValidCoordinate(lng, lat)) {
    throw new Error(`Invalid coordinate values: [lng: ${lng}, lat: ${lat}]. Longitude must be [-180, 180], latitude [-90, 90].`);
  }

  return { lng, lat };
};

/**
 * Calculates the great-circle distance between two points in kilometers
 * using the Haversine formula.
 *
 * Coordinates are expected in GeoJSON order: [longitude, latitude]
 *
 * @param {number[]|object} coord1 - First coordinate [lng1, lat1]
 * @param {number[]|object} coord2 - Second coordinate [lng2, lat2]
 * @returns {number} Distance in kilometers
 */
const calculateDistanceKm = (coord1, coord2) => {
  const p1 = normalizeCoordinate(coord1);
  const p2 = normalizeCoordinate(coord2);

  const toRad = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);

  const lat1Rad = toRad(p1.lat);
  const lat2Rad = toRad(p2.lat);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Converts distance in meters to radians for MongoDB $centerSphere geospatial queries.
 * Formula: radians = meters / 6,378,100
 *
 * Example MongoDB query:
 *   db.reports.find({
 *     location: {
 *       $geoWithin: {
 *         $centerSphere: [ [lng, lat], metersToRadians(radiusMeters) ]
 *       }
 *     }
 *   })
 *
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in radians
 */
const metersToRadians = (meters) => {
  if (typeof meters !== 'number' || !Number.isFinite(meters) || meters < 0) {
    throw new Error('Meters must be a non-negative finite number');
  }
  return meters / EARTH_RADIUS_METERS;
};

/**
 * Converts radians back to meters.
 *
 * @param {number} radians - Distance in radians
 * @returns {number} Distance in meters
 */
const radiansToMeters = (radians) => {
  if (typeof radians !== 'number' || !Number.isFinite(radians) || radians < 0) {
    throw new Error('Radians must be a non-negative finite number');
  }
  return radians * EARTH_RADIUS_METERS;
};

module.exports = {
  EARTH_RADIUS_METERS,
  EARTH_RADIUS_KM,
  isValidCoordinate,
  calculateDistanceKm,
  metersToRadians,
  radiansToMeters,
  normalizeCoordinate
};
