import { useQuery } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { motion } from "framer-motion";
import { TrendingUp, Clock, DollarSign, Star, Car, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PerformanceMetrics() {
  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => firebaseClient.entities.DriverProfile.list(),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: () => firebaseClient.entities.Ride.list(),
  });

  // Calculate metrics
  const completedTrips = trips.filter(t => t.status === "completed");
  const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.fare || 0), 0);
  const avgFare = completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0;
  const avgDistance = completedTrips.length > 0 
    ? completedTrips.reduce((sum, t) => sum + (t.distance_km || 0), 0) / completedTrips.length 
    : 0;
  const avgDuration = completedTrips.length > 0 
    ? completedTrips.reduce((sum, t) => sum + (t.duration_min || 0), 0) / completedTrips.length 
    : 0;
  
  const activeDrivers = drivers.filter(d => d.status === "active" || d.status === "on_trip").length;
  const utilizationRate = drivers.length > 0 ? (activeDrivers / drivers.length) * 100 : 0;
  
  const avgRating = drivers.filter(d => d.rating).length > 0
    ? drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.filter(d => d.rating).length
    : 0;

  const topPerformers = [...drivers]
    .filter(d => d.total_trips > 0)
    .sort((a, b) => (b.total_trips || 0) - (a.total_trips || 0))
    .slice(0, 3);

  const metrics = [
    {
      title: "Fleet Utilization",
      value: `${utilizationRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      delay: 0,
    },
    {
      title: "Avg. Fare",
      value: `GH₵${Math.round(avgFare)}`,
      icon: DollarSign,
      color: "text-accent",
      bg: "bg-accent/10",
      delay: 0.05,
    },
    {
      title: "Avg. Rating",
      value: avgRating.toFixed(1),
      icon: Star,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      delay: 0.1,
    },
    {
      title: "Avg. Trip Time",
      value: `${avgDuration.toFixed(0)} min`,
      icon: Clock,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      delay: 0.15,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: metric.delay }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{metric.title}</p>
                    <p className="font-heading font-bold text-lg">{metric.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Performers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Top Performers
          </h2>
          <span className="text-xs text-muted-foreground">This period</span>
        </div>
        
        <div className="space-y-3">
          {topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trip data available yet
            </p>
          ) : (
            topPerformers.map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold text-sm text-primary">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{driver.full_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {driver.total_trips} trips
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-chart-4 fill-chart-4" />
                      {driver.rating?.toFixed(1) || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      GH₵{Math.round(driver.total_earnings || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
                {index === 0 && (
                  <div className="px-2 py-1 rounded-full bg-chart-4/20 text-chart-4 text-xs font-medium">
                    Top
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Operational Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4"
      >
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgDistance.toFixed(1)} km</p>
          <p className="text-xs text-muted-foreground mt-1">Avg. Distance</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-accent">{completedTrips.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-chart-2">GH₵{Math.round(totalRevenue / (completedTrips.length || 1))}/trip</p>
          <p className="text-xs text-muted-foreground mt-1">Est. Revenue/Hr</p>
        </div>
      </motion.div>
    </div>
  );
}