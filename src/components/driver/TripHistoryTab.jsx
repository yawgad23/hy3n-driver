import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Car, Star, MapPin, Clock, DollarSign, ChevronRight, CheckCircle2, XCircle, Calendar
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export default function TripHistoryTab({ trips = [] }) {
  const [filter, setFilter] = useState("all");

  const filtered = trips.filter(t => filter === "all" ? true : t.status === filter);
  const totalEarnings = trips.filter(t => t.status === "completed").reduce((s, t) => s + (t.fare || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-3 text-center">
            <p className="font-heading font-bold text-accent">${totalEarnings.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading font-bold">{trips.filter(t => t.status === "completed").length}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="font-heading font-bold">{trips.filter(t => t.status === "cancelled").length}</p>
            <p className="text-[10px] text-muted-foreground">Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "completed", "cancelled", "in_progress"].map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="shrink-0 h-7 text-xs capitalize"
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Trip list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Car className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No trips found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(trip => (
            <Card key={trip.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-heading font-semibold text-sm">
                      {trip.passenger_name || "Unknown Rider"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {trip.trip_date
                        ? format(new Date(trip.trip_date), "MMM d, h:mm a")
                        : format(new Date(trip.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-accent">${trip.fare?.toFixed(2) || "—"}</p>
                    <Badge variant="outline" className={cn("text-[10px] mt-1", STATUS_STYLES[trip.status])}>
                      {trip.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0" />
                    <span className="truncate">{trip.pickup_location}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                    <span className="truncate">{trip.dropoff_location}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{trip.distance_km || "—"} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{trip.duration_min || "—"} min
                  </span>
                  {trip.passenger_rating && (
                    <span className="flex items-center gap-1 ml-auto">
                      <Star className="w-3 h-3 text-yellow-500" />
                      Rated {trip.passenger_rating}/5
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}