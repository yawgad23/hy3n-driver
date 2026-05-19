import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Phone, Car, MapPin, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import DriverQuickActions from "./DriverQuickActions";

const statusStyles = {
  active: "bg-accent/10 text-accent border-accent/20",
  on_trip: "bg-primary/10 text-primary border-primary/20",
  offline: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function DriverCard({ driver, index = 0 }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card 
        className="p-5 hover:shadow-lg transition-all duration-300 group border-border/50 hover:border-primary/20 cursor-pointer"
        onClick={() => navigate(`/drivers/${driver.id}`)}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {driver.avatar_url ? (
              <img src={driver.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading font-semibold text-base truncate">{driver.full_name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  {driver.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-chart-4 fill-chart-4" />
                      <span className="text-xs font-medium">{driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {driver.total_trips || 0} trips
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("shrink-0", statusStyles[driver.status] || "")}>
                  {driver.status === "on_trip" ? "on trip" : driver.status}
                </Badge>
                <DriverQuickActions driver={driver} />
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {driver.vehicle_model && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Car className="w-3 h-3" />
                  <span>{driver.vehicle_model}</span>
                </div>
              )}
              {driver.vehicle_plate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="font-mono">{driver.vehicle_plate}</span>
                </div>
              )}
              {driver.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{driver.phone}</span>
                </div>
              )}
            </div>

            {/* Earnings */}
            {driver.total_earnings > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Total earnings:{" "}
                  <span className="font-semibold text-foreground">
                    ${driver.total_earnings.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </Card>
    </motion.div>
  );
}