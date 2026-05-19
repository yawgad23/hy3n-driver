import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Zap, 
  Car, 
  Navigation, 
  Clock, 
  MapPin, 
  Star, 
  TrendingUp, 
  Award,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AutoDispatchPanel({ trip, onDriverAssigned }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [autoDispatching, setAutoDispatching] = useState(false);

  useEffect(() => {
    if (trip?.pickup_lat && trip?.pickup_lng && trip.status === "pending") {
      fetchSuggestions();
    }
  }, [trip?.id, trip?.pickup_lat, trip?.pickup_lng]);

  const fetchSuggestions = async () => {
    if (!trip?.pickup_lat || !trip?.pickup_lng) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke("suggestNearestDriver", {
        pickup_lat: trip.pickup_lat,
        pickup_lng: trip.pickup_lng,
        trip_id: trip.id,
      });

      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        setTotalAvailable(response.data.total_available);
      }
    } catch (error) {
      console.error("Failed to fetch driver suggestions:", error);
      toast.error("Could not load driver suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDispatch = async () => {
    if (suggestions.length === 0) {
      toast.error("No available drivers for auto-dispatch");
      return;
    }

    setAutoDispatching(true);
    try {
      const topDriver = suggestions[0];
      
      // Update the trip with the selected driver
      await base44.entities.Trip.update(trip.id, {
        driver_id: topDriver.id,
        status: "in_progress",
      });

      toast.success(`Auto-dispatched to ${topDriver.full_name} (${topDriver.distance_km} km away)`);
      onDriverAssigned?.(topDriver);
    } catch (error) {
      console.error("Auto-dispatch failed:", error);
      toast.error("Failed to assign driver");
    } finally {
      setAutoDispatching(false);
    }
  };

  const handleManualSelect = (driver) => {
    onDriverAssigned?.(driver);
    toast.success(`Selected ${driver.full_name} - ${driver.distance_km} km away`);
  };

  const statusColors = {
    active: "bg-green-500/20 text-green-600 border-green-500/30",
    on_trip: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  };

  if (trip?.status !== "pending") {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-primary" />
            Auto-Dispatch Engine
          </CardTitle>
          <CardDescription>
            Intelligent driver matching based on location, availability, and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No available drivers found near this location</p>
            {totalAvailable === 0 && (
              <p className="text-sm mt-2">All drivers are currently offline or busy</p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSuggestions}
              className="mt-4 gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topDriver = suggestions[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Auto-Dispatch Engine</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalAvailable} drivers available
          </Badge>
        </div>
        <CardDescription>
          AI-powered matching based on distance, rating, and workload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auto-Dispatch Button */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Best Match: {topDriver.full_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {topDriver.distance_km} km away
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{topDriver.eta_minutes} min ETA
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleAutoDispatch}
              disabled={autoDispatching}
              className="bg-primary hover:bg-primary/90 gap-2"
              size="sm"
            >
              {autoDispatching ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-Dispatch
                </>
              )}
            </Button>
          </div>
          
          {/* Top Driver Score */}
          {topDriver.dispatch_score && (
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Dispatch Score</span>
                <span className="font-semibold text-primary">{topDriver.dispatch_score}/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${topDriver.dispatch_score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Other Suggestions */}
        {suggestions.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Other Available Drivers</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchSuggestions}
                className="h-6 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            <AnimatePresence>
              {suggestions.slice(1, 4).map((driver, index) => (
                <motion.div
                  key={driver.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm"
                    onClick={() => handleManualSelect(driver)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center",
                            statusColors[driver.status]
                          )}>
                            <div className="w-2 h-2 rounded-full bg-current" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{driver.full_name}</p>
                            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                              <Navigation className="w-3 h-3" />
                              {driver.distance_km} km
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {driver.rating?.toFixed(1) || "N/A"}
                            </span>
                            <span>•</span>
                            <span>{driver.eta_minutes} min</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs py-0 h-5">
                              Score: {driver.dispatch_score}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {suggestions.length > 3 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{suggestions.length - 3} more drivers available
          </p>
        )}
      </CardContent>
    </Card>
  );
}