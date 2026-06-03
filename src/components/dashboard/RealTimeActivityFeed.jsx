import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Bell, Car, MapPin, CheckCircle, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const activityIcons = {
  trip_created: MapPin,
  trip_completed: CheckCircle,
  trip_cancelled: XCircle,
  driver_active: Car,
  driver_offline: Clock,
};

const activityColors = {
  trip_created: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  trip_completed: "bg-green-500/20 text-green-600 border-green-500/30",
  trip_cancelled: "bg-red-500/20 text-red-600 border-red-500/30",
  driver_active: "bg-accent/10 text-accent border-accent/20",
  driver_offline: "bg-muted text-muted-foreground border-border",
};

export default function RealTimeActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Subscribe to trip changes
    const unsubscribeTrips = base44.entities.Ride.subscribe((event) => {
      const activity = {
        id: `${event.type}-${event.data.id}-${Date.now()}`,
        type: `trip_${event.type}`,
        title: event.type === "create" ? "New Trip Created" : `Trip ${event.type}`,
        description: event.data.driver_name || "Unknown Driver",
        timestamp: new Date(),
        data: event.data,
      };

      setActivities(prev => [activity, ...prev].slice(0, 20));
    });

    // Subscribe to driver changes
    const unsubscribeDrivers = base44.entities.DriverProfile.subscribe((event) => {
      if (event.type === "update" && event.changed_fields?.includes("status")) {
        const activity = {
          id: `driver-${event.data.id}-${Date.now()}`,
          type: `driver_${event.data.status}`,
          title: `Driver ${event.data.status === "active" ? "Online" : "Offline"}`,
          description: event.data.full_name,
          timestamp: new Date(),
          data: event.data,
        };

        setActivities(prev => [activity, ...prev].slice(0, 20));
      }
    });

    return () => {
      unsubscribeTrips();
      unsubscribeDrivers();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Live Activity
        </h2>
        {activities.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {activities.length} recent
          </Badge>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No recent activity</p>
          <p className="text-xs mt-1">Activity will appear here in real-time</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || Bell;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      activityColors[activity.type]
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}