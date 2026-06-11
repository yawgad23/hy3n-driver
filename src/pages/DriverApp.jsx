import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Car, LogIn, Home, Clock, User, Settings, XCircle, CheckCircle, AlertCircle, Package, X, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import SplashScreen from "@/components/driver/SplashScreen";
import DriverHomeTab from "@/components/driver/DriverHomeTab";
import TripHistoryTab from "@/components/driver/TripHistoryTab";
import DriverProfileTab from "@/components/driver/DriverProfileTab";
import DriverPreferences from "@/components/driver/DriverPreferences";
import DriverEarningsDashboard from "@/pages/DriverEarningsDashboard";

import { cn } from "@/lib/utils";
import DailyCommissionPayment from "@/components/commission/DailyCommissionPayment";
import { format } from "date-fns";

const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "history", label: "History", icon: Clock },
  { key: "earnings", label: "Earnings", icon: TrendingUp },
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
];

export default function DriverApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [isOnline, setIsOnline] = useState(false);

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: async () => {
      const user = await firebaseClient.auth.me();
      if (!user) return null;
      // Try to find profile by user_id first (self-registered drivers)
      let profiles = await firebaseClient.entities.DriverProfile.filter({ user_id: user.id });
      // Fallback: try by email (admin-created drivers)
      if (profiles.length === 0) {
        profiles = await firebaseClient.entities.DriverProfile.filter({ email: user.email });
      }
      const profile = profiles[0] || null;
      if (!profile) return null;
      // Always ensure user_id is set so ride request queries work
      if (!profile.user_id) {
        profile.user_id = user.id;
        // Persist it back to Firestore so future queries work
        try {
          await firebaseClient.entities.DriverProfile.update(profile.id, { user_id: user.id });
        } catch(e) { console.warn('Could not patch user_id:', e); }
      }
      return profile;
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");

  // Check today's commission payment status
  const { data: todayCommission } = useQuery({
    queryKey: ["daily-commission", driver?.user_id, today],
    queryFn: async () => {
      const records = await firebaseClient.entities.DailyCommission.filter({
        driver_id: driver?.user_id || driver?.id,
        date: today,
      });
      return records[0] || null;
    },
    enabled: !!(driver?.user_id || driver?.id) && driver?.approval_status === "approved",
    refetchInterval: 15000, // Poll every 15s to catch admin confirmation
  });

  const commissionConfirmedToday = todayCommission?.status === "confirmed";

  // Force offline if commission is not paid today
  useEffect(() => {
    if (driver && !commissionConfirmedToday && isOnline) {
      setIsOnline(false);
      firebaseClient.entities.DriverProfile.update(driver.id, { is_online: false }).catch(() => {});
    }
  }, [commissionConfirmedToday, driver, isOnline]);

  // Check for lost item reports for this driver that are unread
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const { data: lostItemAlerts = [] } = useQuery({
    queryKey: ["lost-item-alerts", driver?.user_id, driver?.id],
    queryFn: async () => {
      const driverId = driver?.user_id || driver?.id;
      if (!driverId) return [];
      const reports = await firebaseClient.entities.RideReport.filter({
        driver_id: driverId,
        report_type: "lost_item",
      });
      // Only show open/unresolved ones from last 48 hours
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      return reports.filter(r =>
        r.status === "open" &&
        new Date(r.created_date).getTime() > cutoff
      );
    },
    enabled: !!(driver?.user_id || driver?.id),
    refetchInterval: 30000,
  });

  const visibleAlerts = lostItemAlerts.filter(a => !dismissedAlerts.includes(a.id));

  const { data: allTrips = [] } = useQuery({
    queryKey: ["driver-rides", driver?.id, driver?.user_id],
    queryFn: async () => {
      // Try both driver?.id and driver?.user_id to catch all rides
      const byId = driver?.id ? await firebaseClient.entities.Ride.filter({ driver_id: driver.id }) : [];
      const byUserId = driver?.user_id && driver.user_id !== driver.id
        ? await firebaseClient.entities.Ride.filter({ driver_id: driver.user_id })
        : [];
      // Merge and deduplicate
      const all = [...byId, ...byUserId];
      const seen = new Set();
      return all.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
    },
    enabled: !!driver?.id || !!driver?.user_id,
  });

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show pending approval screen
  if (driver && (driver.approval_status === "pending" || !driver.approval_status)) {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-20 px-4">
        <div className="text-center pt-16">
          <div className="w-24 h-24 rounded-3xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Application Under Review</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Welcome, {driver.full_name?.split(" ")[0]}! Your driver application has been submitted and is currently being reviewed by our admin team.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-600 dark:text-yellow-400">
            <p className="font-medium mb-1">What happens next?</p>
            <p>Our team will verify your documents and vehicle details. You will be notified once your account is approved and you can start accepting rides.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show rejected screen
  if (driver && driver.approval_status === "rejected") {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-20 px-4">
        <div className="text-center pt-16">
          <div className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Application Not Approved</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Unfortunately, your driver application was not approved at this time.
          </p>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
            <p>Please contact our support team for more information or to reapply.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show daily commission payment gate for approved drivers who haven't paid today
  if (driver && driver.approval_status === "approved" && !commissionConfirmedToday) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-base">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, {driver.full_name?.split(" ")[0]}!</p>
            <p className="text-xs text-muted-foreground">Pay today's fee to start receiving rides</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-24">
          <DailyCommissionPayment driver={driver} onClose={null} />
        </div>
        {/* Bottom nav still visible */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-md border-t border-border">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-2 transition-all",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-primary/10" : "")}>
                      <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                    </div>
                    <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-20">
        <div className="text-center pt-10">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Car className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-2">Hy3N Driver</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Your account is not yet linked to a driver profile.
            Register as a driver to get started.
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full h-12" asChild>
            <Link to="/driver-register">
              <Car className="w-5 h-5 mr-2" />
              Register as a Driver
            </Link>
          </Button>
          <Button className="w-full h-12" variant="outline" asChild>
            <Link to="/login">
              <LogIn className="w-5 h-5 mr-2" />
              Sign In with a Different Account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Home tab is full-screen (Uber/Bolt style), others use normal layout
  const isHomeTab = activeTab === "home";

  return (
    <div className={isHomeTab ? "" : "max-w-lg mx-auto pb-24"}>
      {/* Lost Item Alert Banners */}
      {visibleAlerts.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
          <div className="max-w-lg mx-auto px-3 pt-3 space-y-2 pointer-events-auto">
            {visibleAlerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-start gap-3 bg-amber-500 text-black rounded-2xl p-3 shadow-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">🎒 Lost Item Alert</p>
                  <p className="text-xs mt-0.5 line-clamp-2">
                    A rider reported leaving a {alert.category?.replace('lost_', '') || 'item'} in your vehicle. Please check your car.
                  </p>
                  {alert.rider_phone && (
                    <a href={`tel:${alert.rider_phone}`} className="text-xs font-bold underline mt-0.5 block">
                      Call rider: {alert.rider_phone}
                    </a>
                  )}
                  <p className="text-[10px] mt-1 opacity-70">Ref: {alert.ticket_ref}</p>
                </div>
                <button
                  onClick={() => setDismissedAlerts(p => [...p, alert.id])}
                  className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {/* Non-home tabs get a simple header */}
      {!isHomeTab && (
        <div className="flex items-center justify-between mb-5 px-1">
          <div>
            <h1 className="font-heading text-xl font-bold">Hy3N Driver</h1>
            <p className="text-xs text-muted-foreground">
              {driver.full_name?.split(" ")[0]}
            </p>
          </div>
          <Badge className={cn(
            "text-xs",
            isOnline ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {isOnline ? "● Online" : "○ Offline"}
          </Badge>
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "home" && driver && (
            <DriverHomeTab
              driver={driver}
              isOnline={isOnline}
              onToggleOnline={setIsOnline}
              commissionConfirmed={commissionConfirmedToday}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "history" && (
            <TripHistoryTab trips={allTrips} />
          )}
          {activeTab === "earnings" && (
            <div className="px-4 pt-4">
              <DriverEarningsDashboard />
            </div>
          )}
          {activeTab === "profile" && (
            <DriverProfileTab driver={driver} />
          )}
          {activeTab === "settings" && (
            <DriverPreferences driver={driver} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation — always visible, higher z-index than trip sheets */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-md border-t border-border">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-2 transition-all",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    isActive ? "bg-primary/10" : ""
                  )}>
                    <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  </div>
                  <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}