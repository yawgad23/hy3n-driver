import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tripId, action } = payload;

    if (!tripId || !action) {
      return Response.json({ error: 'Missing tripId or action' }, { status: 400 });
    }

    // Get the trip
    const trip = await base44.entities.Trip.get(tripId);
    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (action === 'accept') {
      // Find driver record for this user
      const drivers = await base44.entities.Driver.filter({ email: user.email });
      if (!drivers || drivers.length === 0) {
        return Response.json({ error: 'Driver profile not found' }, { status: 404 });
      }

      const driver = drivers[0];

      // Update trip with driver assignment
      await base44.entities.Trip.update(tripId, {
        driver_id: driver.id,
        driver_name: driver.full_name,
        status: 'in_progress',
        trip_date: new Date().toISOString(),
      });

      // Update driver status
      await base44.entities.Driver.update(driver.id, {
        status: 'on_trip',
      });

      return Response.json({ 
        success: true, 
        message: 'Trip accepted',
        trip: { ...trip, driver_id: driver.id, status: 'in_progress' }
      });
    } else if (action === 'decline') {
      // Just mark trip as pending again or cancelled
      await base44.entities.Trip.update(tripId, {
        status: 'pending',
      });

      return Response.json({ 
        success: true, 
        message: 'Trip declined'
      });
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});