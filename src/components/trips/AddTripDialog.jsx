import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const initialForm = {
  driver_name: "",
  passenger_name: "",
  pickup_location: "",
  dropoff_location: "",
  fare: "",
  distance_km: "",
  duration_min: "",
  status: "pending",
  trip_date: new Date().toISOString().slice(0, 16),
};

export default function AddTripDialog({ onTripAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Trip.create({
      ...form,
      fare: form.fare ? Number(form.fare) : undefined,
      distance_km: form.distance_km ? Number(form.distance_km) : undefined,
      duration_min: form.duration_min ? Number(form.duration_min) : undefined,
    });
    setSaving(false);
    setForm(initialForm);
    setOpen(false);
    onTripAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Log Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Log New Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Driver Name *</Label>
              <Input value={form.driver_name} onChange={(e) => handleChange("driver_name", e.target.value)} required />
            </div>
            <div>
              <Label>Passenger</Label>
              <Input value={form.passenger_name} onChange={(e) => handleChange("passenger_name", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Pickup Location *</Label>
              <Input value={form.pickup_location} onChange={(e) => handleChange("pickup_location", e.target.value)} required />
            </div>
            <div className="col-span-2">
              <Label>Dropoff Location *</Label>
              <Input value={form.dropoff_location} onChange={(e) => handleChange("dropoff_location", e.target.value)} required />
            </div>
            <div>
              <Label>Fare ($)</Label>
              <Input type="number" step="0.01" value={form.fare} onChange={(e) => handleChange("fare", e.target.value)} />
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input type="number" step="0.1" value={form.distance_km} onChange={(e) => handleChange("distance_km", e.target.value)} />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" value={form.duration_min} onChange={(e) => handleChange("duration_min", e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.driver_name || !form.pickup_location || !form.dropoff_location}>
              {saving ? "Saving..." : "Log Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}