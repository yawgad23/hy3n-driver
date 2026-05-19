import { motion } from "framer-motion";
import { Car, Radio, TrendingUp, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusConfig = {
  moving: {
    label: "Moving",
    color: "bg-accent text-accent-foreground border-accent/30",
    icon: TrendingUp,
    pulse: true,
  },
  stationary: {
    label: "Stationary",
    color: "bg-muted text-muted-foreground border-border",
    icon: Clock,
    pulse: false,
  },
  on_trip: {
    label: "On Trip",
    color: "bg-primary text-primary-foreground border-primary/30",
    icon: Radio,
    pulse: true,
  },
};

export default function VehicleStatusPanel({ drivers, movementStatus }) {
  const driversWithStatus = drivers?.map(driver => ({
    ...driver,
    movementStatus: movementStatus[driver.id] || (driver.status === "on_trip" ? "on_trip" : "stationary"),
  })) || [];

  const movingCount = driversWithStatus.filter(d => d.movementStatus === "moving").length;
  const stationaryCount = driversWithStatus.filter(d => d.movementStatus === "stationary").length;
  const onTripCount = driversWithStatus.filter(d => d.movementStatus === "on_trip").length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="border-border bg-card/50">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold">{movingCount}</p>
            <p className="text-[10px] text-muted-foreground">Moving</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-3 text-center">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{stationaryCount}</p>
            <p className="text-[10px] text-muted-foreground">Stationary</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50">
          <CardContent className="p-3 text-center">
            <Radio className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{onTripCount}</p>
            <p className="text-[10px] text-muted-foreground">On Trip</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicle List */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Live Vehicle Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {driversWithStatus.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No vehicles tracked</p>
              </div>
            ) : (
              driversWithStatus.map((driver) => {
                const config = statusConfig[driver.movementStatus] || statusConfig.stationary;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={driver.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        driver.movementStatus === "moving" && "bg-accent/10",
                        driver.movementStatus === "stationary" && "bg-muted/50",
                        driver.movementStatus === "on_trip" && "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-3.5 h-3.5",
                          driver.movementStatus === "moving" && "text-accent",
                          driver.movementStatus === "stationary" && "text-muted-foreground",
                          driver.movementStatus === "on_trip" && "text-primary"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{driver.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {driver.vehicle_model || "Vehicle"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] shrink-0",
                        config.color,
                        config.pulse && "relative",
                        config.pulse && "after:content-[''] after:absolute after:top-0 after:right-0 after:w-2 after:h-2 after:bg-current after:rounded-full after:animate-ping"
                      )}
                    >
                      {config.label}
                    </Badge>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 px-1">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                key === "moving" && "bg-accent",
                key === "stationary" && "bg-muted-foreground",
                key === "on_trip" && "bg-primary"
              )} />
              <span className="text-[10px] text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}