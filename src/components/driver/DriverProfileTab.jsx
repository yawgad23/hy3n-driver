import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  User, Car, Phone, Mail, Star, Shield, Award, ChevronRight,
  Edit, CameraIcon, AlertCircle, CheckCircle2, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

function InfoRow({ icon: Icon, label, value, className }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className={cn("w-4 h-4", className || "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "text-orange-700", bg: "bg-orange-100", min: 0 },
  silver: { label: "Silver", color: "text-slate-600", bg: "bg-slate-200", min: 50 },
  gold: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-100", min: 150 },
  platinum: { label: "Platinum", color: "text-blue-600", bg: "bg-blue-100", min: 300 },
};

function getDriverTier(totalTrips = 0) {
  if (totalTrips >= 300) return TIER_CONFIG.platinum;
  if (totalTrips >= 150) return TIER_CONFIG.gold;
  if (totalTrips >= 50) return TIER_CONFIG.silver;
  return TIER_CONFIG.bronze;
}

export default function DriverProfileTab({ driver }) {
  const tier = getDriverTier(driver?.total_trips);
  const safetyScore = driver?.safety_metrics?.overall_safety_score || 98;

  return (
    <div className="space-y-4">
      {/* Profile Hero */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-accent/20" />
        <CardContent className="p-4 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border-4 border-background flex items-center justify-center shadow-lg">
              {driver?.avatar_url
                ? <img src={driver.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                : <User className="w-8 h-8 text-primary" />
              }
            </div>
            <div className="flex-1 pb-1">
              <h2 className="font-heading font-bold text-lg leading-tight">{driver?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs px-2", tier.bg, tier.color)}>
                  <Award className="w-3 h-3 mr-1" />
                  {tier.label} Driver
                </Badge>
              </div>
            </div>
          </div>

          {/* Rating + Safety row */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-yellow-500">
                {driver?.rating?.toFixed(1) || "5.0"}
              </p>
              <p className="text-[10px] text-muted-foreground">⭐ Rating</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg">{driver?.total_trips || 0}</p>
              <p className="text-[10px] text-muted-foreground">🚗 Trips</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-lg text-green-500">{safetyScore}%</p>
              <p className="text-[10px] text-muted-foreground">🛡 Safety</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm">Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0">
          {[
            { label: "Identity Verified", done: true },
            { label: "License Verified", done: !!driver?.license_number },
            { label: "Vehicle Inspected", done: !!driver?.vehicle_model },
            { label: "Background Check", done: true },
            { label: "Phone Verified", done: !!driver?.phone },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{item.label}</span>
              {item.done
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <AlertCircle className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Vehicle & Contact Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm">Driver Info</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 divide-y divide-border">
          <InfoRow icon={Phone} label="Phone" value={driver?.phone} color="text-green-500" />
          <InfoRow icon={Mail} label="Email" value={driver?.email} color="text-blue-500" />
          <InfoRow icon={Car} label="Vehicle" value={driver?.vehicle_model} color="text-primary" />
          <InfoRow icon={Shield} label="License Plate" value={driver?.vehicle_plate} color="text-accent" />
          <InfoRow icon={Award} label="License Number" value={driver?.license_number} color="text-purple-500" />
        </CardContent>
      </Card>
    </div>
  );
}