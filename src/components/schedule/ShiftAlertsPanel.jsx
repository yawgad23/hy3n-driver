import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import OffScheduleAlert from "./OffScheduleAlert";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ShiftAlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to driver status changes
    const unsubscribe = base44.entities.Driver.subscribe(async (event) => {
      if (event.type === "update" && event.changed_fields?.includes("status")) {
        await checkOffScheduleActivity(event.data);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchAlerts = async () => {
    try {
      // In production, you'd query an Alert entity
      // For now, we'll check active drivers against shifts
      const drivers = await base44.entities.Driver.filter({ status: "active" });
      const activeAlerts = [];

      for (const driver of drivers) {
        await checkOffScheduleActivity(driver, true);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkOffScheduleActivity = async (driver, silent = false) => {
    if (driver.status !== "active") return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const shifts = await base44.entities.Shift.filter({
        driver_id: driver.id,
        shift_date: today,
      });

      const currentShift = shifts.find(s => {
        const now = new Date();
        const [startHour, startMin] = s.start_time.split(":").map(Number);
        const [endHour, endMin] = s.end_time.split(":").map(Number);
        
        const shiftStart = new Date(`${s.shift_date}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`);
        const shiftEnd = new Date(`${s.shift_date}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`);
        
        return now >= shiftStart && now <= shiftEnd;
      });

      if (!currentShift && shifts.length > 0) {
        // Driver is active outside scheduled hours
        const scheduledShift = shifts[0];
        const alert = {
          id: `alert-${driver.id}-${Date.now()}`,
          driver_id: driver.id,
          driver_name: driver.full_name,
          shift_id: scheduledShift.id,
          scheduled_start: scheduledShift.start_time,
          scheduled_end: scheduledShift.end_time,
          detected_at: new Date().toISOString(),
        };

        setAlerts(prev => {
          const exists = prev.find(a => a.driver_id === driver.id);
          if (exists) return prev;
          return [alert, ...prev];
        });

        if (!silent) {
          toast.error(`${driver.full_name} is active outside scheduled hours`);
        }
      }
    } catch (error) {
      console.error("Failed to check off-schedule activity:", error);
    }
  };

  const handleClockIn = async (shiftId) => {
    try {
      await base44.entities.Shift.update(shiftId, {
        status: "active",
        actual_start_time: new Date().toISOString(),
      });
      
      setAlerts(prev => prev.filter(a => a.shift_id !== shiftId));
      toast.success("Driver clocked in successfully");
    } catch (error) {
      toast.error("Failed to clock in driver");
    }
  };

  const handleDismiss = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No off-schedule alerts</p>
        <p className="text-xs mt-1">All active drivers are within their scheduled shifts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          Off-Schedule Alerts
        </h3>
        <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
          {alerts.length} active
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <OffScheduleAlert
                  alert={alert}
                  onDismiss={handleDismiss}
                  onClockIn={handleClockIn}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}