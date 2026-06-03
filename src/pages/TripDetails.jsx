import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin, Clock, DollarSign, Navigation, User, Car, Radio, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TripRouteMap from "@/components/trips/TripRouteMap";
import LiveTripMap from "@/components/trips/LiveTripMap";
import AutoDispatchPanel from "@/components/dispatch/AutoDispatchPanel";
import { useSimulatedDriverTracking } from "@/hooks/useSimulatedDriverTracking";

const statusStyles = {
  completed: "bg-accent/10 text-accent border-accent/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => base44.entities.Ride.get(id),
    enabled: !!id,
  });

  // Get driver data for tracking
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.DriverProfile.list(),
    enabled: !!trip?.driver_id,
  });

  const driver = drivers.find(d => d.id === trip?.driver_id);
  const activeDriversForTracking = driver && (trip?.status === "in_progress" || trip?.status === "pending") 
    ? [driver] 
    : [];
  const { positions, movementStatus } = useSimulatedDriverTracking(activeDriversForTracking);

  const driverPosition = driver ? positions[driver.id] : null;
  const driverMovementStatus = driver ? movementStatus[driver.id] : null;

  const handleDriverAssigned = async (driver) => {
    // Refresh trip data after driver assignment
    await queryClient.invalidateQueries({ queryKey: ["trip", id] });
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  if (isLoading || !trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold">Trip Details</h1>
          <p className="text-sm text-muted-foreground">{trip.trip_date ? format(new Date(trip.trip_date), "MMM d, yyyy") : "—"}</p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className={cn("text-sm px-3 py-1.5", statusStyles[trip.status] || "")}>
              {trip.status?.replace("_", " ")}
            </Badge>
            {trip.fare && (
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <DollarSign className="w-5 h-5" />
                {trip.fare.toFixed(2)}
              </div>
            )}
          </div>

          {/* Route with Live Tracking */}
          <div className="space-y-4">
            {trip.status === "in_progress" && driver ? (
              <LiveTripMap 
                trip={trip} 
                driverPosition={driverPosition}
                movementStatus={driverMovementStatus}
              />
            ) : (
              <TripRouteMap
                pickupLat={trip.pickup_lat}
                pickupLng={trip.pickup_lng}
                dropoffLat={trip.dropoff_lat}
                dropoffLng={trip.dropoff_lng}
                pickupLocation={trip.pickup_location}
                dropoffLocation={trip.dropoff_location}
              />
            )}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
                  <p className="font-medium">{trip.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Dropoff</p>
                  <p className="font-medium">{trip.dropoff_location}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Auto-Dispatch Panel (only for pending trips) */}
      {trip.status === "pending" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <AutoDispatchPanel trip={trip} onDriverAssigned={handleDriverAssigned} />
        </motion.div>
      )}

      {/* Driver & Passenger */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5 space-y-4">
          <h2 className="font-heading font-semibold text-sm">Trip Info</h2>
          {trip.driver_name ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Driver</p>
                <p className="font-medium">{trip.driver_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Assigned
                  </Badge>
                  {trip.status === "in_progress" && driverMovementStatus && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Radio className={cn("w-3 h-3", driverMovementStatus === "on_trip" ? "animate-pulse text-primary" : "text-muted-foreground")} />
                      {driverMovementStatus === "on_trip" ? "Moving" : "Stationary"}
                    </Badge>
                  )}
                </div>
              </div>
              {trip.driver_phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = `tel:${trip.driver_phone}`}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : trip.status === "pending" ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-9 h-9 rounded-lg bg-secondary/50 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs">No driver assigned yet</p>
                <p className="text-xs text-muted-foreground">Use auto-dispatch or manual assignment</p>
              </div>
            </div>
          ) : null}
          {trip.passenger_name && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Passenger</p>
                <p className="font-medium">{trip.passenger_name}</p>
              </div>
              {trip.passenger_phone && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = `tel:${trip.passenger_phone}`}
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Trip Stats */}
      {(trip.distance_km || trip.duration_min) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4">
              {trip.distance_km && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-semibold">{trip.distance_km} km</p>
                  </div>
                </div>
              )}
              {trip.duration_min && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{trip.duration_min} min</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Timestamp */}
      {trip.trip_date && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(trip.trip_date), "EEEE, MMMM d • h:mm a")}</span>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}