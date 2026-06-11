import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

// No percentage commission — drivers keep 100% of fares
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
      netFare: t.fare,
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
        {completed.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground text-xs">No completed trips yet</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
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
                  {completed.map((trip) => (
                    <tr key={trip.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="font-medium truncate max-w-[160px] text-xs">{trip.pickup_location} → {trip.dropoff_location}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {trip.trip_date ? format(new Date(trip.trip_date), "MMM d, h:mm a") : "—"}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="font-bold text-accent">₵{trip.netFare?.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                        {trip.distance_km?.toFixed(1) || "—"} km
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`font-bold text-sm ${rateColor(trip.hourlyRate)}`}>
                          ₵{trip.hourlyRate.toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border/50">
              {completed.map((trip) => (
                <div key={trip.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{trip.pickup_location} → {trip.dropoff_location}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {trip.trip_date ? format(new Date(trip.trip_date), "MMM d, h:mm a") : "—"}
                      {trip.distance_km ? ` · ${trip.distance_km.toFixed(1)} km` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-accent text-sm">₵{trip.netFare?.toFixed(2)}</p>
                    <p className={`text-xs font-semibold ${rateColor(trip.hourlyRate)}`}>
                      ₵{trip.hourlyRate.toFixed(0)}/hr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}