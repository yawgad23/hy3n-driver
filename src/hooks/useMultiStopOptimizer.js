/**
 * Multi-stop route optimization using nearest-neighbour heuristic (TSP approximation).
 * Each trip contributes 2 stops: pickup then dropoff.
 * The algorithm starts from the driver's current position and greedily picks
 * the closest unvisited stop next, keeping pickup before dropoff for each trip.
 */

// Haversine distance in km between two lat/lng points
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lat2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build an ordered stop list from trips + driver position.
 * @param {Array} trips  - array of Trip objects with pickup_lat/lng, dropoff_lat/lng
 * @param {number} driverLat
 * @param {number} driverLng
 * @returns {Array} ordered stops: { id, tripId, type, label, lat, lng, passengerName, address, fare }
 */
export function optimizeStops(trips, driverLat, driverLng) {
  if (!trips || trips.length === 0) return [];

  // Create stop pool: each trip → pickup stop + dropoff stop
  // Constraint: pickup must come before its dropoff
  const stops = [];
  trips.forEach((trip, idx) => {
    stops.push({
      id: `${trip.id}-pickup`,
      tripId: trip.id,
      tripIndex: idx,
      type: "pickup",
      lat: trip.pickup_lat || (driverLat + (Math.random() - 0.5) * 0.05),
      lng: trip.pickup_lng || (driverLng + (Math.random() - 0.5) * 0.05),
      label: trip.pickup_location,
      address: trip.pickup_location,
      passengerName: trip.passenger_name || "Passenger",
      fare: trip.fare || 0,
    });
    stops.push({
      id: `${trip.id}-dropoff`,
      tripId: trip.id,
      tripIndex: idx,
      type: "dropoff",
      lat: trip.dropoff_lat || (driverLat + (Math.random() - 0.5) * 0.08),
      lng: trip.dropoff_lng || (driverLng + (Math.random() - 0.5) * 0.08),
      label: trip.dropoff_location,
      address: trip.dropoff_location,
      passengerName: trip.passenger_name || "Passenger",
      fare: trip.fare || 0,
    });
  });

  const visited = new Set();
  const pickedUp = new Set(); // tripIds whose pickup has been visited
  const ordered = [];

  let curLat = driverLat;
  let curLng = driverLng;

  while (ordered.length < stops.length) {
    let bestStop = null;
    let bestDist = Infinity;

    for (const stop of stops) {
      if (visited.has(stop.id)) continue;
      // Can't visit a dropoff before the pickup of the same trip
      if (stop.type === "dropoff" && !pickedUp.has(stop.tripId)) continue;

      const d = haversine(curLat, curLng, stop.lat, stop.lng);
      if (d < bestDist) {
        bestDist = d;
        bestStop = stop;
      }
    }

    if (!bestStop) break;

    visited.add(bestStop.id);
    if (bestStop.type === "pickup") pickedUp.add(bestStop.tripId);

    ordered.push({
      ...bestStop,
      distanceFromPrev: bestDist,
      estimatedMinutes: Math.round((bestDist / 40) * 60), // ~40 km/h average city speed
    });

    curLat = bestStop.lat;
    curLng = bestStop.lng;
  }

  // Annotate with cumulative totals
  let cumDist = 0;
  let cumMin = 0;
  return ordered.map((stop, idx) => {
    cumDist += stop.distanceFromPrev;
    cumMin += stop.estimatedMinutes;
    return { ...stop, stopNumber: idx + 1, cumDistKm: +cumDist.toFixed(2), cumMinutes: cumMin };
  });
}

/**
 * Summaries for display
 */
export function routeSummary(optimizedStops) {
  if (!optimizedStops.length) return { totalKm: 0, totalMin: 0, totalFare: 0 };
  const last = optimizedStops[optimizedStops.length - 1];
  const fares = new Set();
  let totalFare = 0;
  optimizedStops.forEach(s => {
    if (s.type === "dropoff" && !fares.has(s.tripId)) {
      fares.add(s.tripId);
      totalFare += s.fare || 0;
    }
  });
  return { totalKm: last.cumDistKm, totalMin: last.cumMinutes, totalFare: +totalFare.toFixed(2) };
}