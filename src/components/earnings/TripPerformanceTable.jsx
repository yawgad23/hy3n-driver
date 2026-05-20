import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, DollarSign } from "lucide-react";
import { format } from "date-fns";

function rateColor(rate) {
  if (rate >= 40) return "text-green-400";
  if (rate >= 20) return "text-yellow-400";
  return "text-muted-foreground";
}

export default function TripPerformanceTable({ trips }) {
  const completed = trips
    .filter((t) => t.status === "completed" && t.fare)
    .slice(0, 10)
    .map((t) => ({
      ...t,
      hourlyRate: t.duration_min > 0 ? (t.fare / (t.duration_min / 60)) : 0,
    }))
    .sort((a, b) => b.hourlyRate - a.hourlyRate);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpRight className="w-4 h-4 text-accent" />
          Trip Performance (by $/hr)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Route</th>
                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Fare</th>
                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">Dist</th>
                <th className="text-right px-4 py-2 text-xs text-muted-foreground font-medium">$/hr</th>
              </tr>
            </thead>
            <tbody>
              {completed.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-muted-foreground text-xs">
                    No completed trips yet
                  </td>
                </tr>
              )}
              {completed.map((trip) => (
                <tr key={trip.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="font-medium truncate max-w-[160px] text-xs">{trip.pickup_location} → {trip.dropoff_location}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {trip.trip_date ? format(new Date(trip.trip_date), "MMM d, h:mm a") : "—"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-bold text-accent">${trip.fare?.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {trip.distance_km?.toFixed(1) || "—"} km
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-bold text-sm ${rateColor(trip.hourlyRate)}`}>
                      ${trip.hourlyRate.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}