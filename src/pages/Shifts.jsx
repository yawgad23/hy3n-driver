import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import StatsCard from "../components/dashboard/StatsCard";
import DriverShiftCard from "../components/schedule/DriverShiftCard";
import ShiftAlertsPanel from "../components/schedule/ShiftAlertsPanel";

export default function Shifts() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => base44.entities.Shift.list("-shift_date"),
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.Driver.list(),
  });

  // Get week range
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter shifts for selected date
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const daysShifts = shifts.filter(s => s.shift_date === selectedDateStr);

  // Calculate stats
  const totalShifts = shifts.length;
  const activeShifts = shifts.filter(s => s.status === "active").length;
  const completedShifts = shifts.filter(s => s.status === "completed").length;
  const driversWithShifts = new Set(shifts.map(s => s.driver_id)).size;

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-600 border-green-500/30";
      case "completed": return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "cancelled": return "bg-red-500/20 text-red-600 border-red-500/30";
      default: return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Shift Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule and monitor driver shifts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {activeShifts} active
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {driversWithShifts} drivers scheduled
          </Badge>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Shifts" value={totalShifts} icon={CalendarIcon} delay={0} />
        <StatsCard title="Active Now" value={activeShifts} icon={Clock} accent delay={0.1} />
        <StatsCard title="Completed" value={completedShifts} icon={Users} delay={0.2} />
        <StatsCard title="Drivers" value={driversWithShifts} icon={AlertTriangle} delay={0.3} />
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar & Shifts List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Week Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                  Previous Week
                </Button>
                <h3 className="font-heading font-semibold">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </h3>
                <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                  Next Week
                </Button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayShifts = shifts.filter(s => s.shift_date === format(day, "yyyy-MM-dd"));
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/30",
                        isCurrentDay && "ring-2 ring-primary ring-offset-2"
                      )}
                    >
                      <p className="text-xs text-muted-foreground">
                        {format(day, "EEE")}
                      </p>
                      <p className={cn(
                        "text-lg font-bold mt-1",
                        isSelected ? "text-primary" : ""
                      )}>
                        {format(day, "d")}
                      </p>
                      {dayShifts.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {dayShifts.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                          {dayShifts.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{dayShifts.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Day's Shifts */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">
                  Shifts for {format(selectedDate, "EEEE, MMM d")}
                </h3>
                <Badge variant="outline">{daysShifts.length} shifts</Badge>
              </div>

              {daysShifts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No shifts scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {daysShifts.map((shift) => (
                    <div key={shift.id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{shift.driver_name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {shift.start_time} - {shift.end_time}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(getStatusColor(shift.status))}>
                          {shift.status}
                        </Badge>
                      </div>
                      {shift.notes && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                          {shift.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Alerts Panel */}
          <Card>
            <CardContent className="p-4">
              <ShiftAlertsPanel />
            </CardContent>
          </Card>

          {/* Driver Shift Cards */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-heading font-semibold text-sm mb-4">Driver Shifts</h3>
              <div className="space-y-4">
                {drivers.slice(0, 5).map((driver) => {
                  const driverShifts = shifts.filter(s => s.driver_id === driver.id);
                  return (
                    <DriverShiftCard
                      key={driver.id}
                      driver={driver}
                      shifts={driverShifts}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}