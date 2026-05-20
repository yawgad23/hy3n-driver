import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, MapPin, CheckCircle2, Clock, DollarSign,
  Route, ChevronDown, ChevronUp, ExternalLink, Wand2, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { routeSummary } from "@/hooks/useMultiStopOptimizer";

// Navigation app launchers
function buildGoogleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}
function buildWazeUrl(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

const STOP_COLORS = {
  pickup: { dot: "bg-green-500", badge: "bg-green-500/10 text-green-400 border-green-500/20", label: "PICKUP" },
  dropoff: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-400 border-red-500/20", label: "DROP-OFF" },
};

export default function MultiStopPanel({ stops, currentStopIndex, onStopComplete, onCancel }) {
  const [expanded, setExpanded] = useState(true);
  const [navChoice, setNavChoice] = useState(null); // "google" | "waze"

  if (!stops || stops.length === 0) return null;

  const currentStop = stops[currentStopIndex];
  const completedCount = currentStopIndex;
  const totalStops = stops.length;
  const progress = (completedCount / totalStops) * 100;
  const summary = routeSummary(stops);
  const remainingStops = stops.slice(currentStopIndex);
  const isLastStop = currentStopIndex === totalStops - 1;

  const handleNavigate = (app) => {
    if (!currentStop) return;
    const url = app === "waze"
      ? buildWazeUrl(currentStop.lat, currentStop.lng)
      : buildGoogleMapsUrl(currentStop.lat, currentStop.lng);
    window.open(url, "_blank");
  };

  return (
    <Card className="border-2 border-primary/30 shadow-xl overflow-hidden">
      {/* Header */}
      <CardHeader
        className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20 py-3 px-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading text-base">Multi-Stop Route</CardTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              {completedCount}/{totalStops} done
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/20 text-accent border-accent/20 text-xs">
              <Wand2 className="w-3 h-3 mr-1" />
              Optimized
            </Badge>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 space-y-1">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{summary.totalKm} km total route</span>
            <span>~{summary.totalMin} min</span>
            <span className="text-accent font-medium">${summary.totalFare} total</span>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-4 space-y-4">

              {/* Current Stop Hero */}
              {currentStop && (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide">
                      Next Stop ({currentStop.stopNumber}/{totalStops})
                    </p>
                    <Badge variant="outline" className={cn("text-[10px]", STOP_COLORS[currentStop.type].badge)}>
                      {STOP_COLORS[currentStop.type].label}
                    </Badge>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", STOP_COLORS[currentStop.type].dot)} />
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-sm">{currentStop.address}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {currentStop.passengerName}
                        <span className="mx-1">·</span>
                        <Clock className="w-3 h-3" />
                        ~{currentStop.estimatedMinutes} min away
                        <span className="mx-1">·</span>
                        {currentStop.distanceFromPrev.toFixed(1)} km
                      </p>
                    </div>
                  </div>

                  {/* Navigate to Next Stop — primary CTA */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="h-11 bg-primary hover:bg-primary/90 font-semibold"
                      onClick={() => handleNavigate("google")}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Google Maps
                      <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-semibold"
                      onClick={() => handleNavigate("waze")}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Waze
                      <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                    </Button>
                  </div>

                  {/* Mark stop done */}
                  <Button
                    className={cn(
                      "w-full h-10",
                      currentStop.type === "pickup"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-accent hover:bg-accent/90"
                    )}
                    onClick={() => onStopComplete(currentStop)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {currentStop.type === "pickup" ? "✓ Passenger Picked Up" : isLastStop ? "✓ Complete & Finish" : "✓ Dropped Off — Next Stop"}
                  </Button>
                </div>
              )}

              {/* Upcoming stops list */}
              {remainingStops.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Upcoming Stops
                  </p>
                  {remainingStops.slice(1).map((stop, i) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
                        {stop.stopNumber}
                      </div>
                      <div className={cn("w-2 h-2 rounded-full shrink-0", STOP_COLORS[stop.type].dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{stop.address}</p>
                        <p className="text-[10px] text-muted-foreground">{stop.passengerName} · {stop.type}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] shrink-0", STOP_COLORS[stop.type].badge)}>
                        ~{stop.estimatedMinutes}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed stops */}
              {completedCount > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Completed
                  </p>
                  {stops.slice(0, completedCount).map(stop => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">{stop.address} ({stop.passengerName})</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Cancel */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 text-xs"
                onClick={onCancel}
              >
                Cancel Multi-Stop Route
              </Button>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}