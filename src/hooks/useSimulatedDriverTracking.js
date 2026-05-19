import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

export function useSimulatedDriverTracking(enabledDrivers = []) {
  const intervalRef = useRef(null);
  const positionsRef = useRef({});

  useEffect(() => {
    if (!enabledDrivers || enabledDrivers.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initialize positions for new drivers
    enabledDrivers.forEach(driver => {
      if (!positionsRef.current[driver.id]) {
        positionsRef.current[driver.id] = {
          latitude: driver.latitude || 40.7128,
          longitude: driver.longitude || -74.0060,
          speed: 0.0005 + Math.random() * 0.0005,
          direction: Math.random() * 360,
        };
      }
    });

    // Update positions every 3 seconds
    intervalRef.current = setInterval(async () => {
      const updates = [];

      enabledDrivers.forEach(driver => {
        const pos = positionsRef.current[driver.id];
        if (!pos) return;

        // Simulate movement with slight direction changes
        pos.direction += (Math.random() - 0.5) * 30;
        const rad = (pos.direction * Math.PI) / 180;

        pos.latitude += pos.speed * Math.cos(rad);
        pos.longitude += pos.speed * Math.sin(rad);

        // Keep within NYC bounds
        pos.latitude = Math.max(40.5, Math.min(40.9, pos.latitude));
        pos.longitude = Math.max(-74.3, Math.min(-73.7, pos.longitude));

        updates.push({
          id: driver.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
          last_location_update: new Date().toISOString(),
        });
      });

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
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabledDrivers]);

  return positionsRef.current;
}