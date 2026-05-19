import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import StatsCard from "../components/dashboard/StatsCard";
import RecentTrips from "../components/dashboard/RecentTrips";
import ActiveDrivers from "../components/dashboard/ActiveDrivers";

export default function Dashboard() {
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

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Recent Trips</h2>
          <RecentTrips trips={trips} isLoading={tripsLoading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="font-heading font-semibold text-base mb-4">Active Drivers</h2>
          <ActiveDrivers drivers={drivers} isLoading={driversLoading} />
        </motion.div>
      </div>
    </div>
  );
}