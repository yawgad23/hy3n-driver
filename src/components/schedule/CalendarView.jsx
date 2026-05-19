import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ schedules, onDateClick, onScheduleClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-semibold text-xl">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const daySchedules = getSchedulesForDate(day.date);
          const hasSchedules = daySchedules.length > 0;
          
          return (
            <button
              key={index}
              onClick={() => onDateClick?.(day.date)}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border transition-all hover:border-primary/50 hover:bg-primary/5 text-left",
                !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isToday(day.date) && "border-primary bg-primary/10",
                hasSchedules && "border-primary/30"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday(day.date) ? "text-primary font-bold" : ""
              )}>
                {day.date.getDate()}
              </div>
              
              {hasSchedules && (
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map((schedule, idx) => (
                    <div
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick?.(schedule);
                      }}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors",
                        schedule.status === "confirmed" && "bg-green-500/20 text-green-600",
                        schedule.status === "scheduled" && "bg-blue-500/20 text-blue-600",
                        schedule.status === "cancelled" && "bg-red-500/20 text-red-600",
                        schedule.status === "in_progress" && "bg-orange-500/20 text-orange-600",
                        schedule.status === "completed" && "bg-gray-500/20 text-gray-600"
                      )}
                    >
                      {new Date(schedule.scheduled_date).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })} - {schedule.driver_name}
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="text-[9px] text-muted-foreground pl-1">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}