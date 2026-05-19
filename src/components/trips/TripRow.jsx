import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Navigation, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  completed: "bg-accent/10 text-accent border-accent/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TripRow({ trip, index = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={() => navigate(`/trips/${trip.id}`)}
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Route icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Navigation className="w-4 h-4 text-primary" />
      </div>

      {/* Route details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium truncate">{trip.driver_name}</p>
          <span className="text-muted-foreground text-xs">•</span>
          <p className="text-xs text-muted-foreground">{trip.passenger_name || "—"}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{trip.pickup_location}</span>
          <span className="mx-1">→</span>
          <span className="truncate">{trip.dropoff_location}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap">
        {trip.distance_km && (
          <span className="text-xs text-muted-foreground">{trip.distance_km} km</span>
        )}
        {trip.duration_min && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {trip.duration_min} min
          </div>
        )}
        {trip.fare && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            <DollarSign className="w-3 h-3" />
            {trip.fare.toFixed(2)}
          </div>
        )}
        <Badge variant="outline" className={cn(statusStyles[trip.status] || "")}>
          {trip.status?.replace("_", " ")}
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      {/* Date */}
      {trip.trip_date && (
        <p className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
          {format(new Date(trip.trip_date), "MMM d, HH:mm")}
        </p>
      )}
    </motion.div>
  );
}