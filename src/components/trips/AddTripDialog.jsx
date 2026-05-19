import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MapPin, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DriverSuggestions from "./DriverSuggestions";

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
  pickup_lat: "",
  pickup_lng: "",
  dropoff_lat: "",
  dropoff_lng: "",
};

// Default NYC coordinates with slight variations
const getRandomCoords = (offset = 0.05) => {
  const baseLat = 40.7128;
  const baseLng = -74.0060;
  return {
    pickup_lat: (baseLat + (Math.random() - 0.5) * offset).toFixed(6),
    pickup_lng: (baseLng + (Math.random() - 0.5) * offset).toFixed(6),
    dropoff_lat: (baseLat + (Math.random() - 0.5) * offset).toFixed(6),
    dropoff_lng: (baseLng + (Math.random() - 0.5) * offset).toFixed(6),
  };
};

export default function AddTripDialog({ onTripAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRandomizeLocation = () => {
    const coords = getRandomCoords();
    setForm(prev => ({ 
      ...prev, 
      pickup_lat: coords.pickup_lat, 
      pickup_lng: coords.pickup_lng,
      dropoff_lat: coords.dropoff_lat,
      dropoff_lng: coords.dropoff_lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate driver for auto-assign tab
    if (activeTab === "auto" && !selectedDriver) {
      toast.error("Please select a driver from the suggestions");
      return;
    }
    
    setSaving(true);
    try {
      const coords = form.pickup_lat && form.pickup_lng && form.dropoff_lat && form.dropoff_lng ? {
        pickup_lat: Number(form.pickup_lat),
        pickup_lng: Number(form.pickup_lng),
        dropoff_lat: Number(form.dropoff_lat),
        dropoff_lng: Number(form.dropoff_lng),
      } : getRandomCoords();

      // Optimistic update - close dialog immediately
      setOpen(false);
      setForm(initialForm);
      setSelectedDriver(null);
      
      // Create in background
      const newTrip = await base44.entities.Trip.create({
        ...form,
        ...coords,
        driver_name: activeTab === "auto" && selectedDriver ? selectedDriver.full_name : form.driver_name,
        fare: form.fare ? Number(form.fare) : undefined,
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        duration_min: form.duration_min ? Number(form.duration_min) : undefined,
        pickup_lat: undefined,
        pickup_lng: undefined,
        dropoff_lat: undefined,
        dropoff_lng: undefined,
      });
      
      // Navigate to new trip details
      navigate(`/trips/${newTrip.id}`);
      onTripAdded?.();
      toast.success(activeTab === "auto" ? "Trip assigned to nearest driver" : "Trip logged successfully");
    } catch (error) {
      toast.error("Failed to log trip");
      setOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    // Auto-fill driver name if not already set
    if (!form.driver_name) {
      setForm(prev => ({ ...prev, driver_name: driver.full_name }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Log Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Log New Trip</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <MapPin className="w-4 h-4" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="auto" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Auto-Assign Driver
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Route Coordinates (for map)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleRandomizeLocation} className="h-7 text-xs gap-1">
                  <MapPin className="w-3 h-3" />
                  Randomize
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Input 
                  placeholder="Pickup Lat" 
                  type="number" 
                  step="0.000001"
                  value={form.pickup_lat} 
                  onChange={(e) => handleChange("pickup_lat", e.target.value)} 
                />
                <Input 
                  placeholder="Pickup Lng" 
                  type="number" 
                  step="0.000001"
                  value={form.pickup_lng} 
                  onChange={(e) => handleChange("pickup_lng", e.target.value)} 
                />
                <Input 
                  placeholder="Dropoff Lat" 
                  type="number" 
                  step="0.000001"
                  value={form.dropoff_lat} 
                  onChange={(e) => handleChange("dropoff_lat", e.target.value)} 
                />
                <Input 
                  placeholder="Dropoff Lng" 
                  type="number" 
                  step="0.000001"
                  value={form.dropoff_lng} 
                  onChange={(e) => handleChange("dropoff_lng", e.target.value)} 
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Leave empty for auto-assignment</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.driver_name || !form.pickup_location || !form.dropoff_location}>
              {saving ? "Saving..." : "Log Trip"}
            </Button>
          </div>
        </form>
          </TabsContent>
          
          <TabsContent value="auto" className="mt-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Smart Dispatch:</strong> Enter pickup/dropoff locations and coordinates below. 
                  The system will automatically suggest the nearest available drivers based on GPS proximity.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Pickup Location *</Label>
                  <Input value={form.pickup_location} onChange={(e) => handleChange("pickup_location", e.target.value)} placeholder="Enter pickup address" />
                </div>
                <div className="col-span-2">
                  <Label>Dropoff Location *</Label>
                  <Input value={form.dropoff_location} onChange={(e) => handleChange("dropoff_location", e.target.value)} placeholder="Enter dropoff address" />
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Pickup Coordinates (for GPS matching)</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRandomizeLocation} className="h-7 text-xs gap-1">
                    <MapPin className="w-3 h-3" />
                    Randomize
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Input 
                    placeholder="Pickup Lat" 
                    type="number" 
                    step="0.000001"
                    value={form.pickup_lat} 
                    onChange={(e) => handleChange("pickup_lat", e.target.value)} 
                    required={activeTab === "auto"}
                  />
                  <Input 
                    placeholder="Pickup Lng" 
                    type="number" 
                    step="0.000001"
                    value={form.pickup_lng} 
                    onChange={(e) => handleChange("pickup_lng", e.target.value)} 
                    required={activeTab === "auto"}
                  />
                  <Input 
                    placeholder="Dropoff Lat" 
                    type="number" 
                    step="0.000001"
                    value={form.dropoff_lat} 
                    onChange={(e) => handleChange("dropoff_lat", e.target.value)} 
                  />
                  <Input 
                    placeholder="Dropoff Lng" 
                    type="number" 
                    step="0.000001"
                    value={form.dropoff_lng} 
                    onChange={(e) => handleChange("dropoff_lng", e.target.value)} 
                  />
                </div>
              </div>
              
              {form.pickup_lat && form.pickup_lng && (
                <DriverSuggestions 
                  pickupLat={Number(form.pickup_lat)}
                  pickupLng={Number(form.pickup_lng)}
                  onDriverSelect={handleDriverSelect}
                  tripData={form}
                />
              )}
              
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  disabled={saving || !form.pickup_location || !form.dropoff_location || (activeTab === "auto" && !selectedDriver)}
                >
                  {saving ? "Saving..." : selectedDriver ? `Assign to ${selectedDriver.full_name}` : "Select a Driver First"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}