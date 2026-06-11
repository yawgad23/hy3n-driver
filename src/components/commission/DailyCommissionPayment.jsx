import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Phone, Copy, CheckCircle, Clock, XCircle, AlertTriangle,
  ChevronRight, Car, Bike, Package, RefreshCw
} from "lucide-react";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

const MOMO_NUMBER = "0546728330"; // HY3N MoMo number
const DAILY_FEE_CAR = 50; // Fixed daily fee for cars
const DAILY_FEE_OKADA_DELIVERY = 30; // Fixed daily fee for okada/delivery

function getServiceType(driver) {
  if (driver?.service_type) return driver.service_type.toLowerCase();
  
  // Fallback: Infer from vehicle model or category
  const model = (driver?.vehicle_model || "").toLowerCase();
  const categories = (driver?.ride_categories || []);
  
  if (model.includes("bike") || model.includes("motor") || categories.includes("okada")) return "okada";
  if (model.includes("delivery") || categories.includes("express_delivery")) return "delivery";
  
  return "car";
}

function getDailyFee(driver) {
  const type = getServiceType(driver);
  return (type === "okada" || type === "delivery") ? DAILY_FEE_OKADA_DELIVERY : DAILY_FEE_CAR;
}

function getServiceIcon(driver) {
  const type = getServiceType(driver);
  if (type === "okada") return <Bike className="w-5 h-5" />;
  if (type === "delivery") return <Package className="w-5 h-5" />;
  return <Car className="w-5 h-5" />;
}

