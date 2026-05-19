import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Car, 
  Navigation, 
  DollarSign, 
  Clock,
  TrendingUp,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  User,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TripRequestCard from "./TripRequestCard";
import DriverMessageDialog from "./DriverMessageDialog";
import { toast } from "sonner";

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripRequests, setTripRequests] = useState([]);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch driver profile
  const { data: driver } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({});
      return drivers[0] || null;
    },
    enabled: isOnline,
  });

  // Fetch pending trip requests (trips without driver or in driver's area)
  const { data: pendingTrips } = useQuery({
    queryKey: ["pending-trips"],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ status: "pending" });
      return trips;
    },
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: isOnline,
  });

  // Update online status
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      if (!driver) return;
      await base44.entities.Driver.update(driver.id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    },
  });

  useEffect(() => {
    if (isOnline && driver) {
      updateStatusMutation.mutate("active");
    } else if (!isOnline && driver) {
      updateStatusMutation.mutate("offline");
    }
  }, [isOnline, driver]);

  useEffect(() => {
    if (pendingTrips && pendingTrips.length > 0) {
      setTripRequests(pendingTrips);
    }
  }, [pendingTrips]);

  const handleAcceptTrip = (trip) => {
    setCurrentTrip(trip);
    setTripRequests([]);
    toast.success("Trip started! Navigate to pickup.");
  };

  const handleDeclineTrip = (tripId) => {
    setTripRequests(prev => prev.filter(t => t.id !== tripId));
  };

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    
    try {
      await base44.functions.invoke("updateTripStatus", {
        tripId: currentTrip.id,
        status: "completed",
      });
      
      toast.success("Trip completed! Earnings added.");
      setCurrentTrip(null);
      queryClient.invalidateQueries({ queryKey: ["pending-trips"] });
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    } catch (error) {
      toast.error("Failed to complete trip");
    }
  };

  const handleCancelTrip = async () => {
    if (!currentTrip) return;
    
    try {
      await base44.functions.invoke("updateTripStatus", {
        tripId: currentTrip.id,
        status: "cancelled",
      });
      
      toast.info("Trip cancelled");
      setCurrentTrip(null);
      queryClient.invalidateQueries({ queryKey: ["pending-trips"] });
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
    } catch (error) {
      toast.error("Failed to cancel trip");
    }
  };

  const handleNavigateToPickup = () => {
    if (!currentTrip) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentTrip.pickup_lat || 40.7128},${currentTrip.pickup_lng || -74.0060}`;
    window.open(url, "_blank");
  };

  const handleNavigateToDropoff = () => {
    if (!currentTrip) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${currentTrip.dropoff_lat || 40.7128},${currentTrip.dropoff_lng || -74.0060}`;
    window.open(url, "_blank");
  };

  const handleSendMessage = async (message) => {
    if (!currentTrip) return;
    // Store message in Trip entity or send via backend function
    await base44.entities.Trip.update(currentTrip.id, {
      last_message: message,
      last_message_from: "driver",
      last_message_time: new Date().toISOString()
    });
  };

  const handleCallPassenger = () => {
    const phoneNumber = currentTrip?.passenger_phone;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.error("No phone number available");
    }
  };

  if (!driver) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-lg mb-2">No Driver Profile</h3>
          <p className="text-muted-foreground text-sm">Please create a driver profile first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Online Status Toggle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="font-heading text-lg">Driver Mode</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isOnline ? "You're receiving trip requests" : "You're offline"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOnline ? "default" : "secondary"} className={cn(
              isOnline ? "bg-accent" : "bg-muted"
            )}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Switch
              checked={isOnline}
              onCheckedChange={setIsOnline}
              className={isOnline ? "data-[state=checked]:bg-accent" : ""}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Current Trip */}
      <AnimatePresence>
        {currentTrip && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-accent/30 shadow-xl">
              <CardHeader className="bg-accent/10 border-b border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <CardTitle className="font-heading text-lg">Active Trip</CardTitle>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">
                    In Progress
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">PICKUP</p>
                      <p className="text-sm font-medium">{currentTrip.pickup_location}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNavigateToPickup}>
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">DROPOFF</p>
                      <p className="text-sm font-medium">{currentTrip.dropoff_location}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNavigateToDropoff}>
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="font-heading font-semibold">{currentTrip.distance_km || 5} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className="font-heading font-semibold text-accent">${currentTrip.fare || 15}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{currentTrip.passenger_name || "Passenger"}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCallPassenger}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMessageDialog(true)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3">
                  <Button
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleCancelTrip}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Trip
                  </Button>
                  <Button
                    className="bg-accent hover:bg-accent/90"
                    onClick={handleCompleteTrip}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Trip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Dialog */}
      <DriverMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        passengerName={currentTrip?.passenger_name || "Passenger"}
        onSendMessage={handleSendMessage}
      />

      {/* Trip Requests */}
      <AnimatePresence>
        {isOnline && tripRequests.length > 0 && !currentTrip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-lg">Trip Requests</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tripRequests.length} new {tripRequests.length === 1 ? "request" : "requests"}
                    </p>
                  </div>
                  <Badge className="bg-primary">
                    <Clock className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tripRequests.map((trip) => (
                  <TripRequestCard
                    key={trip.id}
                    trip={trip}
                    onAccept={handleAcceptTrip}
                    onDecline={handleDeclineTrip}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Requests State */}
      {isOnline && tripRequests.length === 0 && !currentTrip && (
        <Card>
          <CardContent className="p-12 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            </motion.div>
            <h3 className="font-heading font-semibold text-lg mb-2">Looking for Trips</h3>
            <p className="text-muted-foreground text-sm">
              You're online and will see trip requests here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="font-heading font-semibold text-accent">
                ${driver.total_earnings || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Trips</p>
              <p className="font-heading font-semibold">
                {driver.total_trips || 0}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-secondary-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="font-heading font-semibold">
                {driver.rating?.toFixed(1) || "5.0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}