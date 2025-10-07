const db = require('../config/database');
const logger = require('../utils/logger.util');

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate location against geofences
 */
exports.validateLocation = async (latitude, longitude) => {
  try {
    // Get all active geofences
    const result = await db.query(
      'SELECT * FROM geofences WHERE is_active = true'
    );

    if (result.rows.length === 0) {
      // No geofences configured - allow by default
      return { valid: true, geofenceId: null };
    }

    // Check each geofence
    for (const geofence of result.rows) {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(geofence.latitude),
        parseFloat(geofence.longitude)
      );

      logger.debug('Geofence check', {
        geofenceName: geofence.name,
        distance,
        radius: geofence.radius_meters
      });

      if (distance <= geofence.radius_meters) {
        return {
          valid: true,
          geofenceId: geofence.id,
          geofenceName: geofence.name,
          distance
        };
      }
    }

    // Not within any geofence
    return {
      valid: false,
      geofenceId: null,
      message: 'Location is outside all configured geofences'
    };

  } catch (error) {
    logger.error('Geofence validation error:', error);
    // On error, allow by default
    return { valid: true, geofenceId: null };
  }
};

/**
 * Get all geofences
 */
exports.getGeofences = async () => {
  try {
    const result = await db.query(
      'SELECT * FROM geofences WHERE is_active = true ORDER BY created_at DESC'
    );

    return result.rows;

  } catch (error) {
    logger.error('Get geofences error:', error);
    throw error;
  }
};