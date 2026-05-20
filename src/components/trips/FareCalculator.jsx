import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Timer,
  CarFront,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ── HY3N Fare Config — Bolt/Uber Ghana style (GH₵) ───────────────────────────
const FARE_CONFIG = {
  BASE_FARE: 3.00,            // GH₵ flag-fall
  COST_PER_KM: 1.70,         // GH₵/km (moving)
  COST_PER_MIN_MOVING: 0.17, // GH₵/min while moving
  BOOKING_FEE: 0.80,         // GH₵ fixed
  MIN_FARE: 6.00,            // GH₵ minimum ride

  // Waiting fee (like Bolt Ghana)
  WAITING_FREE_MINS: 3,      // first 3 min free (grace period)
  WAITING_FEE_PER_MIN: 0.20, // GH₵/min after grace period

  // Traffic congestion fee (like Bolt Ghana — charged when nearly stationary)
  // Applied per minute when avg speed < 8 km/h (near-standstill in traffic)
  TRAFFIC_JAM_FEE_PER_MIN: 0.15, // GH₵/min stuck in traffic
  TRAFFIC_JAM_SPEED_KPH: 8,      // speed threshold for congestion charge

  TRAFFIC_MULTIPLIERS: {
    low:    { label: "Light Traffic",    multiplier: 1.0,  color: "text-green-500",  icon: "🟢" },
    medium: { label: "Moderate Traffic", multiplier: 1.25, color: "text-yellow-500", icon: "🟡" },
    high:   { label: "Heavy Traffic",    multiplier: 1.5,  color: "text-orange-500", icon: "🟠" },
    surge:  { label: "Surge Pricing",    multiplier: 1.9,  color: "text-red-500",    icon: "🔴" },
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

// Estimate how many minutes the vehicle is stuck (speed < threshold)
// We approximate this as a fraction of total trip time scaled by traffic severity
function estimateTrafficJamMins(distanceKm, durationMin, trafficLevel) {
  if (trafficLevel === "low" || trafficLevel === "medium") return 0;
  const avgSpeedKph = (distanceKm / durationMin) * 60;
  if (avgSpeedKph >= FARE_CONFIG.TRAFFIC_JAM_SPEED_KPH * 2) return 0;
  // Rough estimate: proportion of time near-stationary
  const jamFraction = trafficLevel === "surge" ? 0.35 : 0.20;
  return Math.round(durationMin * jamFraction);
}

export function calculateFare(distanceKm, durationMin, waitingMins = 0) {
  if (!distanceKm || !durationMin || distanceKm <= 0 || durationMin <= 0) return null;

  const trafficLevel = estimateTrafficLevel(distanceKm, durationMin);
  const traffic = FARE_CONFIG.TRAFFIC_MULTIPLIERS[trafficLevel];

  // Core trip cost
  const distanceCost = distanceKm * FARE_CONFIG.COST_PER_KM;
  const timeCost = durationMin * FARE_CONFIG.COST_PER_MIN_MOVING;
  const subtotal = (FARE_CONFIG.BASE_FARE + distanceCost + timeCost) * traffic.multiplier;

  // Waiting fee — first WAITING_FREE_MINS are free (Bolt grace period)
  const billableWaitMins = Math.max(0, waitingMins - FARE_CONFIG.WAITING_FREE_MINS);
  const waitingFee = billableWaitMins * FARE_CONFIG.WAITING_FEE_PER_MIN;

  // Traffic congestion fee — charged when near-stationary in jam
  const jamMins = estimateTrafficJamMins(distanceKm, durationMin, trafficLevel);
  const trafficJamFee = jamMins * FARE_CONFIG.TRAFFIC_JAM_FEE_PER_MIN;

  const rawTotal = subtotal + waitingFee + trafficJamFee + FARE_CONFIG.BOOKING_FEE;
  const total = Math.max(Math.round(rawTotal * 100) / 100, FARE_CONFIG.MIN_FARE);

  const surgeExtra = traffic.multiplier > 1
    ? (traffic.multiplier - 1) * (FARE_CONFIG.BASE_FARE + distanceCost + timeCost)
    : 0;

  return {
    baseFare: FARE_CONFIG.BASE_FARE,
    distanceCost,
    timeCost,
    trafficLevel,
    trafficLabel: traffic.label,
    trafficMultiplier: traffic.multiplier,
    trafficColor: traffic.color,
    trafficIcon: traffic.icon,
    surgeExtra,
    waitingMins,
    billableWaitMins,
    waitingFee,
    jamMins,
    trafficJamFee,
    subtotal,
    bookingFee: FARE_CONFIG.BOOKING_FEE,
    total,
    minFare: Math.max(Math.round(total * 0.9 * 100) / 100, FARE_CONFIG.MIN_FARE),
    maxFare: Math.round(total * 1.1 * 100) / 100,
  };
}

export default function FareCalculator({ distanceKm, durationMin, onFareCalculated }) {
  const [expanded, setExpanded] = useState(false);
  const [waitingMins, setWaitingMins] = useState(0);
  const [fare, setFare] = useState(null);

  useEffect(() => {
    const result = calculateFare(Number(distanceKm), Number(durationMin), Number(waitingMins));
    setFare(result);
    if (result) onFareCalculated?.(result.total);
  }, [distanceKm, durationMin, waitingMins]);

  if (!distanceKm || !durationMin || !fare) return null;

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

          {/* Waiting time input — always visible for quick access */}
          <div className="mt-3 flex items-center gap-3">
            <Timer className="w-4 h-4 text-yellow-500 shrink-0" />
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Waiting time (min)
            </Label>
            <Input
              type="number"
              min="0"
              max="60"
              value={waitingMins}
              onChange={(e) => setWaitingMins(Math.max(0, Number(e.target.value)))}
              className="h-7 w-20 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-muted-foreground">
              {waitingMins <= FARE_CONFIG.WAITING_FREE_MINS
                ? `Free (≤${FARE_CONFIG.WAITING_FREE_MINS} min grace)`
                : `+₵${fare.waitingFee.toFixed(2)} waiting fee`}
            </span>
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
                      <span>{Number(durationMin).toFixed(0)} min × ₵{FARE_CONFIG.COST_PER_MIN_MOVING}/min</span>
                    </div>
                    <span>₵{fare.timeCost.toFixed(2)}</span>
                  </div>

                  {fare.surgeExtra > 0 && (
                    <div className={cn("flex items-center justify-between", fare.trafficColor)}>
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{fare.trafficIcon} {fare.trafficLabel} ({fare.trafficMultiplier}×)</span>
                      </div>
                      <span>+₵{fare.surgeExtra.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Waiting fee */}
                  <div className={cn(
                    "flex items-center justify-between",
                    fare.billableWaitMins > 0 ? "text-yellow-600" : "text-muted-foreground"
                  )}>
                    <div className="flex items-center gap-2">
                      <Timer className="w-3.5 h-3.5" />
                      <span>
                        Waiting fee
                        {fare.waitingMins > 0 && fare.billableWaitMins === 0
                          ? ` (${fare.waitingMins} min — within free grace)`
                          : fare.billableWaitMins > 0
                            ? ` (${fare.billableWaitMins} min × ₵${FARE_CONFIG.WAITING_FEE_PER_MIN}/min)`
                            : " (3 min free)"}
                      </span>
                    </div>
                    <span>{fare.waitingFee > 0 ? `+₵${fare.waitingFee.toFixed(2)}` : "Free"}</span>
                  </div>

                  {/* Traffic jam fee */}
                  {fare.jamMins > 0 && (
                    <div className="flex items-center justify-between text-orange-500">
                      <div className="flex items-center gap-2">
                        <CarFront className="w-3.5 h-3.5" />
                        <span>Traffic congestion ({fare.jamMins} min × ₵{FARE_CONFIG.TRAFFIC_JAM_FEE_PER_MIN}/min)</span>
                      </div>
                      <span>+₵{fare.trafficJamFee.toFixed(2)}</span>
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

                  {/* Info box */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-700">
                      <Timer className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Waiting fee:</strong> First {FARE_CONFIG.WAITING_FREE_MINS} min free, then ₵{FARE_CONFIG.WAITING_FEE_PER_MIN}/min — same as Bolt Ghana.
                      </span>
                    </div>
                    {fare.jamMins > 0 && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-700">
                        <CarFront className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          <strong>Traffic congestion fee:</strong> ₵{FARE_CONFIG.TRAFFIC_JAM_FEE_PER_MIN}/min when stuck in heavy traffic — same as Bolt Ghana policy.
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/60 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Final fare may vary ₵{fare.minFare.toFixed(2)} – ₵{fare.maxFare.toFixed(2)}. 15% HY3N commission deducted from driver payout.
                      </span>
                    </div>
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