export default function DailyCommissionPayment({ driver, onClose }) {
  const [momoRef, setMomoRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const dailyFee = getDailyFee(driver);
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if driver already submitted/paid today
  const { data: todayRecord, isLoading } = useQuery({
    queryKey: ["daily-commission", driver?.user_id, today],
    queryFn: async () => {
      const records = await firebaseClient.entities.DailyCommission.filter({
        driver_id: driver?.user_id || driver?.id,
        date: today,
      });
      return records[0] || null;
    },
    enabled: !!(driver?.user_id || driver?.id),
    refetchInterval: 10000, // Poll every 10s to catch admin confirmation
  });

  const copyMomo = () => {
    navigator.clipboard.writeText(MOMO_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!momoRef.trim()) {
      toast.error("Please enter your MoMo transaction reference");
      return;
    }
    if (momoRef.trim().length < 6) {
      toast.error("Transaction reference seems too short. Please check and re-enter.");
      return;
    }
    setSubmitting(true);
    try {
      await firebaseClient.entities.DailyCommission.create({
        driver_id: driver?.user_id || driver?.id,
        driver_name: driver?.full_name || "Unknown Driver",
        driver_phone: driver?.phone || driver?.phone_number || "",
        service_type: driver?.service_type || "car",
        vehicle_plate: driver?.vehicle_plate || driver?.plate_number || "",
        amount: dailyFee,
        momo_reference: momoRef.trim().toUpperCase(),
        date: today,
        status: "pending", // admin will confirm
        submitted_at: new Date().toISOString(),
      });
      toast.success("Payment submitted! Waiting for admin confirmation.");
      setMomoRef("");
      queryClient.invalidateQueries({ queryKey: ["daily-commission"] });
    } catch (err) {
      toast.error("Failed to submit. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!todayRecord) return;
    // Delete rejected record so driver can resubmit
    try {
      await firebaseClient.entities.DailyCommission.delete(todayRecord.id);
      queryClient.invalidateQueries({ queryKey: ["daily-commission"] });
      toast.info("Ready to resubmit. Enter your new transaction reference.");
    } catch {
      toast.error("Failed to reset. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Already confirmed today
  if (todayRecord?.status === "confirmed") {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <p className="font-heading font-bold text-xl text-green-400">Daily Fee Confirmed!</p>
          <p className="text-muted-foreground text-sm mt-1">
            Your GH₵{dailyFee} daily fee for {format(new Date(), "MMMM d, yyyy")} has been confirmed.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            You are now active and can receive ride requests.
          </p>
        </div>
        <div className="bg-secondary rounded-xl p-3 text-sm">
          <p className="text-muted-foreground">MoMo Ref: <span className="text-foreground font-mono font-bold">{todayRecord.momo_reference}</span></p>
          <p className="text-muted-foreground mt-1">Confirmed at: <span className="text-foreground">{todayRecord.confirmed_at ? format(new Date(todayRecord.confirmed_at), "h:mm a") : "—"}</span></p>
        </div>
        {onClose && (
          <Button onClick={onClose} className="w-full h-12 rounded-2xl">
            Go Online & Start Earning
          </Button>
        )}
      </div>
    );
  }

  // Pending — waiting for admin
  if (todayRecord?.status === "pending") {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
        </div>
        <div>
          <p className="font-heading font-bold text-xl text-yellow-400">Awaiting Confirmation</p>
          <p className="text-muted-foreground text-sm mt-1">
            Your payment submission is being reviewed by the HY3N admin team.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            This usually takes a few minutes. You'll be able to go online once confirmed.
          </p>
        </div>
        <div className="bg-secondary rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-bold text-accent">GH₵{todayRecord.amount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">MoMo Ref</span>
            <span className="font-mono font-bold">{todayRecord.momo_reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted</span>
            <span>{todayRecord.submitted_at ? format(new Date(todayRecord.submitted_at), "h:mm a") : "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />
          <p className="text-xs text-yellow-500">Auto-refreshing every 10 seconds…</p>
        </div>
      </div>
    );
  }

  // Rejected — let driver resubmit
  if (todayRecord?.status === "rejected") {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <p className="font-heading font-bold text-xl text-red-400">Payment Rejected</p>
          <p className="text-muted-foreground text-sm mt-1">
            Your payment reference <span className="font-mono font-bold text-foreground">{todayRecord.momo_reference}</span> could not be verified.
          </p>
          {todayRecord.rejection_reason && (
            <p className="text-red-400 text-sm mt-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              Reason: {todayRecord.rejection_reason}
            </p>
          )}
        </div>
        <Button
          onClick={handleResubmit}
          className="w-full h-12 rounded-2xl bg-primary"
        >
          Submit New Reference
        </Button>
      </div>
    );
  }

  // Not yet submitted — show payment form
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
          {getServiceIcon(driver)}
        </div>
        <p className="font-heading font-bold text-lg">Pay Daily HY3N Fee</p>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Fee amount */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
          Today's Fee — {getServiceType(driver).charAt(0).toUpperCase() + getServiceType(driver).slice(1)}
        </p>
        <p className="text-4xl font-heading font-bold text-primary">GH₵{dailyFee}</p>
        <p className="text-xs text-muted-foreground mt-1">Flat daily fee — you keep 100% of your fares</p>
      </div>

      {/* MoMo payment instructions */}
      <div className="bg-secondary rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 1 — Send MoMo Payment</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">MTN Mobile Money</p>
            <p className="text-xl font-bold font-mono tracking-widest">{MOMO_NUMBER}</p>
          </div>
          <button
            onClick={copyMomo}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 px-3 py-2 rounded-xl transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Send exactly <span className="text-foreground font-bold">GH₵{dailyFee}</span> to the number above. Use your name as the reference.
        </p>
      </div>

      {/* Reference input */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step 2 — Enter Transaction Reference</p>
        <p className="text-xs text-muted-foreground">
          After sending, you'll get a transaction ID (e.g. <span className="font-mono text-foreground">AG12345678</span>). Enter it below.
        </p>
        <input
          type="text"
          value={momoRef}
          onChange={e => setMomoRef(e.target.value.toUpperCase())}
          placeholder="e.g. AG12345678"
          className="w-full bg-secondary border border-border text-foreground rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground placeholder:normal-case"
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-500">
          Make sure the reference is correct. Wrong references will be rejected and you'll need to resubmit.
        </p>
      </div>

      {/* Submit */}
      <Button
        className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/30"
        onClick={handleSubmit}
        disabled={submitting || !momoRef.trim()}
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          <ChevronRight className="w-5 h-5 mr-2" />
        )}
        {submitting ? "Submitting…" : "Submit Payment Reference"}
      </Button>
    </div>
  );
}
