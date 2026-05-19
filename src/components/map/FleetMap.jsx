import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { divIcon } from "leaflet";
import { Car, MapPin, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

// Custom marker icons
const createDriverIcon = (status) => {
  const colors = {
    active: "#10b981",
    on_trip: "#3b82f6",
    offline: "#6b7280",
    suspended: "#ef4444",
  };
  
  return divIcon({
    html: `
      <div style="
        background: ${colors[status] || colors.active};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    className: "driver-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createTripIcon = () => {
  return divIcon({
    html: `
      <div style="
        background: #f59e0b;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    className: "trip-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const statusColors = {
  active: "bg-accent text-accent-foreground",
  on_trip: "bg-primary text-primary-foreground",
  offline: "bg-muted text-muted-foreground",
  suspended: "bg-destructive text-destructive-foreground",
};

export default function FleetMap({ drivers, trips, className }) {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default: NYC
  const [zoom, setZoom] = useState(12);

  // Auto-center map based on active drivers
  useEffect(() => {
    const activeDrivers = drivers?.filter(d => d.latitude && d.longitude) || [];
    if (activeDrivers.length > 0) {
      const avgLat = activeDrivers.reduce((sum, d) => sum + d.latitude, 0) / activeDrivers.length;
      const avgLng = activeDrivers.reduce((sum, d) => sum + d.longitude, 0) / activeDrivers.length;
      setMapCenter([avgLat, avgLng]);
      setZoom(13);
    }
  }, [drivers]);

  const activeDrivers = drivers?.filter(d => d.status === "active" || d.status === "on_trip") || [];
  const pendingTrips = trips?.filter(t => t.status === "pending" || t.status === "in_progress") || [];

  return (
    <div className={cn("rounded-2xl overflow-hidden border border-border shadow-lg", className)}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-[500px] w-full bg-background"
        style={{ background: "hsl(var(--card))" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver Markers */}
        {activeDrivers.map((driver) => (
          driver.latitude && driver.longitude && (
            <Marker
              key={driver.id}
              position={[driver.latitude, driver.longitude]}
              icon={createDriverIcon(driver.status)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{driver.full_name}</p>
                      <Badge variant="outline" className={cn("text-xs mt-1", statusColors[driver.status])}>
                        {driver.status === "on_trip" ? "On Trip" : driver.status}
                      </Badge>
                    </div>
                  </div>
                  {driver.vehicle_model && (
                    <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
                  )}
                  {driver.vehicle_plate && (
                    <p className="text-xs text-muted-foreground font-mono">{driver.vehicle_plate}</p>
                  )}
                  {driver.rating && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                      <span>⭐ {driver.rating.toFixed(1)}</span>
                      <span>•</span>
                      <span>{driver.total_trips} trips</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Trip Markers & Routes */}
        {pendingTrips.map((trip) => {
          const hasCoords = trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng;
          return (
            <div key={trip.id}>
              {/* Pickup Marker */}
              {trip.pickup_lat && trip.pickup_lng && (
                <Marker
                  position={[trip.pickup_lat, trip.pickup_lng]}
                  icon={createTripIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-primary" />
                        </div>
                        <p className="font-semibold text-sm">Pickup</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{trip.pickup_location}</p>
                      <p className="text-xs mt-1 font-medium">{trip.driver_name}</p>
                      {trip.passenger_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">→ {trip.passenger_name}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Dropoff Marker */}
              {trip.dropoff_lat && trip.dropoff_lng && (
                <Marker position={[trip.dropoff_lat, trip.dropoff_lng]}>
                  <Popup>
                    <div className="p-2 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                          <Navigation className="w-3 h-3 text-accent" />
                        </div>
                        <p className="font-semibold text-sm">Dropoff</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{trip.dropoff_location}</p>
                      {trip.fare && (
                        <p className="text-xs font-semibold mt-2">${trip.fare.toFixed(2)}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Line */}
              {hasCoords && (
                <Polyline
                  positions={[
                    [trip.pickup_lat, trip.pickup_lng],
                    [trip.dropoff_lat, trip.dropoff_lng]
                  ]}
                  pathOptions={{
                    color: trip.status === "in_progress" ? "#3b82f6" : "#f59e0b",
                    weight: 3,
                    opacity: 0.7,
                    dashArray: trip.status === "pending" ? "5, 5" : null,
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}