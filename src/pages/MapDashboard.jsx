import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, MapPin, Car, Navigation, Radio, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FleetMap from "../components/map/FleetMap";
import DispatchAnalytics from "../components/dispatch/DispatchAnalytics";
import VehicleStatusPanel from "../components/map/VehicleStatusPanel";
import { cn } from "@/lib/utils";
import { useSimulatedDriverTracking } from "@/hooks/useSimulatedDriverTracking";

const statusColors = {
  active: "bg-accent/10 text-accent border-accent/20",
  on_trip: "bg-primary/10 text-primary border-primary/20",
  offline: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-accent/10 text-accent border-accent/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function MapDashboard() {
  const [filter, setFilter] = useState("all");
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(true);

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.Driver.list("-created_date"),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => base44.entities.Trip.list("-created_date"),
  });

  const activeDrivers = drivers.filter(d => d.status === "active" || d.status === "on_trip");
  const pendingTrips = trips.filter(t => t.status === "pending" || t.status === "in_progress");
  const completedTrips = trips.filter(t => t.status === "completed");

  // Enable real-time tracking for all active drivers
  const { positions, movementStatus } = useSimulatedDriverTracking(liveTrackingEnabled ? activeDrivers : []);

  const filteredDrivers = filter === "all" 
    ? drivers 
    : filter === "active" 
      ? activeDrivers 
      : drivers.filter(d => d.status === filter);

  const filteredTrips = filter === "all"
    ? trips
    : filter === "pending"
      ? pendingTrips
      : trips.filter(t => t.status === filter);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Fleet Map</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time fleet operations overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Car className="w-3.5 h-3.5" />
            {activeDrivers.length} active
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            {pendingTrips.length} in progress
          </Badge>
          <Button
            variant={liveTrackingEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setLiveTrackingEnabled(!liveTrackingEnabled)}
            className="gap-1.5"
          >
            <Radio className={`w-3.5 h-3.5 ${liveTrackingEnabled && "animate-pulse"}`} />
            {liveTrackingEnabled ? "Live" : "Paused"}
          </Button>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <FleetMap drivers={filteredDrivers} trips={filteredTrips} />
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid grid-cols-4 lg:inline-flex lg:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.25 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Drivers</p>
              <p className="font-heading font-bold text-lg">{drivers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Now</p>
              <p className="font-heading font-bold text-lg">{activeDrivers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Trips</p>
              <p className="font-heading font-bold text-lg">{pendingTrips.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Navigation className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-heading font-bold text-lg">{completedTrips.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dispatch Analytics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
      >
        <DispatchAnalytics />
      </motion.div>

      {/* Real-time Vehicle Status & Driver List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Vehicle Status Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.35 }}
        >
          <VehicleStatusPanel drivers={activeDrivers} movementStatus={movementStatus} />
        </motion.div>

        {/* Active Drivers List */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-5"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Active Drivers</h2>
          {driversLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : activeDrivers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No active drivers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDrivers.slice(0, 5).map((driver) => (
                <div key={driver.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{driver.full_name}</p>
                    <p className="text-xs text-muted-foreground">{driver.vehicle_model || "—"}</p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0", statusColors[driver.status])}>
                    {driver.status === "on_trip" ? "on trip" : driver.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Trips */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-5"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Active Trips</h2>
          {tripsLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : pendingTrips.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Navigation className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No active trips</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTrips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{trip.driver_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {trip.pickup_location} → {trip.dropoff_location}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0", statusColors[trip.status])}>
                    {trip.status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}