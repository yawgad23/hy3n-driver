import { useState } from "react";
import { firebaseClient } from "@/api/firebaseClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zap, Car, Navigation } from "lucide-react";
import { toast } from "sonner";

export default function QuickDispatchButton({ trip, onDispatchSuccess }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchSuggestions = async () => {
    if (!trip?.pickup_lat || !trip?.pickup_lng) return;

    setLoading(true);
    try {
      const response = await firebaseClient.functions.invoke("suggestNearestDriver", {
        pickup_lat: trip.pickup_lat,
        pickup_lng: trip.pickup_lng,
        trip_id: trip.id,
      });

      if (response.data.suggestions) {
        setSuggestions(response.data.suggestions.slice(0, 3));
      }
    } catch (error) {
      console.error("Failed to fetch driver suggestions:", error);
      toast.error("Could not load driver suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssign = async (driver) => {
    try {
      await firebaseClient.entities.Ride.update(trip.id, {
        driver_id: driver.id,
        driver_name: driver.full_name || "",
        driver_rating: driver.rating || null,
        vehicle_make: driver.vehicle_make || "",
        vehicle_model: driver.vehicle_model || "",
        vehicle_color: driver.vehicle_color || "",
        license_plate: driver.license_plate || "",
        status: "matched",
      });

      toast.success(`Dispatched to ${driver.full_name} (${driver.distance_km} km away)`);
      setOpen(false);
      onDispatchSuccess?.();
    } catch (error) {
      console.error("Failed to assign driver:", error);
      toast.error("Failed to assign driver");
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen && trip?.status === "pending") {
      fetchSuggestions();
    }
  };

  if (trip.status !== "pending") {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          Dispatch
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Finding drivers...
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="px-2 py-1.5 border-b border-border">
              <p className="text-xs font-medium">Quick Assign</p>
            </div>
            {suggestions.map((driver, index) => (
              <DropdownMenuItem
                key={driver.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAssign(driver);
                }}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Car className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{driver.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.distance_km} km • {driver.eta_minutes} min
                    </p>
                  </div>
                </div>
                {index === 0 && (
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                    <Zap className="w-3 h-3" />
                    Best
                  </div>
                )}
              </DropdownMenuItem>
            ))}
            {suggestions.length > 0 && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/trips/${trip.id}`;
                }}
                className="border-t border-border text-xs text-primary"
              >
                <Navigation className="w-3 h-3 mr-1" />
                View all suggestions
              </DropdownMenuItem>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No drivers available</p>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/trips/${trip.id}`;
              }}
              className="mt-2 text-xs text-primary justify-center"
            >
              View trip details
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}