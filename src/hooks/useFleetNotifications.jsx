import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { requestNotificationPermission, showNotification, playNotificationSound } from '@/lib/notifications';

export default function useFleetNotifications() {
  const initializedRef = useRef(false);
  const lastTripStatusRef = useRef(new Map());
  const lastDriverStatusRef = useRef(new Map());

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
      }

      // Subscribe to Trip changes
      const unsubscribeTrips = base44.entities.Trip.subscribe((event) => {
        if (event.type === 'create' || event.type === 'update') {
          const trip = event.data;
          const oldStatus = lastTripStatusRef.current.get(trip.id);
          
          // Check if status changed to 'pending'
          if (trip.status === 'pending' && oldStatus !== 'pending') {
            showNotification('🚗 New Trip Request', {
              body: `${trip.driver_name} - ${trip.pickup_location} → ${trip.dropoff_location}`,
              tag: `trip-${trip.id}`,
              requireInteraction: false,
            });
            playNotificationSound();
          }
          
          // Update stored status
          lastTripStatusRef.current.set(trip.id, trip.status);
        } else if (event.type === 'delete') {
          lastTripStatusRef.current.delete(event.id);
        }
      });

      // Subscribe to Driver changes
      const unsubscribeDrivers = base44.entities.Driver.subscribe((event) => {
        if (event.type === 'update') {
          const driver = event.data;
          const oldStatus = lastDriverStatusRef.current.get(driver.id);
          
          // Check if driver went offline during active shift
          if (
            driver.status === 'offline' && 
            (oldStatus === 'active' || oldStatus === 'on_trip')
          ) {
            showNotification('⚠️ Driver Went Offline', {
              body: `${driver.full_name} (${driver.vehicle_model}) is now offline`,
              tag: `driver-${driver.id}`,
              requireInteraction: false,
            });
            playNotificationSound();
          }
          
          // Update stored status
          lastDriverStatusRef.current.set(driver.id, driver.status);
        } else if (event.type === 'delete') {
          lastDriverStatusRef.current.delete(event.id);
        }
      });

      // Initial data load
      const loadInitialData = async () => {
        try {
          const trips = await base44.entities.Trip.list();
          trips.forEach(trip => {
            lastTripStatusRef.current.set(trip.id, trip.status);
          });
          
          const drivers = await base44.entities.Driver.list();
          drivers.forEach(driver => {
            lastDriverStatusRef.current.set(driver.id, driver.status);
          });
        } catch (error) {
          console.error('Failed to load initial data for notifications:', error);
        }
      };
      
      loadInitialData();

      // Cleanup
      return () => {
        unsubscribeTrips();
        unsubscribeDrivers();
      };
    };

    initNotifications();
  }, []);

  return null;
}