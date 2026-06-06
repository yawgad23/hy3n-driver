import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { firebaseClient } from "@/api/firebaseClient";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ScheduleAssignmentDialog({ open, onOpenChange, selectedDate, onAssignmentCreated }) {
  const [drivers, setDrivers] = useState([]);
  const [driverAvailability, setDriverAvailability] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [form, setForm] = useState({
    driver_id: "",
    driver_name: "",
    title: "",
    description: "",
    scheduled_date: selectedDate || new Date(),
    end_date: null,
    pickup_location: "",
    dropoff_location: "",
    notes: "",
    status: "scheduled",
  });

  useEffect(() => {
    if (open) {
      loadDrivers();
      if (selectedDate) {
        setForm(prev => ({ ...prev, scheduled_date: selectedDate }));
      }
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (form.driver_id && form.scheduled_date) {
      checkDriverAvailability();
    }
  }, [form.driver_id, form.scheduled_date]);

  const loadDrivers = async () => {
    try {
      const driverList = await firebaseClient.entities.DriverProfile.list();
      setDrivers(driverList.filter(d => d.status !== "suspended"));
    } catch (error) {
      console.error("Failed to load drivers:", error);
    }
  };

  const checkDriverAvailability = async () => {
    setCheckingAvailability(true);
    try {
      const scheduledDate = new Date(form.scheduled_date);
      
      // Get all schedules for the selected driver around the chosen date
      const allSchedules = await firebaseClient.entities.Schedule.filter({
        driver_id: form.driver_id,
        status: ["scheduled", "confirmed", "in_progress"]
      });
      
      // Check for conflicts on the same day
      const conflicts = allSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.scheduled_date);
        return scheduleDate.toDateString() === scheduledDate.toDateString();
      });
      
      setDriverAvailability({
        hasConflict: conflicts.length > 0,
        conflictCount: conflicts.length,
        conflicts: conflicts,
      });
    } catch (error) {
      console.error("Failed to check availability:", error);
      setDriverAvailability({ hasConflict: false, conflictCount: 0, conflicts: [] });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleDriverSelect = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    setForm(prev => ({
      ...prev,
      driver_id: driverId,
      driver_name: driver ? driver.full_name : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await firebaseClient.entities.Schedule.create({
        ...form,
        end_date: form.end_date || form.scheduled_date,
      });
      
      toast.success("Assignment created successfully");
      onAssignmentCreated?.();
      onOpenChange(false);
      setForm({
        driver_id: "",
        driver_name: "",
        title: "",
        description: "",
        scheduled_date: new Date(),
        end_date: null,
        pickup_location: "",
        dropoff_location: "",
        notes: "",
        status: "scheduled",
      });
    } catch (error) {
      toast.error("Failed to create assignment");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Assign Driver to Schedule</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="driver">Driver *</Label>
            <Select value={form.driver_id} onValueChange={handleDriverSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name} - {driver.vehicle_model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.driver_id && checkingAvailability && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Checking availability...
            </div>
          )}

          {form.driver_id && !checkingAvailability && driverAvailability.hasConflict && (
            <div className={cn(
              "p-3 rounded-lg border flex items-start gap-3",
              driverAvailability.hasConflict ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20"
            )}>
              {driverAvailability.hasConflict ? (
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  driverAvailability.hasConflict ? "text-amber-600" : "text-green-600"
                )}>
                  {driverAvailability.hasConflict 
                    ? `Driver has ${driverAvailability.conflictCount} existing assignment(s) on this date`
                    : "Driver is available on this date"}
                </p>
                {driverAvailability.conflicts.length > 0 && (
                  <div className="mt-2 text-xs text-amber-700 space-y-1">
                    {driverAvailability.conflicts.map((conflict, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {format(new Date(conflict.scheduled_date), "h:mm a")} - {conflict.title || "Assignment"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="title">Assignment Title *</Label>
            <Input 
              id="title" 
              value={form.title} 
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Airport Transfer, Corporate Event"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_date">Start Date & Time *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.scheduled_date ? (
                      format(new Date(form.scheduled_date), "PPP p")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={new Date(form.scheduled_date)}
                    onSelect={(date) => setForm(prev => ({ ...prev, scheduled_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="end_date">End Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.end_date ? (
                      format(new Date(form.end_date), "PPP p")
                    ) : (
                      <span>Same as start</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.end_date ? new Date(form.end_date) : undefined}
                    onSelect={(date) => setForm(prev => ({ ...prev, end_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickup_location">Pickup Location</Label>
              <Input 
                id="pickup_location" 
                value={form.pickup_location} 
                onChange={(e) => setForm(prev => ({ ...prev, pickup_location: e.target.value }))}
                placeholder="Pickup address"
              />
            </div>
            <div>
              <Label htmlFor="dropoff_location">Dropoff Location</Label>
              <Input 
                id="dropoff_location" 
                value={form.dropoff_location} 
                onChange={(e) => setForm(prev => ({ ...prev, dropoff_location: e.target.value }))}
                placeholder="Dropoff address"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={form.description} 
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Assignment details"
              className="h-20"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea 
              id="notes" 
              value={form.notes} 
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for driver"
              className="h-16"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !form.title || !form.driver_id}
              className={driverAvailability.hasConflict ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {loading ? "Creating..." : driverAvailability.hasConflict ? "Assign Anyway" : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}