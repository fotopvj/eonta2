/**
 * Map Utility Functions for EONTA
 * Contains helper functions for map operations, distance calculations,
 * polygon operations, and coordinate handling
 */

/**
 * Calculate distance between two coordinates in meters
 * @param {Object} point1 - {lat, lng} coordinates
 * @param {Object} point2 - {lat, lng} coordinates
 * @returns {Number} Distance in meters
 */
export function calculateDistance(point1, point2) {
  // Use Haversine formula to calculate distance between points
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // Distance in meters
}

/**
 * Convert degrees to radians
 * @param {Number} degrees - Angle in degrees
 * @returns {Number} Angle in radians
 */
export function toRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Calculate distance from point to line segment
 * @param {Number} x - Point x coordinate
 * @param {Number} y - Point y coordinate
 * @param {Number} x1 - Line segment start x
 * @param {Number} y1 - Line segment start y
 * @param {Number} x2 - Line segment end x
 * @param {Number} y2 - Line segment end y
 * @returns {Number} Distance in coordinate units (needs conversion to meters)
 */
export function distanceToLine(x, y, x1, y1, x2, y2) {
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq !== 0) {
    param = dot / len_sq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  
  // Convert to meters using rough approximation
  // 0.00001 in lat/lng ≈ 1.1m at the equator
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

/**
 * Calculate the center point of a polygon
 * @param {Array} points - Array of {lat, lng} coordinates
 * @returns {Object} Center point as {lat, lng}
 */
export function calculatePolygonCenter(points) {
  if (!points || points.length === 0) {
    return null;
  }
  
  let sumLat = 0;
  let sumLng = 0;
  
  for (const point of points) {
    sumLat += point.lat;
    sumLng += point.lng;
  }
  
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Check if a point is inside a polygon
 * @param {Object} point - {lat, lng} coordinates
 * @param {Array} polygon - Array of {lat, lng} coordinates
 * @returns {Boolean} True if point is inside polygon
 */
export function isPointInPolygon(point, polygon) {
  // Ray casting algorithm
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Get distance to polygon edge
 * Negative if inside, positive if outside
 * @param {Object} position - {lat, lng} coordinates
 * @param {Array} polygon - Array of {lat, lng} coordinates
 * @returns {Number} Distance in meters
 */
export function getDistanceToBoundaryEdge(position, polygon) {
  // Check if point is inside polygon
  const isInside = isPointInPolygon(position, polygon);
  
  // Find nearest edge
  let minDistance = Infinity;
  
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    
    const distance = distanceToLine(
      position.lat, position.lng,
      p1.lat, p1.lng,
      p2.lat, p2.lng
    );
    
    minDistance = Math.min(minDistance, distance);
  }
  
  // Return negative if inside, positive if outside
  return isInside ? -minDistance : minDistance;
}

/**
 * Simplify a complex polygon by reducing the number of points
 * while maintaining the general shape
 * @param {Array} points - Array of {lat, lng} coordinates
 * @param {Number} tolerance - Distance tolerance for simplification
 * @returns {Array} Simplified array of coordinates
 */
export function simplifyPolygon(points, tolerance = 0.00001) {
  if (points.length <= 2) return points;
  
  // Douglas-Peucker algorithm
  const findFurthestPoint = (start, end) => {
    let maxDistance = 0;
    let maxIndex = 0;
    
    for (let i = start + 1; i < end; i++) {
      const distance = distanceToLine(
        points[i].lat, points[i].lng,
        points[start].lat, points[start].lng,
        points[end].lat, points[end].lng
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    return { maxDistance, maxIndex };
  };
  
  const simplifySegment = (start, end, result) => {
    const { maxDistance, maxIndex } = findFurthestPoint(start, end);
    
    if (maxDistance > tolerance) {
      // Recursively simplify the segments
      simplifySegment(start, maxIndex, result);
      simplifySegment(maxIndex, end, result);
    } else {
      if (!result.includes(points[end])) {
        result.push(points[end]);
      }
    }
  };
  
  const result = [points[0]];
  simplifySegment(0, points.length - 1, result);
  
  return result;
}

/**
 * Expand a polygon outward by a given distance
 * @param {Array} polygon - Array of {lat, lng} coordinates
 * @param {Number} distance - Distance in meters to expand
 * @returns {Array} Expanded polygon
 */
export function expandPolygon(polygon, distance) {
  // Convert distance to approximate degrees
  // This is a simplified approach - actual implementation would use
  // a more complex algorithm for proper geodesic calculations
  const distanceDegrees = distance / 111000;
  
  const center = calculatePolygonCenter(polygon);
  
  return polygon.map(point => {
    // Get vector from center to point
    const dx = point.lng - center.lng;
    const dy = point.lat - center.lat;
    
    // Normalize vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / length;
    const ny = dy / length;
    
    // Return expanded point
    return {
      lat: point.lat + ny * distanceDegrees,
      lng: point.lng + nx * distanceDegrees
    };
  });
}

export default {
  calculateDistance,
  toRad,
  distanceToLine,
  calculatePolygonCenter,
  isPointInPolygon,
  getDistanceToBoundaryEdge,
  simplifyPolygon,
  expandPolygon
};
