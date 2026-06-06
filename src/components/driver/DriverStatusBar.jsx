import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Wifi, WifiOff, Bell, ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { firebaseClient } from "@/api/firebaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
            <p className="font-heading font-bold text-base">
              {isOnline ? "You're Online" : "You're Offline"}
            </p>
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