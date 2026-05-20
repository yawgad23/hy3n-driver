import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Fare configuration
const FARE_CONFIG = {
  BASE_FARE: 2.50,
  COST_PER_KM: 1.20,
  COST_PER_MIN: 0.25,
  TRAFFIC_MULTIPLIERS: {
    low: { label: "Light Traffic", multiplier: 1.0, color: "text-green-500", icon: "🟢" },
    medium: { label: "Moderate Traffic", multiplier: 1.2, color: "text-yellow-500", icon: "🟡" },
    high: { label: "Heavy Traffic", multiplier: 1.5, color: "text-orange-500", icon: "🟠" },
    surge: { label: "Surge Pricing", multiplier: 2.0, color: "text-red-500", icon: "🔴" },
  },
  SERVICE_FEE_RATE: 0.10,  // 10%
  BOOKING_FEE: 0.50,
};

function estimateTrafficLevel(distanceKm, durationMin) {
  if (!distanceKm || !durationMin) return "low";
  // Average speed in km/h
  const avgSpeedKph = (distanceKm / durationMin) * 60;
  if (avgSpeedKph >= 40) return "low";
  if (avgSpeedKph >= 25) return "medium";
  if (avgSpeedKph >= 12) return "high";
  return "surge";
}

export function calculateFare(distanceKm, durationMin) {
  if (!distanceKm || !durationMin || distanceKm <= 0 || durationMin <= 0) return null;

  const trafficLevel = estimateTrafficLevel(distanceKm, durationMin);
  const traffic = FARE_CONFIG.TRAFFIC_MULTIPLIERS[trafficLevel];

  const distanceCost = distanceKm * FARE_CONFIG.COST_PER_KM;
  const timeCost = durationMin * FARE_CONFIG.COST_PER_MIN;
  const subtotal = (FARE_CONFIG.BASE_FARE + distanceCost + timeCost) * traffic.multiplier;
  const serviceFee = subtotal * FARE_CONFIG.SERVICE_FEE_RATE;
  const total = subtotal + serviceFee + FARE_CONFIG.BOOKING_FEE;

  return {
    baseFare: FARE_CONFIG.BASE_FARE,
    distanceCost,
    timeCost,
    trafficLevel,
    trafficLabel: traffic.label,
    trafficMultiplier: traffic.multiplier,
    trafficColor: traffic.color,
    trafficIcon: traffic.icon,
    subtotal,
    serviceFee,
    bookingFee: FARE_CONFIG.BOOKING_FEE,
    total: Math.round(total * 100) / 100,
    // Range (±10%)
    minFare: Math.round(total * 0.9 * 100) / 100,
    maxFare: Math.round(total * 1.1 * 100) / 100,
  };
}

export default function FareCalculator({ distanceKm, durationMin, onFareCalculated }) {
  const [expanded, setExpanded] = useState(false);
  const [fare, setFare] = useState(null);

  useEffect(() => {
    const result = calculateFare(Number(distanceKm), Number(durationMin));
    setFare(result);
    if (result) onFareCalculated?.(result.total);
  }, [distanceKm, durationMin]);

  if (!distanceKm || !durationMin) return null;
  if (!fare) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          {/* Header Row */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="font-heading font-semibold text-sm">Estimated Fare</span>
              <Badge
                className={cn("text-xs px-2 py-0.5", 
                  fare.trafficLevel === "low" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                  fare.trafficLevel === "medium" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                  fare.trafficLevel === "high" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                  "bg-red-500/10 text-red-600 border-red-500/20"
                )}
                variant="outline"
              >
                {fare.trafficIcon} {fare.trafficLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-heading font-bold text-xl text-primary">
                  ${fare.total.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground block leading-tight">
                  ${fare.minFare} – ${fare.maxFare}
                </span>
              </div>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>

          {/* Expandable Breakdown */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />

                <div className="space-y-2 text-sm">
                  {/* Base fare */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Base fare</span>
                    </div>
                    <span>${FARE_CONFIG.BASE_FARE.toFixed(2)}</span>
                  </div>

                  {/* Distance cost */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{Number(distanceKm).toFixed(1)} km × ${FARE_CONFIG.COST_PER_KM}/km</span>
                    </div>
                    <span>${fare.distanceCost.toFixed(2)}</span>
                  </div>

                  {/* Time cost */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Number(durationMin).toFixed(0)} min × ${FARE_CONFIG.COST_PER_MIN}/min</span>
                    </div>
                    <span>${fare.timeCost.toFixed(2)}</span>
                  </div>

                  {/* Traffic multiplier */}
                  {fare.trafficMultiplier > 1 && (
                    <div className={cn("flex items-center justify-between", fare.trafficColor)}>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{fare.trafficIcon} {fare.trafficLabel} ({fare.trafficMultiplier}×)</span>
                      </div>
                      <span>+${((fare.trafficMultiplier - 1) * (FARE_CONFIG.BASE_FARE + fare.distanceCost + fare.timeCost)).toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Service fee */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Service fee (10%)</span>
                    </div>
                    <span>${fare.serviceFee.toFixed(2)}</span>
                  </div>

                  {/* Booking fee */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Booking fee</span>
                    </div>
                    <span>${fare.bookingFee.toFixed(2)}</span>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex items-center justify-between font-semibold text-base">
                    <span>Estimated Total</span>
                    <span className="text-primary">${fare.total.toFixed(2)}</span>
                  </div>

                  {/* Range note */}
                  <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Final fare may vary between <strong>${fare.minFare}</strong> – <strong>${fare.maxFare}</strong> based on actual route and real-time traffic conditions.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}