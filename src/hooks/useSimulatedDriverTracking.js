import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

export function useSimulatedDriverTracking(enabledDrivers) {
  const intervalRef = useRef(null);
  const positionsRef = useRef({});
  const previousPositionsRef = useRef({});
  const [movementStatus, setMovementStatus] = useState({});

  useEffect(() => {
    if (!enabledDrivers || enabledDrivers.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setMovementStatus({});
      return;
    }

    // Initialize positions for new drivers
    enabledDrivers.forEach(driver => {
      if (!positionsRef.current[driver.id]) {
        const baseLat = driver.latitude || 40.7128;
        const baseLng = driver.longitude || -74.0060;
        positionsRef.current[driver.id] = {
          latitude: baseLat,
          longitude: baseLng,
          speed: driver.status === "on_trip" ? 0.0008 : 0.0003 + Math.random() * 0.0004,
          direction: Math.random() * 360,
          moving: false,
        };
        previousPositionsRef.current[driver.id] = { latitude: baseLat, longitude: baseLng };
      }
    });

    // Update positions every 2 seconds for smoother movement
    intervalRef.current = setInterval(async () => {
      const updates = [];
      const newMovementStatus = {};

      enabledDrivers.forEach(driver => {
        const pos = positionsRef.current[driver.id];
        const prevPos = previousPositionsRef.current[driver.id];
        if (!pos) return;

        // Drivers on trip move faster and more directly
        if (driver.status === "on_trip") {
          // Simulate route progression with less random direction changes
          pos.direction += (Math.random() - 0.5) * 15;
          pos.speed = 0.0008 + Math.random() * 0.0002;
        } else if (driver.status === "active") {
          // Active drivers patrol with more random movement
          pos.direction += (Math.random() - 0.5) * 45;
          // Occasionally stop (simulate waiting for requests)
          if (Math.random() > 0.8) {
            pos.moving = !pos.moving;
          }
          pos.speed = pos.moving ? 0.0004 + Math.random() * 0.0003 : 0;
        }

        const rad = (pos.direction * Math.PI) / 180;
        const newLat = pos.latitude + pos.speed * Math.cos(rad);
        const newLng = pos.longitude + pos.speed * Math.sin(rad);

        // Keep within NYC bounds
        pos.latitude = Math.max(40.5, Math.min(40.9, newLat));
        pos.longitude = Math.max(-74.3, Math.min(-73.7, newLng));

        // Calculate movement status
        const latDiff = Math.abs(pos.latitude - prevPos.latitude);
        const lngDiff = Math.abs(pos.longitude - prevPos.longitude);
        const distanceMoved = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (driver.status === "offline" || driver.status === "suspended") {
          newMovementStatus[driver.id] = "stationary";
        } else if (distanceMoved < 0.0001) {
          newMovementStatus[driver.id] = "stationary";
        } else if (driver.status === "on_trip") {
          newMovementStatus[driver.id] = "on_trip";
        } else {
          newMovementStatus[driver.id] = "moving";
        }

        updates.push({
          id: driver.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          last_location_update: new Date().toISOString(),
        });

        // Store previous position
        previousPositionsRef.current[driver.id] = {
          latitude: pos.latitude,
          longitude: pos.longitude,
        };
      });

      // Update movement status state
      setMovementStatus(prev => ({ ...prev, ...newMovementStatus }));

      // Batch update all drivers
      if (updates.length > 0) {
        try {
          await Promise.all(
            updates.map(update => 
              base44.entities.Driver.update(update.id, {
                latitude: update.latitude,
                longitude: update.longitude,
                last_location_update: update.last_location_update,
              })
            )
          );
        } catch (error) {
          console.error("Failed to update driver positions:", error);
        }
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabledDrivers]);

  return { positions: positionsRef.current, movementStatus };
}