import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, User, Locate } from "lucide-react";

// Fix default leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const riderIcon = L.divIcon({
  html: `<div style="background:#3b82f6;border:3px solid white;border-radius:50%;width:20px;height:20px;box-shadow:0 2px 8px rgba(0,0,0,0.4);animation:pulse 2s infinite;"></div>
         <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.7}}</style>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const driverIcon = L.divIcon({
  html: `<div style="background:#10b981;border:3px solid white;border-radius:50%;width:24px;height:24px;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v2m-1 7h2m-2 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0M9 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/></svg>
         </div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const pickupIcon = L.divIcon({
  html: `<div style="background:#22c55e;border:3px solid white;border-radius:50% 50% 50% 0;width:24px;height:24px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const dropoffIcon = L.divIcon({
  html: `<div style="background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;width:24px;height:24px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions.map(p => p.join(",")).join("|")]);
  return null;
}

function RecenterButton({ position }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(position, 15)}
      style={{
        position: "absolute", bottom: 80, right: 12, zIndex: 1000,
        background: "white", border: "none", borderRadius: "8px",
        padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", cursor: "pointer",
      }}
    >
      <Locate style={{ width: 18, height: 18, color: "#3b82f6" }} />
    </button>
  );
}

async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

export default function DriverTripMap({ trip, phase }) {
  const [driverPos, setDriverPos] = useState(null);
  const [riderPos, setRiderPos] = useState(null);
  const [resolvedPickup, setResolvedPickup] = useState(null);
  const [resolvedDropoff, setResolvedDropoff] = useState(null);
  const watchIdRef = useRef(null);

  const pickupPos = trip?.pickup_lat && trip?.pickup_lng
    ? [trip.pickup_lat, trip.pickup_lng]
    : resolvedPickup;

  const dropoffPos = trip?.dropoff_lat && trip?.dropoff_lng
    ? [trip.dropoff_lat, trip.dropoff_lng]
    : resolvedDropoff;

  // Geocode addresses when coordinates aren't stored
  useEffect(() => {
    if (trip?.pickup_location && !trip?.pickup_lat) {
      geocode(trip.pickup_location).then(pos => pos && setResolvedPickup(pos));
    }
    if (trip?.dropoff_location && !trip?.dropoff_lat) {
      geocode(trip.dropoff_location).then(pos => pos && setResolvedDropoff(pos));
    }
  }, [trip?.id]);

  // Get driver's real GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setDriverPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Simulate rider live location (near pickup, slight drift)
  useEffect(() => {
    if (!pickupPos) return;

    const base = pickupPos;
    setRiderPos([base[0] + (Math.random() - 0.5) * 0.001, base[1] + (Math.random() - 0.5) * 0.001]);

    const interval = setInterval(() => {
      setRiderPos(prev => prev ? [
        prev[0] + (Math.random() - 0.5) * 0.0003,
        prev[1] + (Math.random() - 0.5) * 0.0003,
      ] : base);
    }, 4000);

    return () => clearInterval(interval);
  }, [trip?.id]);

  // Build visible positions for bounds fitting
  const allPositions = [
    driverPos,
    phase === "to_pickup" ? pickupPos : dropoffPos,
    phase === "to_pickup" ? riderPos : null,
  ].filter(Boolean);

  const defaultCenter = pickupPos || [5.6037, -0.1870]; // Accra fallback

  // Route line: driver → active target
  const routeLine = driverPos && (phase === "to_pickup" ? pickupPos : dropoffPos)
    ? [driverPos, phase === "to_pickup" ? pickupPos : dropoffPos]
    : [];

  const openGoogleMapsNavigation = () => {
    const dest = phase === "to_pickup" ? pickupPos : dropoffPos;
    if (!dest) return;
    const origin = driverPos ? `${driverPos[0]},${driverPos[1]}` : "";
    const url = `https://www.google.com/maps/dir/?api=1${origin ? `&origin=${origin}` : ""}&destination=${dest[0]},${dest[1]}&travelmode=driving`;
    window.open(url, "_blank");
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 320 }}>
      {/* Phase Banner */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-2">
        <Badge className={phase === "to_pickup" ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
          <MapPin className="w-3 h-3 mr-1" />
          {phase === "to_pickup" ? "Heading to Pickup" : "Heading to Dropoff"}
        </Badge>
        {riderPos && phase === "to_pickup" && (
          <Badge className="bg-blue-600 text-white">
            <User className="w-3 h-3 mr-1" />
            Rider Live
          </Badge>
        )}
      </div>

      {/* Navigate Button */}
      <button
        onClick={openGoogleMapsNavigation}
        style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
          background: "#3b82f6", color: "white", border: "none", borderRadius: "24px",
          padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(59,130,246,0.5)",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <Navigation style={{ width: 16, height: 16 }} />
        Open Navigation
      </button>

      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to visible markers */}
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* Driver location */}
        {driverPos && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>You (Driver)</Popup>
          </Marker>
        )}

        {/* Rider live location — shown when going to pickup */}
        {riderPos && phase === "to_pickup" && (
          <Marker position={riderPos} icon={riderIcon}>
            <Popup>🔵 {trip?.passenger_name || "Rider"} — Live Location</Popup>
          </Marker>
        )}

        {/* Pickup marker */}
        {pickupPos && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup>📍 Pickup: {trip?.pickup_location}</Popup>
          </Marker>
        )}

        {/* Dropoff marker */}
        {dropoffPos && (
          <Marker position={dropoffPos} icon={dropoffIcon}>
            <Popup>🔴 Dropoff: {trip?.dropoff_location}</Popup>
          </Marker>
        )}

        {/* Route line */}
        {routeLine.length === 2 && (
          <Polyline
            positions={routeLine}
            color={phase === "to_pickup" ? "#22c55e" : "#ef4444"}
            weight={4}
            dashArray="10, 8"
            opacity={0.8}
          />
        )}

        {/* Full trip path (pickup → dropoff) as faint guide */}
        {pickupPos && dropoffPos && (
          <Polyline
            positions={[pickupPos, dropoffPos]}
            color="#94a3b8"
            weight={2}
            dashArray="6, 10"
            opacity={0.4}
          />
        )}

        {/* Re-center button */}
        {driverPos && <RecenterButton position={driverPos} />}
      </MapContainer>
    </div>
  );
}