import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Car, LogIn, Home, Clock, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import SplashScreen from "@/components/driver/SplashScreen";
import DriverHomeTab from "@/components/driver/DriverHomeTab";
import TripHistoryTab from "@/components/driver/TripHistoryTab";
import DriverProfileTab from "@/components/driver/DriverProfileTab";
import DriverPreferences from "@/components/driver/DriverPreferences";

import { cn } from "@/lib/utils";

const TABS = [
  { key: "home", label: "Home", icon: Home },
  { key: "history", label: "History", icon: Clock },
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
      const user = await base44.auth.me();
      if (!user) return null;
      const profiles = await base44.entities.DriverProfile.filter({ email: user.email });
      return profiles[0] || null;
    },
  });

  const { data: allTrips = [] } = useQuery({
    queryKey: ["driver-rides", driver?.id],
    queryFn: () => base44.entities.Ride.filter({ driver_id: driver?.id }),
    enabled: !!driver?.id,
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

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* App Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold">Hy3N Driver</h1>
          <p className="text-xs text-muted-foreground">
            Welcome, {driver.full_name?.split(" ")[0]} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "text-xs",
            isOnline ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            {isOnline ? "● Online" : "○ Offline"}
          </Badge>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "home" && (
            <DriverHomeTab
              driver={driver}
              isOnline={isOnline}
              onToggleOnline={setIsOnline}
            />
          )}
          {activeTab === "history" && (
            <TripHistoryTab trips={allTrips} />
          )}
          {activeTab === "profile" && (
            <DriverProfileTab driver={driver} />
          )}
          {activeTab === "settings" && (
            <DriverPreferences driver={driver} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 px-2 transition-all",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
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
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      style={{ width: "25%", left: `${TABS.indexOf(tab) * 25}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}