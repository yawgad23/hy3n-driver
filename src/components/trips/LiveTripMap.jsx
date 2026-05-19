import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { MapPin, Car } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Custom icons
const createVehicleIcon = () => {
  return L.divIcon({
    className: "vehicle-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const pickupIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dropoffIcon = L.divIcon({
  className: "custom-div-icon",
  html: `<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function LiveTripMap({ trip, driverPosition, movementStatus }) {
  const [mapCenter, setMapCenter] = useState([
    (trip.pickup_lat + trip.dropoff_lat) / 2,
    (trip.pickup_lng + trip.dropoff_lng) / 2,
  ]);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    // Fix for default marker icon issue in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  // Update map center to follow vehicle during active trip
  useEffect(() => {
    if (driverPosition?.latitude && driverPosition?.longitude && trip.status === "in_progress") {
      setMapCenter([driverPosition.latitude, driverPosition.longitude]);
      setZoom(14);
    } else if (trip.pickup_lat && trip.dropoff_lat) {
      const centerLat = (trip.pickup_lat + trip.dropoff_lat) / 2;
      const centerLng = (trip.pickup_lng + trip.dropoff_lng) / 2;
      setMapCenter([centerLat, centerLng]);
      setZoom(13);
    }
  }, [driverPosition, trip.status]);

  const hasValidCoordinates = trip.pickup_lat && trip.pickup_lng && trip.dropoff_lat && trip.dropoff_lng;

  if (!hasValidCoordinates) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No map data available</p>
      </div>
    );
  }

  const polylinePoints = [[trip.pickup_lat, trip.pickup_lng], [trip.dropoff_lat, trip.dropoff_lng]];
  const vehiclePosition = driverPosition?.latitude && driverPosition?.longitude
    ? [driverPosition.latitude, driverPosition.longitude]
    : null;

  // Calculate progress along route
  const calculateProgress = () => {
    if (!vehiclePosition || trip.status !== "in_progress") return 0;
    
    const totalDistance = Math.sqrt(
      Math.pow(trip.dropoff_lat - trip.pickup_lat, 2) + 
      Math.pow(trip.dropoff_lng - trip.pickup_lng, 2)
    );
    
    if (totalDistance === 0) return 100;
    
    const currentDistance = Math.sqrt(
      Math.pow(vehiclePosition[0] - trip.pickup_lat, 2) + 
      Math.pow(vehiclePosition[1] - trip.pickup_lng, 2)
    );
    
    return Math.min(100, Math.round((currentDistance / totalDistance) * 100));
  };

  const progress = calculateProgress();

  return (
    <div className="relative">
      {/* Progress Badge */}
      {trip.status === "in_progress" && (
        <div className="absolute top-3 left-3 z-[1000]">
          <Badge className="bg-primary text-primary-foreground gap-2 shadow-lg">
            <Car className="w-3 h-3" />
            {progress}% to pickup
          </Badge>
        </div>
      )}

      <div className="h-80 rounded-xl overflow-hidden border border-border shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={true}
          className="h-full w-full"
          style={{ minHeight: "320px" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Pickup Marker */}
          <Marker position={[trip.pickup_lat, trip.pickup_lng]} icon={pickupIcon}>
            <Popup>
              <strong className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                Pickup
              </strong>
              <br />
              {trip.pickup_location || "Pickup location"}
            </Popup>
          </Marker>

          {/* Dropoff Marker */}
          <Marker position={[trip.dropoff_lat, trip.dropoff_lng]} icon={dropoffIcon}>
            <Popup>
              <strong className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-green-500" />
                Dropoff
              </strong>
              <br />
              {trip.dropoff_location || "Dropoff location"}
            </Popup>
          </Marker>

          {/* Vehicle Marker (real-time position) */}
          {vehiclePosition && trip.status === "in_progress" && (
            <Marker position={vehiclePosition} icon={createVehicleIcon()}>
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-primary" />
                    <strong>Vehicle</strong>
                  </div>
                  <p className="text-xs text-muted-foreground">{trip.driver_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        movementStatus === "on_trip" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {movementStatus === "on_trip" ? "Moving" : "Stationary"}
                    </Badge>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Polyline */}
          <Polyline
            positions={polylinePoints}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            dashArray={trip.status === "pending" ? "5, 10" : null}
          />

          {/* Progress Line (from pickup to current position) */}
          {vehiclePosition && trip.status === "in_progress" && (
            <Polyline
              positions={[[trip.pickup_lat, trip.pickup_lng], vehiclePosition]}
              color="#10b981"
              weight={5}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* Location Labels */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>{trip.pickup_location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{trip.dropoff_location}</span>
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  );
}