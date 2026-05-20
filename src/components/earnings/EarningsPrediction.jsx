import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Clock, MapPin, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

const DEMAND_LABELS = { high: "High Demand", medium: "Moderate", low: "Low Demand" };
const DEMAND_COLORS = {
  high: "bg-green-500/10 text-green-400 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

function getTimeOfDayContext() {
  const h = new Date().getHours();
  if (h >= 7 && h <= 9) return { label: "Morning Rush", multiplier: 1.35 };
  if (h >= 11 && h <= 13) return { label: "Lunch Peak", multiplier: 1.2 };
  if (h >= 16 && h <= 19) return { label: "Evening Rush", multiplier: 1.45 };
  if (h >= 20 && h <= 23) return { label: "Night Hours", multiplier: 1.1 };
  if (h >= 0 && h <= 5) return { label: "Late Night", multiplier: 0.85 };
  return { label: "Off-Peak", multiplier: 0.95 };
}

export default function EarningsPrediction({ trips }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const completedTrips = trips.filter((t) => t.status === "completed");
  const avgFare = completedTrips.length > 0
    ? completedTrips.reduce((s, t) => s + (t.fare || 0), 0) / completedTrips.length
    : 12;
  const avgDuration = completedTrips.length > 0
    ? completedTrips.reduce((s, t) => s + (t.duration_min || 20), 0) / completedTrips.length
    : 20;

  // Active trips indicate current route density
  const activeTrips = trips.filter((t) => t.status === "in_progress" || t.status === "pending");
  const routeDensity = activeTrips.length >= 5 ? "high" : activeTrips.length >= 2 ? "medium" : "low";
  const tod = getTimeOfDayContext();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      const now = new Date();
      const hourLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

      const prompt = `You are a rideshare earnings analyst. Based on the following driver data, predict earnings for each of the next 4 hours.

Context:
- Current time: ${hourLabel} on a ${dayName}
- Time-of-day period: ${tod.label} (demand multiplier: ${tod.multiplier})
- Route density (active/pending trips in system): ${routeDensity} (${activeTrips.length} active trips)
- Driver historical avg fare per trip: ₵${avgFare.toFixed(2)}
- Driver historical avg trip duration: ${avgDuration.toFixed(0)} minutes
- Driver completed trips total: ${completedTrips.length}

Output a JSON object with exactly this structure:
{
  "total_predicted": number (sum of 4 hours),
  "confidence": "high" | "medium" | "low",
  "demand_trend": "rising" | "stable" | "falling",
  "hours": [
    { "label": "2:00–3:00 PM", "predicted": number, "demand": "high"|"medium"|"low", "tip": string (max 8 words) },
    ...4 items
  ],
  "strategy_tip": string (one actionable sentence for the driver)
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            total_predicted: { type: "number" },
            confidence: { type: "string" },
            demand_trend: { type: "string" },
            hours: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  predicted: { type: "number" },
                  demand: { type: "string" },
                  tip: { type: "string" },
                },
              },
            },
            strategy_tip: { type: "string" },
          },
        },
      });

      setPrediction(result);
      setLoading(false);
    };

    run();
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-primary" />
            4-Hour Earnings Forecast
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              Density: <span className="font-bold capitalize">{routeDensity}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              {tod.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing route density & demand patterns...</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center py-6">{error}</p>
        )}

        {prediction && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary row */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Predicted next 4h</p>
                <p className="text-3xl font-heading font-bold text-primary">
                  ₵{prediction.total_predicted?.toFixed(2)}
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge className={`text-xs ${prediction.confidence === "high" ? "bg-green-500/20 text-green-400" : prediction.confidence === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground"}`}>
                  {prediction.confidence} confidence
                </Badge>
                <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground">
                  <TrendingUp className={`w-3 h-3 ${prediction.demand_trend === "rising" ? "text-green-400" : prediction.demand_trend === "falling" ? "text-red-400 rotate-180" : "text-muted-foreground"}`} />
                  Demand {prediction.demand_trend}
                </div>
              </div>
            </div>

            {/* Hourly breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {prediction.hours?.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl border p-3 bg-card/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {h.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${DEMAND_COLORS[h.demand]}`}>
                      {DEMAND_LABELS[h.demand] || h.demand}
                    </span>
                  </div>
                  <p className="text-xl font-heading font-bold text-foreground">₵{h.predicted?.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{h.tip}</p>
                </motion.div>
              ))}
            </div>

            {/* Strategy tip */}
            {prediction.strategy_tip && (
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground">{prediction.strategy_tip}</p>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}