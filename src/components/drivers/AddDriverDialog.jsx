import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  license_number: "",
  vehicle_model: "",
  vehicle_plate: "",
  status: "active",
  latitude: "",
  longitude: "",
};

// Default NYC coordinates with slight variations
const getRandomCoords = () => {
  const baseLat = 40.7128;
  const baseLng = -74.0060;
  return {
    latitude: (baseLat + (Math.random() - 0.5) * 0.1).toFixed(6),
    longitude: (baseLng + (Math.random() - 0.5) * 0.1).toFixed(6),
  };
};

export default function AddDriverDialog({ onDriverAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRandomizeLocation = () => {
    const coords = getRandomCoords();
    setForm(prev => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const coords = form.latitude && form.longitude ? {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        last_location_update: new Date().toISOString(),
      } : getRandomCoords();

      // Optimistic update - close dialog immediately
      setOpen(false);
      setForm(initialForm);
      
      // Create in background
      const newDriver = await base44.entities.Driver.create({
        ...form,
        ...coords,
        latitude: undefined,
        longitude: undefined,
      });
      
      // Navigate to new driver details
      navigate(`/drivers/${newDriver.id}`);
      onDriverAdded?.();
      toast.success("Driver added successfully");
    } catch (error) {
      toast.error("Failed to add driver");
      setOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add New Driver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="license_number">License #</Label>
              <Input id="license_number" value={form.license_number} onChange={(e) => handleChange("license_number", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehicle_model">Vehicle Model</Label>
              <Input id="vehicle_model" value={form.vehicle_model} onChange={(e) => handleChange("vehicle_model", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="vehicle_plate">License Plate</Label>
              <Input id="vehicle_plate" value={form.vehicle_plate} onChange={(e) => handleChange("vehicle_plate", e.target.value)} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Location (for map)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleRandomizeLocation} className="h-7 text-xs gap-1">
                  <MapPin className="w-3 h-3" />
                  Randomize
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Latitude" 
                  type="number" 
                  step="0.000001"
                  value={form.latitude} 
                  onChange={(e) => handleChange("latitude", e.target.value)} 
                />
                <Input 
                  placeholder="Longitude" 
                  type="number" 
                  step="0.000001"
                  value={form.longitude} 
                  onChange={(e) => handleChange("longitude", e.target.value)} 
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Leave empty for auto-assignment</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.full_name || !form.phone}>
              {saving ? "Saving..." : "Add Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}