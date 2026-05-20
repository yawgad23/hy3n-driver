import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { 
  MapPin, Navigation, DollarSign, Clock, Phone,
  MessageSquare, Check, X, User, Star, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SWIPE_THRESHOLD = 100;

export default function TripRequestCard({ trip, onAccept, onDecline, queueMode = false }) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const opacity = useTransform(x, [-250, -80, 0, 80, 250], [0, 1, 1, 1, 0]);

  // Swipe hint overlays
  const acceptOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const declineOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const response = await base44.functions.invoke("handleTripResponse", {
        tripId: trip.id,
        action: "accept",
      });
      if (response.data.success) {
        toast.success("Trip accepted! Navigate to pickup location.");
        onAccept(response.data.trip);
      }
    } catch (error) {
      toast.error("Failed to accept trip");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      const response = await base44.functions.invoke("handleTripResponse", {
        tripId: trip.id,
        action: "decline",
      });
      if (response.data.success) {
        toast.info("Trip declined");
        onDecline(trip.id);
      }
    } catch (error) {
      toast.error("Failed to decline trip");
    } finally {
      setDeclining(false);
    }
  };

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    if (offset > SWIPE_THRESHOLD) {
      await animate(x, 400, { duration: 0.2 });
      handleAccept();
    } else if (offset < -SWIPE_THRESHOLD) {
      await animate(x, -400, { duration: 0.2 });
      handleDecline();
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  const estimatedEarnings = trip.fare || Math.round((trip.distance_km || 5) * 2.5);

  return (
    <div className="relative select-none">
      {/* Accept hint (right) */}
      <motion.div
        style={{ opacity: acceptOpacity }}
        className="absolute inset-0 flex items-center justify-start pl-6 pointer-events-none z-10 rounded-xl bg-green-500/10"
      >
        <div className="flex flex-col items-center gap-1 text-green-400">
          <Check className="w-10 h-10" />
          <span className="text-xs font-bold uppercase tracking-wider">Accept</span>
        </div>
      </motion.div>

      {/* Decline hint (left) */}
      <motion.div
        style={{ opacity: declineOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none z-10 rounded-xl bg-red-500/10"
      >
        <div className="flex flex-col items-center gap-1 text-red-400">
          <X className="w-10 h-10" />
          <span className="text-xs font-bold uppercase tracking-wider">Decline</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -250, right: 250 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        whileDrag={{ cursor: "grabbing" }}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-20 touch-pan-y"
      >
        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          {/* Swipe hint label */}
          <div className="flex items-center justify-between px-4 pt-2.5 pb-0 text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest">
            <span>← Decline</span>
            <span>Swipe to respond</span>
            <span>Accept →</span>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b border-primary/10 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg">{trip.passenger_name || "Passenger"}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span>4.8</span>
                  </div>
                </div>
              </div>
              {queueMode ? (
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  <Plus className="w-3 h-3 mr-1" />
                  Add to Route
                </Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  Now
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-5 space-y-4">
            {/* Route */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">PICKUP</p>
                  <p className="text-sm font-medium">{trip.pickup_location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium">DROPOFF</p>
                  <p className="text-sm font-medium">{trip.dropoff_location}</p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-heading font-semibold">{trip.distance_km || 5} km</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-heading font-semibold">{trip.duration_min || 15} min</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground">Earnings</p>
                <p className="font-heading font-semibold text-accent">${estimatedEarnings}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleDecline}
                disabled={declining || accepting}
              >
                <X className="w-5 h-5 mr-2" />
                Decline
              </Button>
              <Button
                className={cn("h-12", queueMode ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary/90")}
                onClick={handleAccept}
                disabled={accepting || declining}
              >
                {queueMode ? <Plus className="w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />}
                {accepting ? "Adding..." : queueMode ? "Queue Trip" : "Accept"}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button variant="outline" size="sm" className="h-10"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${trip.pickup_lat || 40.7128},${trip.pickup_lng || -74.006}`, "_blank")}>
                <Navigation className="w-4 h-4 mr-1" />Navigate
              </Button>
              <Button variant="outline" size="sm" className="h-10"
                onClick={() => trip.passenger_phone ? (window.location.href = `tel:${trip.passenger_phone}`) : toast.error("No phone number")}>
                <Phone className="w-4 h-4 mr-1" />Call
              </Button>
              <Button variant="outline" size="sm" className="h-10"
                onClick={() => toast.info("Opening chat with passenger...")}>
                <MessageSquare className="w-4 h-4 mr-1" />Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}