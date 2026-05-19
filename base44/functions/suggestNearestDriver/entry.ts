import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Haversine formula to calculate distance between two GPS coordinates in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

// Calculate driver score based on multiple factors
function calculateDriverScore(driver, distance, recentTrips) {
  const baseScore = 100;
  
  // Distance penalty (closer = better, max -30 points)
  const distancePenalty = Math.min(distance * 3, 30);
  
  // Recent trip penalty (prevent overloading, max -20 points)
  const tripPenalty = Math.min(recentTrips * 4, 20);
  
  // Rating bonus (max +15 points)
  const ratingBonus = (driver.rating || 0) * 3;
  
  // Status bonus (on_trip drivers already en route get slight penalty)
  const statusBonus = driver.status === "active" ? 5 : 0;
  
  return Math.max(0, baseScore - distancePenalty - tripPenalty + ratingBonus + statusBonus);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickup_lat, pickup_lng, trip_id, vehicle_capacity } = await req.json();

    if (!pickup_lat || !pickup_lng) {
      return Response.json({ 
        error: 'Pickup coordinates are required' 
      }, { status: 400 });
    }

    // Get all active drivers with location data
    const drivers = await base44.entities.Driver.filter({
      status: ["active", "on_trip"]
    });

    // Filter drivers with valid coordinates
    const driversWithLocation = drivers.filter(d => 
      d.latitude && d.longitude && d.status !== "suspended"
    );

    // Get recent trips (last 24 hours) for trip history analysis
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentTrips = await base44.entities.Trip.filter({
      trip_date: { $gte: twentyFourHoursAgo },
      status: ["completed", "in_progress"]
    });

    // Count recent trips per driver
    const driverTripCounts = {};
    recentTrips.forEach(trip => {
      if (trip.driver_id) {
        driverTripCounts[trip.driver_id] = (driverTripCounts[trip.driver_id] || 0) + 1;
      }
    });

    // Calculate comprehensive scores for each driver
    const driversWithScores = driversWithLocation.map(driver => {
      const distance = calculateDistance(
        pickup_lat, 
        pickup_lng, 
        driver.latitude, 
        driver.longitude
      );
      
      const recentTripCount = driverTripCounts[driver.id] || 0;
      const score = calculateDriverScore(driver, distance, recentTripCount);
      
      return {
        ...driver,
        distance_km: parseFloat(distance.toFixed(2)),
        eta_minutes: Math.round(distance * 2.5), // Estimate: 2.5 min per km
        recent_trips_24h: recentTripCount,
        dispatch_score: Math.round(score),
      };
    });

    // Sort by dispatch score (best match first), then by distance
    const sortedDrivers = driversWithScores.sort((a, b) => {
      if (b.dispatch_score !== a.dispatch_score) {
        return b.dispatch_score - a.dispatch_score;
      }
      return a.distance_km - b.distance_km;
    });

    // Get top 5 best matches
    const bestMatches = sortedDrivers.slice(0, 5);

    return Response.json({ 
      suggestions: bestMatches,
      total_available: driversWithLocation.length,
      pickup_location: { lat: pickup_lat, lng: pickup_lng },
      analysis: {
        factors: ["distance", "recent_trips", "driver_rating", "availability"],
        recent_trips_analyzed: recentTrips.length,
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});