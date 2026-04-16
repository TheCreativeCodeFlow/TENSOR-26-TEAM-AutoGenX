// Simplified India coastline coordinates
// Format: [longitude, latitude]

export const indiaCoastline: [number, number][] = [
  // Gujarat coast
  [68.2, 23.7], [68.5, 23.2], [69.0, 22.7], [69.5, 22.3], [70.0, 21.8], [70.3, 21.4], [70.5, 21.0],
  // Maharashtra coast
  [70.6, 20.6], [72.8, 19.0], [72.9, 18.5], [73.0, 18.0], [73.2, 17.5], [73.5, 17.0], [73.8, 16.5],
  // Goa & Karnataka
  [74.0, 15.9], [74.2, 15.0], [74.5, 14.5], [74.8, 14.0],
  // Kerala
  [75.0, 13.5], [75.3, 13.0], [75.5, 12.5], [75.7, 12.0], [76.0, 11.5], [76.2, 11.0],
  // Tamil Nadu
  [77.0, 10.5], [77.3, 10.0], [77.5, 9.5], [77.8, 9.0], [78.0, 8.5], [78.2, 8.0], [78.5, 7.5], [78.8, 7.0],
  [79.0, 6.5], [79.2, 6.0], [79.3, 5.5],
  // Andhra Pradesh
  [79.5, 5.0], [80.0, 4.5], [80.5, 4.0], [81.0, 3.5], [81.5, 3.0], [82.0, 2.5], [82.5, 2.0],
  // Odisha
  [83.0, 1.8], [83.5, 1.5], [84.0, 1.2], [84.5, 0.8], [85.0, 0.5], [85.5, 0.3], [86.0, 0.0],
  // West Bengal
  [86.5, -0.2], [87.0, -0.5], [87.5, -0.8], [88.0, -1.0], [88.5, -1.2], [89.0, -1.3], [89.5, -1.5], [90.0, -1.8],
];

// Boat class speeds in knots
export const BOAT_SPEEDS = {
  A: 8,
  B: 10,
  C: 12,
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Get nearest coastline point for direction calculation
function getNearestCoastPoint(lat: number, lon: number): { lat: number; lon: number; distance: number } {
  let nearest = { lat: 0, lon: 0, distance: Infinity };
  for (const [coastLon, coastLat] of indiaCoastline) {
    const distance = haversineDistance(lat, lon, coastLat, coastLon);
    if (distance < nearest.distance) {
      nearest = { lat: coastLat, lon: coastLon, distance };
    }
  }
  return nearest;
}

// Check if point is in the ocean (seaward side of coastline)
// Simple check: if distance to nearest coastline > 5km and we have a valid heading to ocean
export function getZoneStatus(lat: number, lon: number): { status: 'safe' | 'inland' | 'offshore'; distance: number; message: string; bearingToCoast?: number } {
  const nearest = getNearestCoastPoint(lat, lon);
  const distanceToCoast = nearest.distance;
  
  // Calculate bearing from current position to nearest coast point
  const bearingToCoast = calculateBearing(lat, lon, nearest.lat, nearest.lon);
  
  // If very close to coast (within 3km), likely on land or at shore
  if (distanceToCoast < 3) {
    return { 
      status: 'inland', 
      distance: distanceToCoast, 
      message: '📍 Near Shore',
      bearingToCoast 
    };
  }
  
  // Check if we're on the ocean side (seaward) - simple heuristic:
  // India coast runs roughly N-S, so ocean is to the East/Southeast for most of the coast
  // We'll check if the position is beyond a reasonable distance from all coastline points
  
  // If far from any coastline point (>50km), we're in the ocean beyond safe zone
  if (distanceToCoast > 50) {
    return { 
      status: 'offshore', 
      distance: distanceToCoast, 
      message: '⚠ Beyond 50km - Return to shore!',
      bearingToCoast 
    };
  }
  
  // If between 3-50km from coast, we're in the safe zone (at sea)
  if (distanceToCoast > 3 && distanceToCoast <= 50) {
    return { 
      status: 'safe', 
      distance: distanceToCoast, 
      message: '✓ Within Safe Zone',
      bearingToCoast 
    };
  }
  
  // Default to inland if very close
  return { 
    status: 'inland', 
    distance: distanceToCoast, 
    message: '📍 On Land',
    bearingToCoast 
  };
}

// Calculate bearing between two points (in degrees)
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - 
           Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export function calculateDistanceFromCoast(lat: number, lon: number): number {
  const nearest = getNearestCoastPoint(lat, lon);
  return nearest.distance;
}

export function calculateReturnTime(distanceKm: number, boatClass: string): number {
  const speed = BOAT_SPEEDS[boatClass as keyof typeof BOAT_SPEEDS] || 8;
  const roundTripHours = (distanceKm / speed) * 2 * 1.2;
  return Math.round(roundTripHours * 10) / 10;
}

export function isWithin50kmZone(lat: number, lon: number): boolean {
  const result = getZoneStatus(lat, lon);
  return result.status === 'safe' || result.status === 'inland';
}