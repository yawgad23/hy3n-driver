import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Safety thresholds
const THRESHOLDS = {
  max_speed: 120,            // km/h
  hard_braking_events: 3,   // count
  rapid_acceleration_events: 3,
  sharp_turns: 5,
  safety_score_low: 60,     // below this = flagged
};

function computeSeverity(violations, safetyScore) {
  if (!violations.length) return null;
  if (safetyScore !== null && safetyScore < 30) return "critical";
  if (violations.length >= 3 || (safetyScore !== null && safetyScore < 50)) return "high";
  if (violations.length === 2) return "medium";
  return "low";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Only process completed trips with safety_data
    if (event?.type !== "update" && event?.type !== "create") {
      return Response.json({ skipped: true, reason: "not a relevant event" });
    }

    const trip = data;
    if (!trip || !trip.safety_data) {
      return Response.json({ skipped: true, reason: "no safety_data present" });
    }

    const sd = trip.safety_data;
    const violations = [];

    if (sd.max_speed !== undefined && sd.max_speed > THRESHOLDS.max_speed) {
      violations.push(`Excessive speed: ${sd.max_speed} km/h (limit ${THRESHOLDS.max_speed} km/h)`);
    }
    if (sd.hard_braking_events !== undefined && sd.hard_braking_events > THRESHOLDS.hard_braking_events) {
      violations.push(`Hard braking: ${sd.hard_braking_events} events (limit ${THRESHOLDS.hard_braking_events})`);
    }
    if (sd.rapid_acceleration_events !== undefined && sd.rapid_acceleration_events > THRESHOLDS.rapid_acceleration_events) {
      violations.push(`Rapid acceleration: ${sd.rapid_acceleration_events} events (limit ${THRESHOLDS.rapid_acceleration_events})`);
    }
    if (sd.sharp_turns !== undefined && sd.sharp_turns > THRESHOLDS.sharp_turns) {
      violations.push(`Sharp turns: ${sd.sharp_turns} (limit ${THRESHOLDS.sharp_turns})`);
    }
    if (sd.safety_score !== undefined && sd.safety_score < THRESHOLDS.safety_score_low) {
      violations.push(`Low safety score: ${sd.safety_score}/100`);
    }

    if (violations.length === 0) {
      return Response.json({ skipped: true, reason: "no violations detected" });
    }

    const severity = computeSeverity(violations, sd.safety_score ?? null);

    // Check if alert already exists for this trip to avoid duplicates
    const existing = await base44.asServiceRole.entities.SafetyAlert.filter({ trip_id: trip.id });
    if (existing && existing.length > 0) {
      // Update existing alert with latest data
      await base44.asServiceRole.entities.SafetyAlert.update(existing[0].id, {
        violations,
        severity,
        safety_score: sd.safety_score ?? null,
        max_speed: sd.max_speed ?? null,
        hard_braking_events: sd.hard_braking_events ?? null,
        rapid_acceleration_events: sd.rapid_acceleration_events ?? null,
        sharp_turns: sd.sharp_turns ?? null,
      });
      return Response.json({ updated: true, alertId: existing[0].id, violations, severity });
    }

    // Create new safety alert
    const alert = await base44.asServiceRole.entities.SafetyAlert.create({
      trip_id: trip.id,
      driver_id: trip.driver_id || null,
      driver_name: trip.driver_name || "Unknown Driver",
      trip_date: trip.trip_date || trip.created_date,
      pickup_location: trip.pickup_location || null,
      dropoff_location: trip.dropoff_location || null,
      violations,
      severity,
      safety_score: sd.safety_score ?? null,
      max_speed: sd.max_speed ?? null,
      hard_braking_events: sd.hard_braking_events ?? null,
      rapid_acceleration_events: sd.rapid_acceleration_events ?? null,
      sharp_turns: sd.sharp_turns ?? null,
      status: "open",
    });

    return Response.json({ created: true, alertId: alert.id, violations, severity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});