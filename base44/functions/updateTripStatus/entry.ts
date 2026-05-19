import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tripId, status } = payload;

    if (!tripId || !status) {
      return Response.json({ error: 'Missing tripId or status' }, { status: 400 });
    }

    // Get the trip
    const trip = await base44.entities.Trip.get(tripId);
    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify this driver is assigned to this trip
    const drivers = await base44.entities.Driver.filter({ email: user.email });
    if (!drivers || drivers.length === 0) {
      return Response.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const driver = drivers[0];
    if (trip.driver_id !== driver.id) {
      return Response.json({ error: 'Not assigned to this trip' }, { status: 403 });
    }

    // Update trip status
    await base44.entities.Trip.update(tripId, { status });

    // If trip is completed or cancelled, update driver status
    if (status === 'completed' || status === 'cancelled') {
      await base44.entities.Driver.update(driver.id, {
        status: 'active',
        total_trips: (driver.total_trips || 0) + (status === 'completed' ? 1 : 0),
        total_earnings: (driver.total_earnings || 0) + (status === 'completed' ? (trip.fare || 0) : 0),
      });
    }

    return Response.json({ 
      success: true, 
      message: `Trip ${status}`,
      trip: { ...trip, status }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});