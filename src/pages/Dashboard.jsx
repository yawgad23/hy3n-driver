import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, DollarSign, TrendingUp, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/dashboard/StatsCard";
import RecentTrips from "../components/dashboard/RecentTrips";
import ActiveDrivers from "../components/dashboard/ActiveDrivers";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.Driver.list("-created_date"),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => base44.entities.Trip.list("-created_date", 20),
  });

  const activeCount = drivers.filter(d => d.status === "active" || d.status === "on_trip").length;
  const totalRevenue = trips.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.fare || 0), 0);
  const completedTrips = trips.filter(t => t.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your fleet operations</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Drivers" value={drivers.length} icon={Users} delay={0} />
        <StatsCard title="Active Now" value={activeCount} icon={TrendingUp} accent delay={0.1} />
        <StatsCard title="Total Trips" value={completedTrips} icon={MapPin} delay={0.2} />
        <StatsCard title="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0.3} />
      </div>

      {/* Map Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-base">Fleet Overview</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/map")} className="gap-2">
            <Navigation className="w-4 h-4" />
            View Map
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Drivers</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-chart-4">{trips.filter(t => t.status === "pending").length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Trips</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{trips.filter(t => t.status === "in_progress").length}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{drivers.filter(d => !d.latitude).length}</p>
            <p className="text-xs text-muted-foreground mt-1">No Location</p>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Recent Trips</h2>
          <RecentTrips trips={trips} isLoading={tripsLoading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Active Drivers</h2>
          <ActiveDrivers drivers={drivers} isLoading={driversLoading} />
        </motion.div>
      </div>
    </div>
  );
}