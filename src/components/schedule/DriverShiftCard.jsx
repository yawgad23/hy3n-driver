import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, AlertTriangle, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow } from "date-fns";
import AssignShiftDialog from "./AssignShiftDialog";

export default function DriverShiftCard({ driver, shifts = [] }) {
  const [todayShift, setTodayShift] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todaysShifts = shifts.filter(s => s.shift_date === today);
    setTodayShift(todaysShifts[0] || null);
    
    const upcoming = shifts
      .filter(s => new Date(s.shift_date) > new Date(today))
      .sort((a, b) => new Date(a.shift_date) - new Date(b.shift_date))
      .slice(0, 3);
    setUpcomingShifts(upcoming);
  }, [shifts]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "completed": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "cancelled": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    }
  };

  const isOffSchedule = driver.status === "active" && todayShift && todayShift.status !== "active";

  return (
    <Card className="border-border/50 hover:border-primary/20 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Driver Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{driver.full_name}</h3>
              <p className="text-xs text-muted-foreground">{driver.vehicle_model}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn(driver.status === "active" ? "bg-green-500/20 text-green-600" : "bg-muted")}>
            {driver.status}
          </Badge>
        </div>

        {/* Off-Schedule Alert */}
        {isOffSchedule && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700">Active Outside Scheduled Hours</p>
              <p className="text-xs text-red-600 mt-1">
                Driver is active but not clocked in for today's shift
              </p>
            </div>
          </motion.div>
        )}

        {/* Today's Shift */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Today's Shift
            </h4>
            {todayShift && (
              <AssignShiftDialog driver={driver} />
            )}
          </div>
          
          {todayShift ? (
            <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {todayShift.start_time} - {todayShift.end_time}
                  </span>
                </div>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(todayShift.status))}>
                  {todayShift.status}
                </Badge>
              </div>
              {todayShift.notes && (
                <p className="text-xs text-muted-foreground">{todayShift.notes}</p>
              )}
              {todayShift.actual_start_time && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Clocked in: {format(new Date(todayShift.actual_start_time), "h:mm a")}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">No shift scheduled</p>
              <AssignShiftDialog driver={driver} />
            </div>
          )}
        </div>

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Upcoming
            </h4>
            <div className="space-y-1">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {isTomorrow(new Date(shift.shift_date)) ? "Tomorrow" : format(new Date(shift.shift_date), "MMM d")}
                    </span>
                    <span className="text-muted-foreground">{shift.start_time} - {shift.end_time}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", getStatusColor(shift.status))}>
                    {shift.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}