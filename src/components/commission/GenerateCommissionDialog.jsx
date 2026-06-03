import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

const COMMISSION_RATE = 0.20;

export default function GenerateCommissionDialog({ open, onOpenChange }) {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-for-commission"],
    queryFn: () => base44.entities.DriverProfile.filter({ status: "active" }),
    enabled: open,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips-for-commission"],
    queryFn: () => base44.entities.Ride.filter({ status: "completed" }),
    enabled: open,
  });

  const handleGenerate = async (weeksAgo = 0) => {
    setGenerating(true);
    const weekStart = startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
    const weekLabel = `Week of ${format(weekStart, "MMM d, yyyy")}`;

    // Group completed trips by driver for that week
    const weekTrips = trips.filter(t => {
      const d = new Date(t.trip_date || t.created_date);
      return d >= weekStart && d <= weekEnd;
    });

    const byDriver = {};
    weekTrips.forEach(t => {
      const key = t.driver_name;
      if (!key) return;
      if (!byDriver[key]) byDriver[key] = { trips: [], driver_name: key };
      byDriver[key].trips.push(t);
    });

    const records = Object.values(byDriver).map(d => {
      const totalFare = d.trips.reduce((s, t) => s + (t.fare || 0), 0);
      const commissionAmount = totalFare * COMMISSION_RATE;
      const driverObj = drivers.find(dr => dr.full_name === d.driver_name);
      return {
        driver_name: d.driver_name,
        driver_phone: driverObj?.phone || "",
        driver_id: driverObj?.id || "",
        week_label: weekLabel,
        week_start: format(weekStart, "yyyy-MM-dd"),
        week_end: format(weekEnd, "yyyy-MM-dd"),
        total_fare: totalFare,
        commission_rate: COMMISSION_RATE,
        commission_amount: commissionAmount,
        driver_earnings: totalFare - commissionAmount,
        trip_count: d.trips.length,
        status: "pending",
      };
    });

    if (records.length === 0) {
      toast.warning("No completed trips found for that week.");
      setGenerating(false);
      return;
    }

    await base44.entities.CommissionRecord.bulkCreate(records);
    toast.success(`Generated ${records.length} commission records for ${weekLabel}`);
    queryClient.invalidateQueries({ queryKey: ["commission-records"] });
    setGenerating(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Commission Records</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will calculate 20% commission for each driver based on their completed trips for the selected week.
        </p>
        <div className="space-y-3 pt-2">
          <Button className="w-full" onClick={() => handleGenerate(0)} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            This Week
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleGenerate(1)} disabled={generating}>
            Last Week
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleGenerate(2)} disabled={generating}>
            2 Weeks Ago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}