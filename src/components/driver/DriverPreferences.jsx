import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, BellOff, Volume2, VolumeX, 
  MapPin, Zap, Clock, Star, MessageSquare, Phone
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function DriverPreferences({ driver }) {
  const [prefs, setPrefs] = useState({
    soundAlerts: true,
    autoAccept: false,
    longTripsOnly: false,
    notifications: true,
    showEarningsToPassenger: false,
    preferHighRated: true,
  });

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const prefRows = [
    {
      key: "notifications",
      icon: prefs.notifications ? Bell : BellOff,
      label: "Push Notifications",
      desc: "Alerts for new trip requests",
      color: "text-blue-500",
    },
    {
      key: "soundAlerts",
      icon: prefs.soundAlerts ? Volume2 : VolumeX,
      label: "Sound Alerts",
      desc: "Audio ping for incoming trips",
      color: "text-purple-500",
    },
    {
      key: "autoAccept",
      icon: Zap,
      label: "Auto-Accept Trips",
      desc: "Automatically accept nearby requests",
      color: "text-yellow-500",
    },
    {
      key: "longTripsOnly",
      icon: MapPin,
      label: "Long Trips Only",
      desc: "Only show trips over 10 km",
      color: "text-green-500",
    },
    {
      key: "preferHighRated",
      icon: Star,
      label: "Prefer High-Rated Riders",
      desc: "Prioritise riders rated 4.5+",
      color: "text-orange-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">Driver Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 pt-0">
        {prefRows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${row.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[row.key]}
                  onCheckedChange={() => {
                    toggle(row.key);
                    toast.success(`${row.label} ${!prefs[row.key] ? "enabled" : "disabled"}`);
                  }}
                />
              </div>
              {i < prefRows.length - 1 && <Separator />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}