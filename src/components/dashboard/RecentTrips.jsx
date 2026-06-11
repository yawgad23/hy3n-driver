import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  completed: "bg-accent/10 text-accent border-accent/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function RecentTrips({ trips, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!trips?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No trips yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trips.slice(0, 5).map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{trip.passenger_name || "Passenger"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {trip.pickup_address || trip.pickup_location || 'Pickup'} → {trip.destination_address || trip.dropoff_location || 'Destination'}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <Badge variant="outline" className={statusStyles[trip.status] || ""}>
              {trip.status?.replace("_", " ")}
            </Badge>
            {(trip.fare || trip.fare_estimate) && (
              <p className="text-xs font-semibold text-accent">
                GH₵{Math.round(trip.fare || trip.fare_estimate)}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}