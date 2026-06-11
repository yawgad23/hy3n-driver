import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import InCallScreen from "@/components/driver/InCallScreen";
import IncomingCallModal from "@/components/driver/IncomingCallModal";
import {
  MapPin, Phone, MessageSquare, CheckCircle, XCircle, User, Star,
  Navigation, Clock, DollarSign, ChevronUp, ChevronDown, AlertTriangle,
  Check, X, Shield, Zap, Wifi, WifiOff, Car, Target, TrendingUp, Bell
} from "lucide-react";
import DriverNotificationCenter from "@/components/driver/NotificationCenter";
import { cn } from "@/lib/utils";
import { firebaseClient, db } from "@/api/firebaseClient";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TripSummaryDialog from "./TripSummaryDialog";
import SafetyMonitor from "./SafetyMonitor";
import DriverTripMap from "./DriverTripMap";
import DriverEarningsSnapshot from "./DriverEarningsSnapshot";
import DriverCommissionPanel from "./DriverCommissionPanel";
import RideChatModal from "@/components/shared/RideChatModal";

// ─── Trip Request Bottom Sheet with countdown ────────────────────────────────
const ACCEPT_TIMEOUT = 20;

function TripRequestSheet({ trip, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(ACCEPT_TIMEOUT);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const x = useMotionValue(0);
  const SWIPE_THRESHOLD = 120;
  const acceptBg = useTransform(x, [0, SWIPE_THRESHOLD], ["rgba(34,197,94,0)", "rgba(34,197,94,0.15)"]);
  const declineBg = useTransform(x, [-SWIPE_THRESHOLD, 0], ["rgba(239,68,68,0.15)", "rgba(239,68,68,0)"]);

  useEffect(() => {
    if (timeLeft <= 0) { onDecline(trip.id); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      // Write matched_at + driver_arriving in one update so rider sees the transition
      const now = new Date().toISOString();
      await firebaseClient.entities.Ride.update(trip.id, {
        status: "driver_arriving",
        matched_at: now,
        driver_accepted_at: now,
      });
      toast.success("Trip accepted! Head to pickup.");
      onAccept({ ...trip, status: "driver_arriving", matched_at: now });
    } catch {
      toast.error("Failed to accept trip. Please try again.");
    } finally { setAccepting(false); }
  };

  const handleDecline = async () => {
    if (declining) return;
    setDeclining(true);
    try {
      // Reset ride to requested so matchRide can try the next available driver
      await firebaseClient.entities.Ride.update(trip.id, {
        status: "requested",
        driver_id: null,
        driver_name: null,
        driver_photo: null,
        driver_phone: null,
        vehicle_make: null,
        vehicle_model: null,
        vehicle_color: null,
        license_plate: null,
        pending_driver_at: null,
        declined_by: trip.declined_by
          ? [...(Array.isArray(trip.declined_by) ? trip.declined_by : []), trip.driver_id]
          : [trip.driver_id],
      });
    } catch (err) {
      console.warn("[DriverHomeTab] Decline update failed:", err);
    }
    toast.info("Trip declined");
    onDecline(trip.id);
    setDeclining(false);
  };

  const handleDragEnd = async (_, info) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      await animate(x, 500, { duration: 0.2 });
      handleAccept();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      await animate(x, -500, { duration: 0.2 });
      handleDecline();
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  const progress = (timeLeft / ACCEPT_TIMEOUT) * 100;
  const fare = trip.fare_estimate || trip.fare || Math.round((trip.distance_km || 5) * 2.5);

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      {/* Countdown bar */}
      <div className="h-1 bg-border">
        <motion.div
          className={cn("h-full transition-colors", timeLeft > 10 ? "bg-primary" : "bg-red-500")}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="bg-card rounded-t-3xl shadow-2xl overflow-y-auto" style={{ maxHeight: "80vh" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header: fare + timer */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">New Ride Request</p>
            <p className="text-3xl font-heading font-bold text-accent">₵{fare}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {trip.distance_km || "—"} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {trip.duration_minutes || trip.duration_min || "—"} min
              </span>
            </div>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-4 font-heading font-bold text-xl",
            timeLeft > 10 ? "border-primary text-primary" : "border-red-500 text-red-500"
          )}>
            {timeLeft}
          </div>
        </div>

        {/* Swipeable card */}
        <div className="relative px-4 pb-2">
          <div className="flex justify-between text-[10px] text-muted-foreground/50 font-semibold uppercase tracking-widest mb-1 px-2">
            <span>← Decline</span>
            <span>Swipe to respond</span>
            <span>Accept →</span>
          </div>
          <div className="relative">
            <motion.div style={{ backgroundColor: acceptBg }} className="absolute inset-0 rounded-2xl pointer-events-none" />
            <motion.div style={{ backgroundColor: declineBg }} className="absolute inset-0 rounded-2xl pointer-events-none" />
            <motion.div
              drag="x"
              dragConstraints={{ left: -200, right: 200 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{ x }}
              whileDrag={{ cursor: "grabbing" }}
              className="relative z-10 bg-secondary rounded-2xl p-4 border border-border touch-pan-y"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-bold text-base">{trip.rider_name || trip.passenger_name || "Rider"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>{trip.rider_rating || "4.8"} rating</span>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {trip.category || "Standard"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    <div className="w-0.5 h-6 bg-border" />
                    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pickup</p>
                      <p className="text-sm font-medium leading-tight">{trip.pickup_address || trip.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">Dropoff</p>
                      <p className="text-sm font-medium leading-tight">{trip.destination_address || trip.dropoff_location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-3" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
          <Button
            variant="outline"
            className="h-14 text-base font-bold border-2 border-red-500/40 text-red-500 hover:bg-red-500/10 rounded-2xl"
            onClick={handleDecline}
            disabled={declining || accepting}
          >
            <X className="w-5 h-5 mr-2" />
            Decline
          </Button>
          <Button
            className="h-14 text-base font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/30"
            onClick={handleAccept}
            disabled={accepting || declining}
          >
            {accepting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            {accepting ? "Accepting..." : "Accept"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Active Trip Bottom Sheet ─────────────────────────────────────────────────
function ActiveTripSheet({ trip, tripPhase, driver, onArrived, onStartTrip, onComplete, onCancel, onOpenChat, unreadCount, onCall, callStatus }) {
  const [expanded, setExpanded] = useState(false);

  const openNav = () => {
    const dest = tripPhase === "to_pickup"
      ? (trip.pickup_lat && trip.pickup_lng ? `${trip.pickup_lat},${trip.pickup_lng}` : encodeURIComponent(trip.pickup_address || trip.pickup_location || ""))
      : (trip.dropoff_lat && trip.dropoff_lng ? `${trip.dropoff_lat},${trip.dropoff_lng}` : encodeURIComponent(trip.destination_address || trip.dropoff_location || ""));
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, "_blank");
  };

  const fare = trip.fare_estimate || trip.fare || "—";
  const passengerName = trip.rider_name || trip.passenger_name || "Rider";
  const passengerPhone = trip.rider_phone || trip.passenger_phone;

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
    >
      <div className="bg-card rounded-t-3xl shadow-2xl border-t border-border overflow-y-auto" style={{ maxHeight: "75vh" }}>
        {/* Drag handle + expand toggle */}
        <button
          className="w-full flex flex-col items-center pt-3 pb-2"
          onClick={() => setExpanded(p => !p)}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Phase badge + fare */}
        <div className="flex items-center justify-between px-5 pb-3">
          <div>
            <Badge className={cn(
              "text-xs font-bold mb-1",
              tripPhase === "to_pickup" ? "bg-green-600 text-white" :
              tripPhase === "arrived" ? "bg-yellow-500 text-black" :
              "bg-primary text-primary-foreground"
            )}>
              {tripPhase === "to_pickup" ? "● Heading to Pickup" :
               tripPhase === "arrived" ? "● Arrived at Pickup" :
               "● Trip in Progress"}
            </Badge>
            <p className="font-heading font-bold text-xl">{passengerName}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span>{trip.rider_rating || "4.8"}</span>
              {trip.distance_km && <span>· {trip.distance_km} km</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-heading font-bold text-accent">₵{fare}</p>
            <p className="text-xs text-muted-foreground">{trip.category || "Standard"}</p>
          </div>
        </div>

        {/* Quick action row: Navigate + Call + Message */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          <button
            onClick={openNav}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Navigation className="w-5 h-5 text-primary" />
            <span className="text-[11px] font-semibold text-primary">Navigate</span>
          </button>
          <button
            onClick={() => onCall && onCall()}
            className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors ${
              callStatus === "active" ? "bg-green-500/20 ring-1 ring-green-500" :
              callStatus === "calling" ? "bg-amber-500/20 ring-1 ring-amber-500" :
              "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <Phone className={`w-5 h-5 ${
              callStatus === "active" ? "text-green-500" :
              callStatus === "calling" ? "text-amber-500" : "text-foreground"
            }`} />
            <span className="text-[11px] font-semibold">
              {callStatus === "active" ? "End" : callStatus === "calling" ? "Calling" : "Call"}
            </span>
          </button>
          <button
            onClick={onOpenChat}
            className="relative flex flex-col items-center gap-1 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-4 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
            <span className="text-[11px] font-semibold">Message</span>
          </button>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-3">
                <div className="bg-secondary rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Pickup</p>
                        <p className="text-sm font-medium">{trip.pickup_address || trip.pickup_location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">Dropoff</p>
                        <p className="text-sm font-medium">{trip.destination_address || trip.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-heading font-bold text-sm">{trip.distance_km || "—"} km</p>
                  </div>
                  <div className="bg-secondary rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-heading font-bold text-sm">{trip.duration_minutes || trip.duration_min || "—"} min</p>
                  </div>
                  <div className="bg-accent/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="font-heading font-bold text-sm text-accent">₵{fare}</p>
                  </div>
                </div>
                <SafetyMonitor isActive={true} tripId={trip.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRIMARY ACTION BUTTON */}
        <div className="px-4 pt-1 space-y-2" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
          {tripPhase === "to_pickup" && (
            <>
              <Button
                className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg shadow-green-600/30"
                onClick={onArrived}
              >
                <MapPin className="w-6 h-6 mr-3" />
                I've Arrived at Pickup
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-sm border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl"
                onClick={onCancel}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Trip
              </Button>
            </>
          )}
          {tripPhase === "arrived" && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                <p className="text-xs text-yellow-500 font-medium">Waiting for passenger — waiting fees apply after 3 min</p>
              </div>
              <Button
                className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/30"
                onClick={onStartTrip}
              >
                <Zap className="w-6 h-6 mr-3" />
                Start Trip
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 text-sm border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl"
                onClick={onCancel}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Trip
              </Button>
            </>
          )}
          {tripPhase === "in_progress" && (
            <Button
              className="w-full h-16 text-lg font-bold bg-accent hover:bg-accent/90 rounded-2xl shadow-lg shadow-accent/30"
              onClick={onComplete}
            >
              <CheckCircle className="w-6 h-6 mr-3" />
              Complete Trip
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bolt/Uber-style compact bottom bar (shown when online & idle) ─────────────
function OnlineBar({ driver, isOnline, onToggleOnline, todayTrips, commissionConfirmed, onNavigate }) {
  const [showStats, setShowStats] = useState(false);

  const todayEarnings = (todayTrips || [])
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + (t.final_fare || t.fare_estimate || t.fare || 0), 0);
  const todayCompleted = (todayTrips || []).filter(t => t.status === "completed").length;

  return (
    <>
      {/* ── Compact bottom bar ── */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-40"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <div
          className="bg-card border-t border-border"
          style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
        >
          {/* Drag handle */}
          <button
            className="w-full flex justify-center pt-2 pb-1"
            onClick={() => setShowStats(p => !p)}
          >
            <div className="w-10 h-1 rounded-full bg-border" />
          </button>

          {isOnline ? (
            <div className="flex items-center gap-3 px-4 pb-3">
              {/* Online indicator */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-green-500" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
              </div>

              {/* Status text */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">Online — Waiting for trips</p>
                <p className="text-xs text-muted-foreground truncate">
                  GH₵{todayEarnings.toFixed(0)} earned · {todayCompleted} trip{todayCompleted !== 1 ? "s" : ""} today
                </p>
              </div>

              {/* Expand stats chevron */}
              <button
                onClick={() => setShowStats(p => !p)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                {showStats
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Go Offline button */}
              <button
                onClick={() => onToggleOnline(false)}
                className="h-9 px-3 rounded-xl border border-red-500/40 text-red-500 text-xs font-bold bg-transparent hover:bg-red-500/10 transition-colors"
              >
                Go Offline
              </button>
            </div>
          ) : (
            <div className="px-4 pb-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">You're Offline</p>
                  <p className="text-xs text-muted-foreground">Go online to start receiving trips</p>
                </div>
              </div>
              {commissionConfirmed ? (
                <Button
                  className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg shadow-green-600/30"
                  onClick={() => onToggleOnline(true)}
                >
                  <Wifi className="w-5 h-5 mr-2" />
                  Go Online
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                    <p className="text-xs text-yellow-500">Pay your daily fee to go online.</p>
                  </div>
                  <Button
                    className="w-full h-12 text-base font-bold bg-yellow-500 hover:bg-yellow-600 text-black rounded-2xl"
                    onClick={() => window.location.reload()}
                  >
                    Pay Daily Fee
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Stats drawer (slides up above the bar) ── */}
      <AnimatePresence>
        {showStats && isOnline && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[35] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStats(false)}
            />
            {/* Drawer */}
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[36] bg-card rounded-t-3xl shadow-2xl border-t border-border"
              style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <button
                className="w-full flex justify-center pt-3 pb-2"
                onClick={() => setShowStats(false)}
              >
                <div className="w-10 h-1 rounded-full bg-border" />
              </button>
              <div className="px-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-base">Today's Summary</h3>
                  <button onClick={() => setShowStats(false)} className="text-muted-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <DriverEarningsSnapshot driver={driver} todayTrips={todayTrips} onNavigate={onNavigate} />
                <div className="mt-3">
                  <DriverCommissionPanel driver={driver} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main DriverHomeTab ───────────────────────────────────────────────────────
export default function DriverHomeTab({ driver, isOnline, onToggleOnline, commissionConfirmed, onNavigate }) {
  if (!driver) return null; // Prevent rendering if driver is null/undefined
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [nextTripRequest, setNextTripRequest] = useState(null);
  const [tripPhase, setTripPhase] = useState("to_pickup");
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [safetyData, setSafetyData] = useState(null);
  const [showFareScreen, setShowFareScreen] = useState(false);
  const [completedFare, setCompletedFare] = useState(null); // { finalFare, actualKm, durationMin }
  // Tracks whether the driver triggered trip completion locally (so the Firestore
  // 'completed' status change doesn't clear currentTrip before the fare screen shows)
  const localCompleteRef = useRef(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [destinationMode, setDestinationMode] = useState(false);
  const [driverDestination, setDriverDestination] = useState("");
  const [showDestinationInput, setShowDestinationInput] = useState(false);
  const queryClient = useQueryClient();

  const [pendingTrips, setPendingTrips] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showNotifCenter, setShowNotifCenter] = useState(false);

  // ── GPS distance tracking during trip ──────────────────────────────────────
  const gpsWatchRef = useRef(null);
  const lastPosRef = useRef(null);
  const actualDistKmRef = useRef(0);
  const tripStartTimeRef = useRef(null);

  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const startGpsTracking = (tripId) => {
    if (!navigator.geolocation) return;
    actualDistKmRef.current = 0;
    lastPosRef.current = null;
    tripStartTimeRef.current = Date.now();
    let lastWriteTime = 0;
    let lastPosWriteTime = 0;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (lastPosRef.current) {
          const seg = haversineKm(lastPosRef.current, cur);
          if (seg > 0.005) actualDistKmRef.current += seg;
        }
        lastPosRef.current = cur;
        const now = Date.now();
        // Write current GPS position to DriverProfile every 4 seconds so the
        // rider can see the driver's car moving on their map in real-time.
        if (now - lastPosWriteTime > 4000) {
          lastPosWriteTime = now;
          if (driver?.id) {
            firebaseClient.entities.DriverProfile.update(driver.id, {
              current_lat: cur.lat,
              current_lng: cur.lng,
            }).catch(() => {});
          }
        }
        // Write actual distance to Ride every 30 seconds
        if (now - lastWriteTime > 30000) {
          lastWriteTime = now;
          firebaseClient.entities.Ride.update(tripId, {
            actual_distance_km: parseFloat(actualDistKmRef.current.toFixed(2)),
          }).catch(() => {});
        }
      },
      (err) => console.warn('[GPS] watchPosition error:', err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  };

  const stopGpsTracking = () => {
    if (gpsWatchRef.current != null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
  };

  // ── In-app voice call ──────────────────────────────────────────────────────
  const voiceCall = useVoiceCall({
    rideId: currentTrip?.id,
    myId: driver?.user_id || driver?.id,
    myName: driver?.full_name || driver?.name || "Driver",
    myRole: "driver",
    otherName: currentTrip?.rider_name || currentTrip?.passenger_name || "Rider",
  });

  const DRIVER_CANCEL_REASONS = [
    "Passenger not at pickup location",
    "Passenger requested cancellation",
    "Vehicle issue / breakdown",
    "Wrong pickup location",
    "Safety concern",
    "Other",
  ];

  // ── Recover active trip on mount (checks both driver.id and driver.user_id) ──
  useEffect(() => {
    if (!driver) return;
    const ACTIVE_STATUSES = ["driver_completing_nearby", "driver_arriving", "driver_arrived", "in_progress"];
    const recoverActiveTrip = async () => {
      try {
        const ridesRef = collection(db, "rides");
        const driverIds = [...new Set([driver.user_id, driver.id].filter(Boolean))];
        const allSnaps = await Promise.all(
          driverIds.flatMap(driverId =>
            ACTIVE_STATUSES.map(status =>
              getDocs(query(ridesRef, where("driver_id", "==", driverId), where("status", "==", status)))
            )
          )
        );
        const allActive = allSnaps
          .flatMap(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })))
          .sort((a, b) => {
            const ta = a.matched_at || a.created_date || "";
            const tb = b.matched_at || b.created_date || "";
            return tb.localeCompare(ta);
          });
        const latest = allActive[0];
        if (latest && !currentTrip) {
          console.log("[DriverHomeTab] Recovered active trip:", latest.id, latest.status);
          setCurrentTrip(latest);
          if (latest.status === "driver_arrived") setTripPhase("arrived");
          else if (latest.status === "in_progress") setTripPhase("in_progress");
          else setTripPhase("to_pickup");
        }
      } catch (err) {
        console.warn("[DriverHomeTab] Active trip recovery error:", err);
      }
    };
    recoverActiveTrip();
  }, [driver?.id, driver?.user_id]);

  // Real-time listener for new matched (pending) rides
  useEffect(() => {
    if (!driver?.user_id) return;
    const unsub = firebaseClient.entities.Ride.subscribeToQuery(
      { driver_id: driver.user_id },
      (rides) => {
        // Show request sheet for rides in pending_driver state (new flow)
        // Also support legacy 'matched' status for backward compatibility
        const pending = rides.filter(r => r.status === 'pending_driver' || r.status === 'matched');
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const fresh = pending.filter(r => {
          const ts = r.pending_driver_at || r.matched_at || r.created_date;
          return !ts || ts >= tenMinutesAgo;
        });
        
        // Also check for accepted back-to-back rides that are waiting
        const queued = rides.filter(r => r.status === 'driver_completing_nearby');
        
        setPendingTrips(fresh);
        if (queued.length > 0 && !nextTripRequest) {
          setNextTripRequest(queued[0]);
        }
      }
    );
    return () => unsub?.();
  }, [driver?.user_id]);

  const { data: myTrips = [] } = useQuery({
    queryKey: ["driver-rides", driver?.id],
    queryFn: () => firebaseClient.entities.Ride.filter({ driver_id: driver?.user_id }),
    enabled: !!driver?.user_id,
  });

  useEffect(() => {
    if (!pendingTrips?.length) {
      setTripRequests([]);
      setNextTripRequest(null);
      return;
    }
    const filtered = destinationMode && driverDestination
      ? pendingTrips.filter(r => {
          const dest = (r.destination_address || r.dropoff_location || "").toLowerCase();
          return dest.includes(driverDestination.toLowerCase());
        })
      : pendingTrips;

    if (currentTrip && tripPhase === "in_progress") {
      setNextTripRequest(filtered.length > 0 ? filtered[0] : null);
    } else if (!currentTrip) {
      setTripRequests(filtered);
    }
  }, [pendingTrips, destinationMode, driverDestination, currentTrip, tripPhase]);

  // ── Real-time listener on the active trip document ─────────────────────────
  // Catches rider cancellations and any status changes the rider makes.
  const prevTripStatusRef = useRef(null);
  useEffect(() => {
    if (!currentTrip?.id) return;
    prevTripStatusRef.current = currentTrip.status;
    const unsub = firebaseClient.entities.Ride.subscribeToDoc(currentTrip.id, (updatedRide) => {
      if (!updatedRide) {
        // Document deleted — treat as cancellation
        toast.info('Ride was removed');
        setCurrentTrip(null);
        setTripPhase('to_pickup');
        stopGpsTracking();
        return;
      }
      const oldStatus = prevTripStatusRef.current;
      const newStatus = updatedRide.status;
      prevTripStatusRef.current = newStatus;
      // Always sync currentTrip with latest Firestore data
      setCurrentTrip(updatedRide);
      // Handle rider cancellation
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        const reason = updatedRide.cancel_reason ? ` Reason: ${updatedRide.cancel_reason}` : '';
        toast.info(`Rider cancelled the trip.${reason}`);
        setCurrentTrip(null);
        setTripPhase('to_pickup');
        stopGpsTracking();
        return;
      }
      // When the ride is marked completed externally (e.g. admin action or re-sync),
      // clear currentTrip so the bottom nav is restored.
      // But if the driver triggered completion locally (localCompleteRef = true),
      // keep currentTrip alive until the fare screen is dismissed.
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        if (!localCompleteRef.current) {
          // External completion (admin, etc.) — clear immediately
          setCurrentTrip(null);
          setTripPhase('to_pickup');
          stopGpsTracking();
        }
        // If local, handleCompleteTrip already set showFareScreen — do nothing here.
        return;
      }
      // Sync trip phase with status
      if (newStatus === 'driver_arrived' && oldStatus !== 'driver_arrived') {
        setTripPhase('arrived');
      } else if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
        setTripPhase('in_progress');
      }
    });
    return () => unsub?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrip?.id]);

  // ── Subscribe to unread chat messages ────────────────────────────────────────
  useEffect(() => {
    if (!currentTrip?.id) return;
    const unsub = firebaseClient.entities.RideMessage?.subscribeToQuery?.(
      { ride_id: currentTrip.id },
      (msgs) => {
        const unread = msgs.filter(m => m.sender_role === "rider" && !m.read_by_driver);
        setUnreadCount(unread.length);
      }
    );
    return () => unsub?.();
  }, [currentTrip?.id]);

  const handleAcceptTrip = (trip) => {
    setCurrentTrip(trip);
    setTripPhase("to_pickup");
    setTripRequests([]);
    setUnreadCount(0);
  };

  const handleDeclineTrip = (tripId) => {
    setTripRequests(prev => prev.filter(t => t.id !== tripId));
  };

  const handleArrived = async () => {
    if (!currentTrip) return;
    try {
      await firebaseClient.entities.Ride.update(currentTrip.id, {
        status: "driver_arrived",
        driver_arrived_at: new Date().toISOString(),
      });
    } catch {}
    setTripPhase("arrived");
    toast.success("Marked as arrived! Waiting for passenger.");
  };

  const handleStartTrip = async () => {
    if (!currentTrip) return;
    try {
      await firebaseClient.entities.Ride.update(currentTrip.id, {
        status: "in_progress",
        trip_started_at: new Date().toISOString(),
        actual_distance_km: 0,
      });
    } catch {}
    startGpsTracking(currentTrip.id);
    setTripPhase("in_progress");
    toast.success("Trip started! Navigate to dropoff.");
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    // Mark as locally triggered so the Firestore listener doesn't clear currentTrip
    // before the fare screen has a chance to display
    localCompleteRef.current = true;
    stopGpsTracking();
    try {
      // Use ONLY actual GPS-tracked distance.
      // NEVER fall back to the booking estimate (distance_km) — that would charge the rider
      // for a route the driver didn't actually drive.
      // If GPS didn't accumulate (e.g. permissions denied), charge the minimum fare only.
      const actualKm = actualDistKmRef.current > 0.05
        ? parseFloat(actualDistKmRef.current.toFixed(2))
        : 0; // 0 → minimum fare will apply below

      // Actual trip duration in minutes
      const startTs = currentTrip.trip_started_at
        || (tripStartTimeRef.current ? new Date(tripStartTimeRef.current).toISOString() : null);
      const durationMin = startTs
        ? Math.max(1, Math.round((Date.now() - new Date(startTs).getTime()) / 60000))
        : 1;

      // Recalculate fare from actual distance + time using dynamic FareConfig
      const categoryToVehicleType = {
        standard: "Sedan",
        comfort: "SUV",
        kantanka: "SUV",
        executive: "Minivan",
        okada: "Motorcycle",
        express_delivery: "Tricycle"
      };

      const cat = (currentTrip.category || 'standard').toLowerCase();
      const vehicleType = categoryToVehicleType[cat] || "Sedan";
      
      let finalFare;
      try {
        const configs = await firebaseClient.entities.FareConfig.filter({ vehicle_type: vehicleType });
        const cfg = configs[0];
        
        if (cfg) {
          const now = new Date();
          const hour = now.getHours();
          const inRange = (h, start, end) =>
            start <= end ? h >= start && h < end : h >= start || h < end;

          const isPeak = inRange(hour, cfg.peak_start_hour, cfg.peak_end_hour) ||
                         inRange(hour, cfg.peak_start_hour_2, cfg.peak_end_hour_2);
          const isNight = inRange(hour, cfg.night_start_hour, cfg.night_end_hour);
          const isTraffic = cfg.traffic_enabled;

          let multiplier = Math.max(currentTrip.surge_multiplier || 1, cfg.surge_multiplier || 1);
          if (isPeak) multiplier = Math.max(multiplier, cfg.peak_multiplier || 1);
          if (isNight) multiplier = Math.max(multiplier, cfg.night_multiplier || 1);
          if (isTraffic) multiplier = Math.max(multiplier, cfg.traffic_multiplier || 1);

          const subtotal = (cfg.base_fare + (cfg.per_km_rate * actualKm)) * multiplier;
          const raw = Math.max(subtotal, cfg.minimum_fare);
          finalFare = Math.floor(raw + 0.49);
        } else {
          throw new Error("No config found");
        }
      } catch (err) {
        console.warn("FareConfig fetch failed, using fallback rates:", err);
        const CATEGORY_RATES = {
          standard:         { base: 5.00, perKm: 3.50, perMin: 0.70, min: 10 },
          comfort:          { base: 7.00, perKm: 4.20, perMin: 0.92, min: 14 },
          kantanka:         { base: 7.00, perKm: 4.20, perMin: 0.92, min: 14 },
          executive:        { base: 10.00, perKm: 5.00, perMin: 1.00, min: 22 },
          okada:            { base: 3.00, perKm: 1.50, perMin: 0.25, min: 5  },
          express_delivery: { base: 5.00, perKm: 2.50, perMin: 0.50, min: 8  },
        };
        const rates = CATEGORY_RATES[cat] || CATEGORY_RATES.standard;
        const surge = currentTrip.surge_multiplier || 1.0;
        const rawFare = (rates.base + actualKm * rates.perKm + durationMin * rates.perMin) * surge;
        finalFare = Math.round(Math.max(rawFare, rates.min));
      }

      await firebaseClient.entities.Ride.update(currentTrip.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        final_fare: finalFare,
        actual_distance_km: actualKm,
        duration_min: durationMin,
      });
      // Store computed values so FareScreen can display them
      setCompletedFare({ finalFare, actualKm, durationMin });
      
      // If there's a queued trip, promote it to current trip
      if (nextTripRequest) {
        setTimeout(async () => {
          try {
            await firebaseClient.entities.Ride.update(nextTripRequest.id, {
              status: "driver_arriving",
            });
            setCurrentTrip({...nextTripRequest, status: "driver_arriving"});
            setTripPhase("to_pickup");
            setNextTripRequest(null);
            toast.success("Navigating to next pickup!");
          } catch (err) {
            console.error("Failed to promote queued trip:", err);
          }
        }, 3000); // Wait 3 seconds for the fare screen to show before transitioning
      }
    } catch (err) {
      console.error('[DriverHomeTab] Complete trip error:', err);
      // Even on error, show fare screen with best estimate
      const cat = (currentTrip?.category || 'standard').toLowerCase();
      const RATES = { standard: { base: 5, perKm: 3.5, perMin: 0.7, min: 10 }, comfort: { base: 7, perKm: 4.2, perMin: 0.92, min: 14 }, kantanka: { base: 7, perKm: 4.2, perMin: 0.92, min: 14 }, executive: { base: 10, perKm: 5, perMin: 1, min: 22 }, okada: { base: 3, perKm: 1.5, perMin: 0.25, min: 5 }, express_delivery: { base: 5, perKm: 2.5, perMin: 0.5, min: 8 } };
      const r = RATES[cat] || RATES.standard;
      const km = actualDistKmRef.current > 0.05 ? parseFloat(actualDistKmRef.current.toFixed(2)) : 0;
      const dur = 1;
      setCompletedFare({ finalFare: Math.round(Math.max((r.base + km * r.perKm + dur * r.perMin), r.min)), actualKm: km, durationMin: dur });
    }
    toast.success("Trip completed! Great work.");
    setShowFareScreen(true);
  };

  const handleTripSummarySubmit = async (summaryData) => {
    try {
      await firebaseClient.entities.Ride.update(currentTrip.id, {
        passenger_rating: summaryData.rating,
        passenger_remarks: summaryData.remarks,
        found_item: summaryData.foundItem,
        item_description: summaryData.itemDescription,
        safety_report: summaryData.safetyReport,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      
      setShowTripSummary(false);
      setCurrentTrip(null);
      setTripPhase("to_pickup");
      setCompletedFare(null);
      localCompleteRef.current = false;
      toast.success("Trip completed successfully!");
      queryClient.invalidateQueries({ queryKey: ["pending-rides"] });
      queryClient.invalidateQueries({ queryKey: ["driver-rides", driver?.id] });
    } catch (error) {
      console.error("Failed to submit trip summary:", error);
      toast.error("Failed to submit trip summary");
    }
  };

  const handleCancelTrip = () => {
    // Open reason dialog instead of cancelling immediately
    setCancelReason("");
    setShowCancelDialog(true);
  };

  const handleConfirmCancelTrip = async () => {
    if (!currentTrip || !cancelReason) return;
    try {
      await firebaseClient.entities.Ride.update(currentTrip.id, {
        status: "cancelled",
        cancel_reason: cancelReason,
        cancelled_by: "driver",
        cancelled_at: new Date().toISOString(),
      });
    } catch {}
    toast.info("Trip cancelled");
    setShowCancelDialog(false);
    setCancelReason("");
    setCurrentTrip(null);
    setTripPhase("to_pickup");
    queryClient.invalidateQueries({ queryKey: ["pending-rides"] });
  };

  const openChat = () => { setShowChat(true); setUnreadCount(0); };

  const showRequest = !currentTrip && tripRequests.length > 0;
  const showActive = !!currentTrip;
  const showIdle = !currentTrip && tripRequests.length === 0;

  return (
    <div className="relative" style={{ minHeight: "100vh" }}>
      {/* ── Full-screen map ── */}
      <div className="fixed inset-0 z-0">
        <DriverTripMap trip={currentTrip} phase={tripPhase} />
      </div>

      {/* ── Bolt-style top pill: online status + toggle ── */}
      <div
        className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 pt-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        {/* Status pill — show Online whenever there is an active trip OR driver is online */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm border",
          (isOnline || currentTrip)
            ? "bg-green-600/90 border-green-500/50 text-white"
            : "bg-card/90 border-border text-foreground"
        )}>
          {(isOnline || currentTrip)
            ? <><span className="w-2 h-2 bg-white rounded-full animate-pulse" /><span className="text-xs font-bold">{currentTrip ? "On Trip" : "Online"}</span></>
            : <><span className="w-2 h-2 bg-muted-foreground rounded-full" /><span className="text-xs font-semibold text-muted-foreground">Offline</span></>
          }
        </div>

        {/* Bell notification button */}
        <button
          onClick={() => setShowNotifCenter(true)}
          className="w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm border border-border flex items-center justify-center relative shadow-lg"
        >
          <Bell className="w-4 h-4 text-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Destination filter pill — only when online and no active trip */}
        {isOnline && !currentTrip && (
          destinationMode && driverDestination ? (
            <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg border border-blue-500/50">
              <MapPin className="w-3 h-3" />
              <span className="max-w-[120px] truncate">{driverDestination}</span>
              <button
                onClick={() => { setDestinationMode(false); setDriverDestination(""); }}
                className="ml-1 text-white/80 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDestinationInput(true)}
              className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-2 rounded-full shadow-lg border border-border"
            >
              <MapPin className="w-3 h-3 text-muted-foreground" />
              Destination Filter
            </button>
          )
        )}
      </div>

      {/* ── Destination input modal ── */}
      {showDestinationInput && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70"
          style={{ paddingTop: "80px" }}
          onClick={() => setShowDestinationInput(false)}
        >
          <div
            className="bg-card border border-border w-full max-w-lg rounded-2xl p-5 mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-1">Set Destination Filter</h3>
            <p className="text-xs text-muted-foreground mb-4">Only show ride requests heading your way.</p>
            <input
              type="text"
              placeholder="e.g. Tema, Accra Mall, Airport..."
              value={driverDestination}
              onChange={e => setDriverDestination(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && driverDestination.trim()) {
                  setDestinationMode(true);
                  setShowDestinationInput(false);
                }
              }}
              style={{
                width: "100%",
                background: "hsl(var(--secondary))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "15px",
                color: "hsl(var(--foreground))",
                outline: "none",
                boxSizing: "border-box",
              }}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDestinationInput(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px",
                  border: "1px solid hsl(var(--border))", background: "transparent",
                  color: "hsl(var(--muted-foreground))", fontSize: "14px", fontWeight: 500, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (driverDestination.trim()) {
                    setDestinationMode(true);
                    setShowDestinationInput(false);
                  }
                }}
                style={{
                  flex: 1, padding: "12px", borderRadius: "12px",
                  background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))",
                  fontSize: "14px", fontWeight: 700, cursor: "pointer", border: "none",
                }}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom sheets ── */}
      <AnimatePresence mode="wait">
        {showRequest && (
          <TripRequestSheet
            key="request"
            trip={tripRequests[0]}
            onAccept={handleAcceptTrip}
            onDecline={handleDeclineTrip}
          />
        )}
        {showActive && (
          <>
            {/* Back-to-back ride banner */}
            {tripPhase === "in_progress" && nextTripRequest && (
              <motion.div
                key="next-trip-banner"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-[320px] inset-x-0 z-50 px-4 max-w-lg mx-auto"
              >
                <div className="bg-green-600 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-100 uppercase tracking-wide">New Ride Nearby</p>
                    <p className="text-sm font-bold truncate">
                      {nextTripRequest.pickup_location || nextTripRequest.origin_address || "Pickup"}
                      {" → "}
                      {nextTripRequest.destination_address || nextTripRequest.dropoff_location || "Dropoff"}
                    </p>
                    <p className="text-xs text-green-100 mt-0.5">
                      GH₵{Math.round(nextTripRequest.fare_estimate || nextTripRequest.fare || 0)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={async () => { 
                        try {
                          await firebaseClient.entities.Ride.update(nextTripRequest.id, {
                            status: "driver_completing_nearby",
                            driver_accepted_at: new Date().toISOString(),
                          });
                          toast.success("Ride queued! Finish current trip first.");
                        } catch (err) {
                          toast.error("Failed to accept ride.");
                        }
                      }}
                      className="bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-xl"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setNextTripRequest(null)}
                      className="bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-xl"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            <ActiveTripSheet
              key="active"
              trip={currentTrip}
              tripPhase={tripPhase}
              driver={driver}
              onArrived={handleArrived}
              onStartTrip={handleStartTrip}
              onComplete={handleCompleteTrip}
              onCancel={handleCancelTrip}
              onOpenChat={openChat}
              unreadCount={unreadCount}
              onCall={() => {
                if (voiceCall.status === "active" || voiceCall.status === "calling") {
                  voiceCall.endCall();
                } else {
                  setShowCallOptions(true);
                }
              }}
              callStatus={voiceCall.status}
            />
          </>
        )}
        {showIdle && (
          <OnlineBar
            key="idle"
            isOnline={isOnline}
            driver={driver}
            onToggleOnline={onToggleOnline}
            todayTrips={myTrips}
            commissionConfirmed={commissionConfirmed}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>

      {/* ── Chat modal ── */}
      {showChat && currentTrip && (
        <RideChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          rideId={currentTrip.id}
          currentUserId={driver?.user_id}
          currentUserRole="driver"
          currentUserName={driver?.full_name}
        />
      )}

      {/* ── Driver Cancel Trip Dialog ── */}
      <AnimatePresence>
        {showCancelDialog && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelDialog(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[61] bg-card rounded-t-3xl shadow-2xl border-t border-border"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pt-2 pb-4">
                <h3 className="font-heading font-bold text-lg mb-1">Cancel Trip</h3>
                <p className="text-sm text-muted-foreground mb-4">Please select a reason for cancellation</p>
                <div className="space-y-2 mb-5">
                  {DRIVER_CANCEL_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setCancelReason(reason)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                        cancelReason === reason
                          ? "bg-red-500/10 border-red-500/50 text-red-500"
                          : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {cancelReason === reason && <span className="mr-2">✓</span>}
                      {reason}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full h-13 text-base font-bold bg-red-600 hover:bg-red-700 rounded-2xl"
                  disabled={!cancelReason}
                  onClick={handleConfirmCancelTrip}
                >
                  Confirm Cancellation
                </Button>
                <button
                  className="w-full mt-3 text-sm text-muted-foreground py-2"
                  onClick={() => setShowCancelDialog(false)}
                >
                  Keep Trip
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Post-trip Summary (Rating + Safety) ── */}
      <TripSummaryDialog
        open={showTripSummary}
        onOpenChange={(open) => {
          setShowTripSummary(open);
          // If dialog is closed without submitting, clean up state so bottom nav returns
          if (!open) {
            setCurrentTrip(null);
            setTripPhase("to_pickup");
            setCompletedFare(null);
            localCompleteRef.current = false;
          }
        }}
        passengerName={currentTrip?.rider_name || currentTrip?.passenger_name || "Passenger"}
        safetyData={safetyData}
        tripDuration={currentTrip?.duration_min}
        distance={currentTrip?.distance_km}
        onSubmit={handleTripSummarySubmit}
      />

      {/* ── Trip Fare Screen (shown immediately after Complete Trip) ── */}
      <AnimatePresence>
        {showFareScreen && completedFare && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[71] bg-card rounded-t-3xl shadow-2xl border-t border-border"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pt-2 pb-6">
                {/* Big fare display */}
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">Trip Complete — Total Fare</p>
                  <p className="text-6xl font-heading font-black text-foreground tracking-tight">
                    GH₵{completedFare.finalFare}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentTrip?.category || "Standard"} · {completedFare.actualKm > 0 ? `${completedFare.actualKm.toFixed(1)} km` : "Min fare"} · {completedFare.durationMin} min
                  </p>
                </div>
                {/* Rider info */}
                {currentTrip?.rider_name && (
                  <div className="flex items-center gap-3 bg-secondary rounded-2xl p-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{currentTrip.rider_name}</p>
                      <p className="text-xs text-muted-foreground">{currentTrip.pickup_address || "Pickup"} → {currentTrip.destination_address || "Dropoff"}</p>
                    </div>
                  </div>
                )}
                {/* Show rider the fare */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Show this to your rider</p>
                  <p className="text-4xl font-heading font-black text-primary">GH₵{completedFare.finalFare}</p>
                </div>
                <Button
                  className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 rounded-2xl"
                  onClick={() => { setShowFareScreen(false); setShowTripSummary(true); }}
                >
                  Continue — Finish Trip
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Call Options Modal ── */}
      <AnimatePresence>
        {showCallOptions && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCallOptions(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-[71] bg-card rounded-t-3xl shadow-2xl border-t border-border"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pt-2 pb-4">
                <h3 className="font-heading font-bold text-lg mb-1">Call Rider</h3>
                <p className="text-sm text-muted-foreground mb-5">Choose how you want to call</p>
                <div className="space-y-3">
                  {/* Mobile Network Call */}
                  <button
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    onClick={async () => {
                      let phone = currentTrip?.rider_phone || currentTrip?.passenger_phone;
                      
                      // Backup: If phone is missing in trip, look it up in rider_profiles
                      if (!phone && currentTrip?.rider_id) {
                        try {
                          const q = query(collection(db, "rider_profiles"), where("user_id", "==", currentTrip.rider_id));
                          const snap = await getDocs(q);
                          if (!snap.empty) {
                            phone = snap.docs[0].data().phone;
                          }
                        } catch (e) {
                          console.warn("[DriverHomeTab] Phone lookup failed:", e);
                        }
                      }

                      console.log("[DriverHomeTab] Mobile call attempt. Phone:", phone);
                      
                      if (!phone) {
                        toast.error("Rider phone number not available");
                        return;
                      }

                      // Clean the phone number (remove spaces, dashes, etc.)
                      const cleanPhone = phone.replace(/[^\d+]/g, '');
                      
                      // Use a direct <a> tag for the most reliable trigger on iOS/Android
                      const link = document.createElement("a");
                      link.href = `tel:${cleanPhone}`;
                      // Important: don't use target="_blank" for tel: links on some iOS versions
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      // Fallback for some browsers
                      setTimeout(() => {
                        window.location.href = `tel:${cleanPhone}`;
                      }, 100);
                      
                      setShowCallOptions(false);
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Mobile Network Call</p>
                      <p className="text-xs text-muted-foreground">Uses your phone minutes — rider's number is dialled directly</p>
                    </div>
                  </button>
                  {/* In-App Call */}
                  <button
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    onClick={() => {
                      const calleeId = currentTrip?.rider_id || currentTrip?.user_id;
                      if (!calleeId) { toast.error("Rider not available for in-app call"); return; }
                      voiceCall.startCall(calleeId);
                      setShowCallOptions(false);
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">In-App Call</p>
                      <p className="text-xs text-muted-foreground">Free — uses internet, no phone minutes used</p>
                    </div>
                  </button>
                </div>
                <button
                  className="w-full mt-4 text-sm text-muted-foreground py-2"
                  onClick={() => setShowCallOptions(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* In-App Voice Call — incoming call banner */}
      <IncomingCallModal call={voiceCall} />

      {/* In-App Voice Call — active/calling full-screen overlay */}
      <InCallScreen
        call={voiceCall}
        otherName={currentTrip?.rider_name || currentTrip?.passenger_name || "Rider"}
        otherRole="rider"
      />

      {/* Notification Center */}
      <DriverNotificationCenter
        isOpen={showNotifCenter}
        onClose={() => setShowNotifCenter(false)}
        driverId={driver?.user_id || driver?.id}
      />
    </div>
  );
}
