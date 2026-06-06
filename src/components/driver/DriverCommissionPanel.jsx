import { useQuery } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Copy, CheckCircle, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";

const MOMO_NUMBER = "0546728330";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  paid: { label: "Paid ✓", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle },
  overdue: { label: "Overdue!", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  disputed: { label: "Disputed", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: AlertTriangle },
};

export default function DriverCommissionPanel({ driver }) {
  const { data: records = [] } = useQuery({
    queryKey: ["driver-commission", driver?.full_name],
    queryFn: () => firebaseClient.entities.CommissionRecord.filter({ driver_name: driver?.full_name }, "-created_date", 10),
    enabled: !!driver?.full_name,
  });

  const pending = records.filter(r => r.status === "pending" || r.status === "overdue");
  const totalOwed = pending.reduce((s, r) => s + (r.commission_amount || 0), 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(MOMO_NUMBER);
    toast.success("MoMo number copied!");
  };

  const handleCall = () => {
    window.location.href = `tel:${MOMO_NUMBER}`;
  };

  if (records.length === 0) return null;

  return (
    <Card className={totalOwed > 0 ? "border-yellow-500/30 bg-yellow-500/5" : "border-green-500/20 bg-green-500/5"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Commission Due
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalOwed > 0 && (
          <div className="rounded-xl bg-card border border-yellow-500/20 p-4">
            <p className="text-xs text-muted-foreground mb-1">Amount Owed to HY3N</p>
            <p className="text-3xl font-heading font-bold text-yellow-400">₵{totalOwed.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pending.length} week(s) outstanding</p>
          </div>
        )}

        {/* MoMo payment instructions */}
        <div className="rounded-xl bg-card border border-primary/20 p-4 space-y-3">
          <p className="text-sm font-semibold">Pay via MTN MoMo</p>
          <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Send to</p>
              <p className="font-heading font-bold text-lg text-primary">{MOMO_NUMBER}</p>
              <p className="text-xs text-muted-foreground">Name: HY3N</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleCall}>
                <Phone className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">After sending, your admin will confirm receipt and update your status.</p>
        </div>

        {/* Weekly breakdown */}
        <div className="space-y-2">
          {records.slice(0, 4).map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                <div>
                  <p className="text-xs font-medium">{r.week_label}</p>
                  <p className="text-xs text-muted-foreground">{r.trip_count} trips · ₵{(r.total_fare || 0).toFixed(2)} total fare</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-primary">₵{(r.commission_amount || 0).toFixed(2)}</p>
                  <Badge className={`${cfg.color} text-[10px] gap-1`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}