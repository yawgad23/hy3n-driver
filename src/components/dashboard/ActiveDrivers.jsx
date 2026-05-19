import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  active: "bg-accent/10 text-accent border-accent/20",
  on_trip: "bg-primary/10 text-primary border-primary/20",
  offline: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ActiveDrivers({ drivers, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const activeDrivers = drivers?.filter(d => d.status === "active" || d.status === "on_trip") || [];

  if (!activeDrivers.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <User className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No active drivers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeDrivers.slice(0, 5).map((driver, index) => (
        <motion.div
          key={driver.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {driver.avatar_url ? (
              <img src={driver.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{driver.full_name}</p>
            <p className="text-xs text-muted-foreground">{driver.vehicle_model || "—"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {driver.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-chart-4 fill-chart-4" />
                {driver.rating.toFixed(1)}
              </div>
            )}
            <Badge variant="outline" className={statusStyles[driver.status] || ""}>
              {driver.status === "on_trip" ? "on trip" : driver.status}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
}