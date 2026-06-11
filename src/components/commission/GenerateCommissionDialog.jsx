import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Car, Bike, Package } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, subDays } from "date-fns";

// Flat daily commission rates
const DAILY_FEE_CAR = 50;
const DAILY_FEE_OKADA_DELIVERY = 30;

function getDailyFee(driver) {
  const type = driver?.service_type || "car";
  return (type === "okada" || type === "delivery") ? DAILY_FEE_OKADA_DELIVERY : DAILY_FEE_CAR;
}

export default function GenerateCommissionDialog({ open, onOpenChange }) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-for-commission"],
    queryFn: () => firebaseClient.entities.DriverProfile.filter({ status: "active" }),
    enabled: open,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips-for-commission"],
    queryFn: () => firebaseClient.entities.Ride.filter({ status: "completed" }),
    enabled: open,
  });

  const handleGenerate = async (daysAgo = 0) => {
    setGenerating(true);
    const dayStart = startOfDay(subDays(new Date(), daysAgo));
    const dayEnd = endOfDay(subDays(new Date(), daysAgo));
    const dayLabel = daysAgo === 0
      ? `Today — ${format(dayStart, "MMM d, yyyy")}`
      : `${format(dayStart, "MMM d, yyyy")}`;

    // Find trips completed on that day
    const dayTrips = trips.filter(t => {
      const d = new Date(t.trip_date || t.created_date);
      return d >= dayStart && d <= dayEnd;
    });

    // Group by driver
    const byDriver = {};
    dayTrips.forEach(t => {
      const key = t.driver_name || t.driver_id;
      if (!key) return;
      if (!byDriver[key]) byDriver[key] = { trips: [], driver_name: t.driver_name, driver_id: t.driver_id };
      byDriver[key].trips.push(t);
    });

    // Also include active drivers who were online that day (even with 0 trips)
    drivers.forEach(dr => {
      const key = dr.full_name;
      if (!byDriver[key]) {
        byDriver[key] = { trips: [], driver_name: dr.full_name, driver_id: dr.user_id || dr.id };
      }
    });

    const records = Object.values(byDriver).map(d => {
      const driverObj = drivers.find(dr => dr.full_name === d.driver_name || dr.user_id === d.driver_id || dr.id === d.driver_id);
      const dailyFee = getDailyFee(driverObj);
      const totalFare = d.trips.reduce((s, t) => s + (t.fare || 0), 0);
      return {
        driver_name: d.driver_name || "Unknown",
        driver_phone: driverObj?.phone || "",
        driver_id: driverObj?.id || d.driver_id || "",
        service_type: driverObj?.service_type || "car",
        day_label: dayLabel,
        week_label: dayLabel, // kept for backward compat
        week_start: format(dayStart, "yyyy-MM-dd"),
        week_end: format(dayEnd, "yyyy-MM-dd"),
        total_fare: totalFare,
        commission_rate: 0, // flat fee, not percentage
        commission_amount: dailyFee,
        driver_earnings: totalFare, // driver keeps all fares
        trip_count: d.trips.length,
        fee_type: "daily_flat",
        status: "pending",
      };
    });

    if (records.length === 0) {
      toast.warning("No active drivers found for that day.");
      setGenerating(false);
      return;
    }

    await firebaseClient.entities.CommissionRecord.bulkCreate(records);
    toast.success(`Generated ${records.length} daily fee records for ${dayLabel}`);
    queryClient.invalidateQueries({ queryKey: ["commission-records"] });
    setGenerating(false);
    onOpenChange(false);
  };

  const carCount = drivers.filter(d => d.service_type === "car" || !d.service_type).length;
  const okadaCount = drivers.filter(d => d.service_type === "okada" || d.service_type === "delivery").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Daily Fee Records</DialogTitle>
        </DialogHeader>

        {/* Fee summary */}
        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Daily Fee Rates</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" />
              <span>Car drivers ({carCount} active)</span>
            </div>
            <span className="font-heading font-bold text-primary">₵{DAILY_FEE_CAR}/day</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-orange-500" />
              <span>Okada / Delivery ({okadaCount} active)</span>
            </div>
            <span className="font-heading font-bold text-primary">₵{DAILY_FEE_OKADA_DELIVERY}/day</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This creates one fee record per active driver. Drivers keep 100% of their trip fares.
        </p>

        <div className="space-y-3 pt-2">
          <Button className="w-full" onClick={() => handleGenerate(0)} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Today
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleGenerate(1)} disabled={generating}>
            Yesterday
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleGenerate(2)} disabled={generating}>
            2 Days Ago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
