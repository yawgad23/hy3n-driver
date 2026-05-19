import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function TripRouteMap({ pickupLat, pickupLng, dropoffLat, dropoffLng, pickupLocation, dropoffLocation }) {
  useEffect(() => {
    // Fix for default marker icon issue in Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  const pickupIcon = L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  const dropoffIcon = L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  const hasValidCoordinates = pickupLat && pickupLng && dropoffLat && dropoffLng;

  if (!hasValidCoordinates) {
    return (
      <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No map data available</p>
      </div>
    );
  }

  const center = [(pickupLat + dropoffLat) / 2, (pickupLng + dropoffLng) / 2];
  const polylinePoints = [[pickupLat, pickupLng], [dropoffLat, dropoffLng]];

  return (
    <div className="h-64 rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: "256px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
          <Popup>
            <strong>Pickup</strong>
            <br />
            {pickupLocation || "Pickup location"}
          </Popup>
        </Marker>
        <Marker position={[dropoffLat, dropoffLng]} icon={dropoffIcon}>
          <Popup>
            <strong>Dropoff</strong>
            <br />
            {dropoffLocation || "Dropoff location"}
          </Popup>
        </Marker>
        <Polyline
          positions={polylinePoints}
          color="#3b82f6"
          weight={4}
          opacity={0.7}
          dashArray="5, 10"
        />
      </MapContainer>
    </div>
  );
}