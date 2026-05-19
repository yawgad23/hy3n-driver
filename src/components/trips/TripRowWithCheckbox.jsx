import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Navigation, ChevronRight, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import QuickDispatchButton from "./QuickDispatchButton";

const statusColors = {
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TripRowWithCheckbox({ trip, index = 0, isSelected, onToggleSelect }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className={cn(
          "p-4 hover:shadow-md transition-all duration-200 group border-border/50",
          isSelected && "border-primary bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(trip.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
          
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-primary" />
          </div>

          {/* Trip Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/trips/${trip.id}`)}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm truncate">{trip.driver_name}</h3>
              <Badge variant="outline" className={cn("text-xs", statusColors[trip.status])}>
                {trip.status?.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{trip.pickup_location}</span>
              </div>
              <span className="shrink-0">→</span>
              <div className="flex items-center gap-1 truncate">
                <Navigation className="w-3 h-3 shrink-0" />
                <span className="truncate">{trip.dropoff_location}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              {trip.passenger_name && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{trip.passenger_name}</span>
                </div>
              )}
              {trip.duration_min && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{trip.duration_min} min</span>
                </div>
              )}
              {trip.fare && (
                <span className="font-semibold text-foreground">${trip.fare.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Quick Dispatch Button (only for pending trips) */}
          {trip.status === "pending" && (
            <div onClick={(e) => e.stopPropagation()}>
              <QuickDispatchButton trip={trip} />
            </div>
          )}
          
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </motion.div>
  );
}