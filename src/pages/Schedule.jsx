import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, User, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CalendarView from "@/components/schedule/CalendarView";
import ScheduleAssignmentDialog from "@/components/schedule/ScheduleAssignmentDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => base44.entities.Schedule.list("-scheduled_date"),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.DriverProfile.list(),
  });

  const filteredSchedules = filterStatus === "all" 
    ? schedules 
    : schedules.filter(s => s.status === filterStatus);

  const getStatusColor = (status) => {
    const colors = {
      scheduled: "bg-blue-500/20 text-blue-600 border-blue-500/30",
      confirmed: "bg-green-500/20 text-green-600 border-green-500/30",
      in_progress: "bg-orange-500/20 text-orange-600 border-orange-500/30",
      completed: "bg-gray-500/20 text-gray-600 border-gray-500/30",
      cancelled: "bg-red-500/20 text-red-600 border-red-500/30",
    };
    return colors[status] || colors.scheduled;
  };

  const getSchedulesForSelectedDate = () => {
    return filteredSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      return scheduleDate.toDateString() === selectedDate.toDateString();
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleAssignmentCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["schedules"] });
  };

  const updateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      await base44.entities.Schedule.update(scheduleId, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule updated");
    } catch (error) {
      toast.error("Failed to update schedule");
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await base44.entities.Schedule.delete(scheduleId);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setSelectedSchedule(null);
      toast.success("Assignment deleted");
    } catch (error) {
      toast.error("Failed to delete assignment");
    }
  };

  const upcomingSchedules = filteredSchedules
    .filter(s => new Date(s.scheduled_date) > new Date())
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage driver assignments and upcoming trips</p>
          </div>
          <Button onClick={() => setAssignmentDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Assignment
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CalendarView 
                schedules={filteredSchedules}
                onDateClick={handleDateClick}
                onScheduleClick={handleScheduleClick}
              />
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {getSchedulesForSelectedDate().length} assignment(s)
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getSchedulesForSelectedDate().length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No assignments for this date
                    </p>
                  ) : (
                    getSchedulesForSelectedDate().map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => setSelectedSchedule(schedule)}
                        className="p-3 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(schedule.scheduled_date), "h:mm a")}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{schedule.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{schedule.driver_name}</p>
                        {schedule.pickup_location && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {schedule.pickup_location}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4">
            {upcomingSchedules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No upcoming assignments
                </CardContent>
              </Card>
            ) : (
              upcomingSchedules.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedSchedule(schedule)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            schedule.status === "confirmed" ? "bg-green-500/20" : "bg-blue-500/20"
                          )}>
                            <Calendar className={cn(
                              "w-6 h-6",
                              schedule.status === "confirmed" ? "text-green-600" : "text-blue-600"
                            )} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{schedule.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {schedule.driver_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(schedule.scheduled_date), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="flex items-center gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filteredSchedules.length} assignment(s)
            </span>
          </div>
          
          <div className="grid gap-4">
            {filteredSchedules.map((schedule) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedSchedule(schedule)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          getStatusColor(schedule.status).split(" ")[0]
                        )}>
                          <User className={cn(
                            "w-6 h-6",
                            getStatusColor(schedule.status).split(" ")[1]
                          )} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{schedule.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {schedule.driver_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(schedule.scheduled_date), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Details Dialog */}
      <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Assignment Details</DialogTitle>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedSchedule.status)}>
                  {selectedSchedule.status.replace("_", " ")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedSchedule.scheduled_date), "PPP p")}
                </span>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">{selectedSchedule.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{selectedSchedule.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedSchedule.driver_name}</span>
                </div>
                {selectedSchedule.pickup_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedSchedule.pickup_location}</span>
                  </div>
                )}
              </div>
              
              {selectedSchedule.notes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedSchedule.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                {selectedSchedule.status === "scheduled" && (
                  <Button 
                    className="flex-1" 
                    onClick={() => updateScheduleStatus(selectedSchedule.id, "confirmed")}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                )}
                {selectedSchedule.status !== "cancelled" && selectedSchedule.status !== "completed" && (
                  <Button 
                    variant="destructive" 
                    onClick={() => updateScheduleStatus(selectedSchedule.id, "cancelled")}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => deleteSchedule(selectedSchedule.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <ScheduleAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        selectedDate={selectedDate}
        onAssignmentCreated={handleAssignmentCreated}
      />
    </div>
  );
}