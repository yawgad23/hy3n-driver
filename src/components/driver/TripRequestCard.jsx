import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Navigation, 
  DollarSign, 
  Clock, 
  Phone,
  MessageSquare,
  Check,
  X,
  User,
  Star,
  Car,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function TripRequestCard({ trip, onAccept, onDecline, queueMode = false }) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

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
      console.error(error);
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
      console.error(error);
    } finally {
      setDeclining(false);
    }
  };

  const handleNavigate = () => {
    // Open Google Maps with pickup location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${trip.pickup_lat || 40.7128},${trip.pickup_lng || -74.0060}`;
    window.open(url, "_blank");
  };

  const handleCallPassenger = () => {
    const phoneNumber = trip.passenger_phone;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.error("No phone number available");
    }
  };

  const handleMessagePassenger = () => {
    toast.info("Opening chat with passenger...");
  };

  const estimatedEarnings = trip.fare || Math.round((trip.distance_km || 5) * 2.5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b border-primary/10">
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
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={handleNavigate}
            >
              <Navigation className="w-4 h-4 mr-1" />
              Navigate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={handleCallPassenger}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={handleMessagePassenger}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}