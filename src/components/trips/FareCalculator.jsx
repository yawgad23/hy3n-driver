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
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── HY3N Fare Configuration (GH₵, modelled on Uber/Bolt Ghana rates) ─────────
// Uber Ghana: base ~GH₵3.50, ~GH₵1.80/km, ~GH₵0.18/min
// Bolt Ghana:  base ~GH₵2.50, ~GH₵1.60/km, ~GH₵0.15/min
// HY3N sits between the two with a 15% platform commission already separate.
const FARE_CONFIG = {
  BASE_FARE: 3.00,          // GH₵ — pickup/flag-fall fee
  COST_PER_KM: 1.70,        // GH₵/km
  COST_PER_MIN: 0.17,       // GH₵/min (time component while moving)
  BOOKING_FEE: 0.80,        // GH₵ fixed platform booking fee
  SERVICE_FEE_RATE: 0.00,   // Already captured via 15% driver commission — no double-dip
  MIN_FARE: 6.00,           // GH₵ minimum ride fare
  TRAFFIC_MULTIPLIERS: {
    low:   { label: "Light Traffic",    multiplier: 1.0, color: "text-green-500",  icon: "🟢" },
    medium:{ label: "Moderate Traffic", multiplier: 1.25,color: "text-yellow-500", icon: "🟡" },
    high:  { label: "Heavy Traffic",    multiplier: 1.5, color: "text-orange-500", icon: "🟠" },
    surge: { label: "Surge Pricing",    multiplier: 1.9, color: "text-red-500",    icon: "🔴" },
  },
};

function estimateTrafficLevel(distanceKm, durationMin) {
  if (!distanceKm || !durationMin) return "low";
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
  const rawTotal = subtotal + FARE_CONFIG.BOOKING_FEE;
  const total = Math.max(Math.round(rawTotal * 100) / 100, FARE_CONFIG.MIN_FARE);

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
    bookingFee: FARE_CONFIG.BOOKING_FEE,
    total,
    minFare: Math.max(Math.round(total * 0.9 * 100) / 100, FARE_CONFIG.MIN_FARE),
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

  if (!distanceKm || !durationMin || !fare) return null;

  const surgeExtra = fare.trafficMultiplier > 1
    ? (fare.trafficMultiplier - 1) * (FARE_CONFIG.BASE_FARE + fare.distanceCost + fare.timeCost)
    : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          {/* Header */}
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <span className="font-heading font-semibold text-sm">Estimated Fare</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5",
                  fare.trafficLevel === "low"    && "bg-green-500/10 text-green-600 border-green-500/20",
                  fare.trafficLevel === "medium" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                  fare.trafficLevel === "high"   && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                  fare.trafficLevel === "surge"  && "bg-red-500/10 text-red-600 border-red-500/20",
                )}
              >
                {fare.trafficIcon} {fare.trafficLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="font-heading font-bold text-xl text-primary">
                  ₵{fare.total.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground block leading-tight">
                  ₵{fare.minFare.toFixed(2)} – ₵{fare.maxFare.toFixed(2)}
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Base fare (flag-fall)</span>
                    </div>
                    <span>₵{FARE_CONFIG.BASE_FARE.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{Number(distanceKm).toFixed(1)} km × ₵{FARE_CONFIG.COST_PER_KM}/km</span>
                    </div>
                    <span>₵{fare.distanceCost.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{Number(durationMin).toFixed(0)} min × ₵{FARE_CONFIG.COST_PER_MIN}/min</span>
                    </div>
                    <span>₵{fare.timeCost.toFixed(2)}</span>
                  </div>

                  {fare.trafficMultiplier > 1 && (
                    <div className={cn("flex items-center justify-between", fare.trafficColor)}>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{fare.trafficIcon} {fare.trafficLabel} ({fare.trafficMultiplier}×)</span>
                      </div>
                      <span>+₵{surgeExtra.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Booking fee</span>
                    </div>
                    <span>₵{fare.bookingFee.toFixed(2)}</span>
                  </div>

                  {fare.total === FARE_CONFIG.MIN_FARE && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Minimum fare applied</span>
                      </div>
                      <span>₵{FARE_CONFIG.MIN_FARE.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between font-semibold text-base">
                    <span>Rider Pays</span>
                    <span className="text-primary">₵{fare.total.toFixed(2)}</span>
                  </div>

                  <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Pricing modelled on Uber/Bolt Ghana rates (GH₵). Final fare may vary between{" "}
                      <strong>₵{fare.minFare.toFixed(2)}</strong> – <strong>₵{fare.maxFare.toFixed(2)}</strong>{" "}
                      based on actual route and real-time traffic. 15% HY3N commission deducted from driver payout.
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