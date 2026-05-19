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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pickup_lat, pickup_lng, trip_id } = await req.json();

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

    // Calculate distance for each driver
    const driversWithDistance = driversWithLocation.map(driver => {
      const distance = calculateDistance(
        pickup_lat, 
        pickup_lng, 
        driver.latitude, 
        driver.longitude
      );
      
      return {
        ...driver,
        distance_km: parseFloat(distance.toFixed(2)),
        eta_minutes: Math.round(distance * 2.5), // Estimate: 2.5 min per km
      };
    });

    // Sort by distance (nearest first)
    const sortedDrivers = driversWithDistance.sort((a, b) => 
      a.distance_km - b.distance_km
    );

    // Get top 5 nearest drivers
    const nearestDrivers = sortedDrivers.slice(0, 5);

    return Response.json({ 
      suggestions: nearestDrivers,
      total_available: driversWithLocation.length,
      pickup_location: { lat: pickup_lat, lng: pickup_lng }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});