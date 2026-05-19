import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Navigation, Clock, MapPin, Star, TrendingUp, Award, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DriverSuggestions({ pickupLat, pickupLng, onDriverSelect, tripData }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);

  useEffect(() => {
    if (pickupLat && pickupLng) {
      fetchSuggestions();
    }
  }, [pickupLat, pickupLng]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("suggestNearestDriver", {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
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

  const handleSelectDriver = (driver) => {
    onDriverSelect?.(driver);
    toast.success(`Selected ${driver.full_name} - ${driver.distance_km} km away`);
  };

  const statusColors = {
    active: "bg-green-500/20 text-green-600 border-green-500/30",
    on_trip: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No available drivers found near this location</p>
        {totalAvailable === 0 && (
          <p className="text-sm mt-2">All drivers are currently offline or busy</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm">
          Suggested Drivers ({suggestions.length})
        </h3>
        <Badge variant="outline" className="text-xs">
          {totalAvailable} total available
        </Badge>
      </div>

      <AnimatePresence>
        {suggestions.map((driver, index) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                index === 0 && "border-primary/50 bg-primary/5"
              )}
              onClick={() => handleSelectDriver(driver)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Rank Badge */}
                  {index === 0 && (
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg">
                      1
                    </div>
                  )}

                  {/* Driver Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="w-6 h-6 text-primary" />
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center",
                      statusColors[driver.status]
                    )}>
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{driver.full_name}</h4>
                        <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                          <Navigation className="w-3 h-3" />
                          {driver.distance_km} km
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ~{driver.eta_minutes} min ETA
                        </p>
                      </div>
                    </div>

                    {/* Dispatch Score */}
                    {driver.dispatch_score && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${driver.dispatch_score}%` }}
                          />
                        </div>
                        <Badge className="bg-primary text-primary-foreground text-xs min-w-[3rem]">
                          <Zap className="w-3 h-3 mr-0.5" />
                          {driver.dispatch_score}
                        </Badge>
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{driver.rating?.toFixed(1) || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span>{driver.total_trips || 0} trips</span>
                      </div>
                      {driver.recent_trips_24h !== undefined && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{driver.recent_trips_24h} today</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", statusColors[driver.status])}
                      >
                        {driver.status === "on_trip" ? "On Trip" : "Available"}
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-accent text-accent-foreground text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Best Match
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {suggestions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Click on a driver to assign them to this trip
        </p>
      )}
    </div>
  );
}