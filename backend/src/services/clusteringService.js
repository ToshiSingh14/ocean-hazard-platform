const EARTH_RADIUS_METERS = 6371000;

function distanceMeters([lng1, lat1], [lng2, lat2]) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

function isWithinRadius(reportCoordinates, incidentCoordinates, radiusMeters = 1200) {
  if (
    !Array.isArray(reportCoordinates) ||
    !Array.isArray(incidentCoordinates) ||
    reportCoordinates.length !== 2 ||
    incidentCoordinates.length !== 2 ||
    !Number.isFinite(radiusMeters) ||
    radiusMeters < 0
  ) {
    return false;
  }

  return distanceMeters(reportCoordinates, incidentCoordinates) <= radiusMeters;
}

module.exports = { distanceMeters, isWithinRadius };
