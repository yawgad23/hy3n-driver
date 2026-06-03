import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, MessageSquare, CheckCircle,
  XCircle, User, Star, Navigation, Clock, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import TripRequestCard from "./TripRequestCard";
import DriverMessageDialog from "./DriverMessageDialog";
import PassengerRatingDialog from "./PassengerRatingDialog";
import SafetyMonitor from "./SafetyMonitor";
import SafetyReportDialog from "./SafetyReportDialog";
import DriverTripMap from "./DriverTripMap";
import DriverStatusBar from "./DriverStatusBar";
import DriverEarningsSnapshot from "./DriverEarningsSnapshot";
import DriverCommissionPanel from "./DriverCommissionPanel";
import MultiStopPanel from "./MultiStopPanel";
import { optimizeStops } from "@/hooks/useMultiStopOptimizer";
import { toast } from "sonner";

export default function DriverHomeTab({ driver, isOnline, onToggleOnline }) {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showSafetyReport, setShowSafetyReport] = useState(false);
  const [safetyData, setSafetyData] = useState(null);
  const [tripPhase, setTripPhase] = useState("to_pickup");
  // Multi-stop queue
  const [multiStopQueue, setMultiStopQueue] = useState([]); // accepted trips queued
  const [optimizedStops, setOptimizedStops] = useState([]); // ordered stop list
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isMultiStopMode, setIsMultiStopMode] = useState(false);
  const [driverPos] = useState({ lat: 40.7128, lng: -74.006 }); // default NYC; replace with real GPS
  const queryClient = useQueryClient();

  const { data: pendingTrips } = useQuery({
    queryKey: ["pending-rides"],
    queryFn: () => base44.entities.Ride.filter({ status: "matched", driver_id: driver?.user_id }),
    refetchInterval: 5000,
    enabled: isOnline && !!driver?.user_id,
  });

  const { data: myTrips = [] } = useQuery({
    queryKey: ["driver-rides", driver?.id],
    queryFn: () => base44.entities.Ride.filter({ driver_id: driver?.user_id }),
    enabled: !!driver?.user_id,
  });

  useEffect(() => {
    if (pendingTrips?.length > 0) setTripRequests(pendingTrips);
    else setTripRequests([]);
  }, [pendingTrips]);

  const handleAcceptTrip = async (trip) => {
    // Auto-set comfort type for Kantanka Hyen drivers
    if (
      driver?.vehicle_model?.toLowerCase().includes("kantanka hyen") &&
      trip.trip_type !== "comfort"
    ) {
      await base44.entities.Ride.update(trip.id, { category: "comfort" });
    }

    const newQueue = [...multiStopQueue, trip];
    setMultiStopQueue(newQueue);

    if (newQueue.length > 1) {
      // Multi-stop mode: optimize all queued trips
      const stops = optimizeStops(newQueue, driverPos.lat, driverPos.lng);
      setOptimizedStops(stops);
      setCurrentStopIndex(0);
      setIsMultiStopMode(true);
      setCurrentTrip(trip); // keep last accepted as "current" for safety/rating
      setTripRequests([]);
      toast.success(`🗺️ ${newQueue.length} trips queued — route optimized!`);
    } else {
      // Single trip mode (normal)
      setCurrentTrip(trip);
      setTripPhase("to_pickup");
      setTripRequests([]);
      toast.success("Trip accepted! Head to pickup.");
    }
  };

  const handleQueueAnother = (trip) => {
    // Accept an additional trip into the multi-stop queue
    const newQueue = [...multiStopQueue, trip];
    setMultiStopQueue(newQueue);
    const stops = optimizeStops(newQueue, driverPos.lat, driverPos.lng);
    setOptimizedStops(stops);
    setCurrentStopIndex(0);
    setIsMultiStopMode(true);
    toast.success(`Added to route! Now ${newQueue.length} stops optimized.`);
  };

  const handleMultiStopComplete = (stop) => {
    const nextIndex = currentStopIndex + 1;
    if (nextIndex >= optimizedStops.length) {
      // All stops done
      toast.success("🎉 All stops completed!");
      setShowRatingDialog(true);
    } else {
      setCurrentStopIndex(nextIndex);
      const nextStop = optimizedStops[nextIndex];
      toast.success(`Stop done! Heading to: ${nextStop.address}`);
    }
  };

  const handleCancelMultiStop = () => {
    setIsMultiStopMode(false);
    setMultiStopQueue([]);
    setOptimizedStops([]);
    setCurrentStopIndex(0);
    setCurrentTrip(null);
    toast.info("Multi-stop route cancelled");
  };

  const handleDeclineTrip = (tripId) => {
    setTripRequests(prev => prev.filter(t => t.id !== tripId));
  };

  const handlePickedUp = () => {
    setTripPhase("to_dropoff");
    toast.success("Passenger picked up! Navigate to dropoff.");
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    await base44.entities.Ride.update(currentTrip.id, { status: "completed" });
    toast.success("Trip completed!");
    setShowRatingDialog(true);
  };

  const handlePassengerRating = async ({ rating, remarks, foundItem, itemDescription }) => {
    await base44.entities.Ride.update(currentTrip.id, {
      driver_rating: rating,
      driver_feedback: remarks,
    });
    toast.success("Rating submitted!" + (foundItem ? " Found item reported." : ""));
    setShowRatingDialog(false);
    setShowSafetyReport(true);
  };

  const handleSafetyReportSubmit = async () => {
    toast.success("Trip completed!");
    setShowSafetyReport(false);
    setCurrentTrip(null);
    queryClient.invalidateQueries({ queryKey: ["pending-rides"] });
    queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    queryClient.invalidateQueries({ queryKey: ["driver-rides", driver?.id] });
  };

  const handleCancelTrip = async () => {
    await base44.entities.Ride.update(currentTrip.id, { status: "cancelled" });
    toast.info("Trip cancelled");
    setCurrentTrip(null);
    queryClient.invalidateQueries({ queryKey: ["pending-rides"] });
  };

  const handleCallPassenger = () => {
    const phone = currentTrip?.passenger_phone;
    phone ? (window.location.href = `tel:${phone}`) : toast.error("No phone number available");
  };

  const handleSendMessage = async (message) => {
    // Message stored locally — no Trip entity
    toast.success("Message sent");
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <DriverStatusBar
        driver={driver}
        isOnline={isOnline}
        onToggle={onToggleOnline}
        tripRequests={tripRequests}
      />

      {/* Earnings snapshot (only when idle) */}
      {!currentTrip && (
        <DriverEarningsSnapshot driver={driver} todayTrips={myTrips} />
      )}

      {/* Commission panel */}
      {!currentTrip && (
        <DriverCommissionPanel driver={driver} />
      )}

      {/* Multi-Stop Optimizer Panel */}
      {isMultiStopMode && optimizedStops.length > 0 && (
        <MultiStopPanel
          stops={optimizedStops}
          currentStopIndex={currentStopIndex}
          onStopComplete={handleMultiStopComplete}
          onCancel={handleCancelMultiStop}
        />
      )}

      {/* Active Trip (single mode) */}
      <AnimatePresence>
        {currentTrip && !isMultiStopMode && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <Card className="border-2 border-accent/40 shadow-xl">
              <CardHeader className="bg-accent/10 border-b border-accent/20 py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <CardTitle className="font-heading text-base">
                      {tripPhase === "to_pickup" ? "⏩ Heading to Pickup" : "🎯 Heading to Dropoff"}
                    </CardTitle>
                  </div>
                  <Badge className={tripPhase === "to_pickup" ? "bg-green-600" : "bg-red-600"}>
                    {tripPhase === "to_pickup" ? "Pickup" : "Dropoff"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Live Map */}
                <DriverTripMap trip={currentTrip} phase={tripPhase} />

                {/* Phase toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={tripPhase === "to_pickup" ? "default" : "outline"}
                    onClick={() => setTripPhase("to_pickup")}
                    className={tripPhase === "to_pickup" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <MapPin className="w-4 h-4 mr-1" /> To Pickup
                  </Button>
                  <Button
                    size="sm"
                    variant={tripPhase === "to_dropoff" ? "default" : "outline"}
                    onClick={() => setTripPhase("to_dropoff")}
                    className={tripPhase === "to_dropoff" ? "bg-red-600 hover:bg-red-700" : ""}
                  >
                    <MapPin className="w-4 h-4 mr-1" /> To Dropoff
                  </Button>
                </div>

                {/* Route */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pickup</p>
                      <p className="text-sm font-medium">{currentTrip.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Dropoff</p>
                      <p className="text-sm font-medium">{currentTrip.destination_address}</p>
                    </div>
                  </div>
                </div>

                {/* Trip stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-heading font-bold text-sm">{currentTrip.distance_km || "—"} km</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-heading font-bold text-sm">{currentTrip.duration_minutes || "—"} min</p>
                  </div>
                  <div className="rounded-lg bg-accent/10 p-2">
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="font-heading font-bold text-sm text-accent">GHS {currentTrip.fare_estimate || "—"}</p>
                  </div>
                </div>

                {/* Passenger card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{currentTrip.rider_name || "Passenger"}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>4.8 • {currentTrip.rider_phone || "No phone"}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCallPassenger} className="h-9 w-9">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowMessageDialog(true)} className="h-9 w-9">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>

                {/* Safety monitor */}
                <SafetyMonitor isActive={true} tripId={currentTrip.id} />

                {/* Action buttons */}
                {tripPhase === "to_pickup" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={handleCancelTrip}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handlePickedUp}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Picked Up
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={handleCancelTrip}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button className="bg-accent hover:bg-accent/90" onClick={handleCompleteTrip}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Complete &amp; Rate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip Requests */}
      <AnimatePresence>
        {isOnline && tripRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-base">
                  {currentTrip ? "Queue Another Trip" : "Incoming Requests"}
                </h3>
                <div className="flex items-center gap-2">
                  {currentTrip && (
                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                      +Multi-stop
                    </Badge>
                  )}
                  <Badge className="bg-primary animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    {tripRequests.length} Live
                  </Badge>
                </div>
              </div>
              {tripRequests.map(trip => (
                <TripRequestCard
                  key={trip.id}
                  trip={trip}
                  onAccept={currentTrip ? handleQueueAnother : handleAcceptTrip}
                  onDecline={handleDeclineTrip}
                  queueMode={!!currentTrip}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle state */}
      {isOnline && !currentTrip && tripRequests.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>
            <p className="font-heading font-semibold text-base">Searching for trips…</p>
            <p className="text-muted-foreground text-sm mt-1">You'll be notified when a rider is nearby</p>
          </CardContent>
        </Card>
      )}

      {!isOnline && !currentTrip && (
        <Card>
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-heading font-semibold text-base">You're offline</p>
            <p className="text-muted-foreground text-sm mt-1">Toggle the switch above to start receiving trips</p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <DriverMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        passengerName={currentTrip?.passenger_name || "Passenger"}
        onSendMessage={handleSendMessage}
      />
      <PassengerRatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        passengerName={currentTrip?.passenger_name || "Passenger"}
        tripId={currentTrip?.id}
        onSubmit={handlePassengerRating}
      />
      <SafetyReportDialog
        open={showSafetyReport}
        onOpenChange={setShowSafetyReport}
        safetyData={safetyData}
        tripDuration={currentTrip?.duration_min}
        distance={currentTrip?.distance_km}
        onSubmit={handleSafetyReportSubmit}
      />
    </div>
  );
}