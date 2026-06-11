import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Wifi, WifiOff, Bell, ChevronRight, Zap, Bike, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { firebaseClient } from "@/api/firebaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SERVICE_TYPE_CONFIG = {
  car: { label: "Car", icon: Car, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  okada: { label: "Okada", icon: Bike, color: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  delivery: { label: "Delivery", icon: Package, color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
};

export default function DriverStatusBar({ driver, isOnline, onToggle, tripRequests = [] }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status) => {
      if (!driver) return;
      await firebaseClient.entities.DriverProfile.update(driver.id, { is_online: status === "active" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["driver-profile"] }),
  });

  const handleToggle = (val) => {
    onToggle(val);
    updateStatus.mutate(val ? "active" : "offline");
    // Also update location if going online
    if (val && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        firebaseClient.entities.DriverProfile.update(driver.id, {
          current_lat: pos.coords.latitude,
          current_lng: pos.coords.longitude,
        }).catch(() => {});
      });
    }
  };

  const hour = new Date().getHours();
  const isSurge = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 20;

  return (
    <div className={cn(
      "rounded-2xl p-4 border-2 transition-all duration-500",
      isOnline
        ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
        : "bg-card border-border"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
            isOnline ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-muted"
          )}>
            {isOnline
              ? <Wifi className="w-6 h-6 text-white" />
              : <WifiOff className="w-6 h-6 text-muted-foreground" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-heading font-bold text-base">
                {isOnline ? "You're Online" : "You're Offline"}
              </p>
              {driver?.service_type && SERVICE_TYPE_CONFIG[driver.service_type] && (() => {
                const cfg = SERVICE_TYPE_CONFIG[driver.service_type];
                const Icon = cfg.icon;
                let label = cfg.label;
                
                // For car drivers, show the specific tier if available
                if (driver.service_type === 'car' && driver.ride_categories?.length > 0) {
                  if (driver.ride_categories.includes("kantanka")) {
                    label = "Kantanka + Comfort";
                  } else {
                    const tier = driver.ride_categories[0];
                    label = tier.charAt(0).toUpperCase() + tier.slice(1);
                  }
                }
                
                return (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOnline
                ? tripRequests.length > 0
                  ? `${tripRequests.length} new request${tripRequests.length > 1 ? "s" : ""}`
                  : "Waiting for trips..."
                : "Go online to start earning"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSurge && isOnline && (
            <Badge className="bg-orange-500 text-white text-xs animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              Surge
            </Badge>
          )}
          <Switch
            checked={isOnline}
            onCheckedChange={handleToggle}
            className={isOnline ? "data-[state=checked]:bg-green-500" : ""}
          />
        </div>
      </div>

      {isOnline && isSurge && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-green-500/20"
        >
          <div className="flex items-center gap-2 text-orange-500 text-xs font-medium">
            <Zap className="w-3 h-3" />
            <span>Surge pricing active in your area — earn 1.5× more per trip!</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}