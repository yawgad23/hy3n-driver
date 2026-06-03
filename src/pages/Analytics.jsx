import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Clock, DollarSign, Car, Users } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import StatsCard from "../components/dashboard/StatsCard";

export default function Analytics() {
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.DriverProfile.list(),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => base44.entities.Ride.list("-trip_date"),
  });

  if (driversLoading || tripsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate weekly revenue trend
  const getWeeklyRevenue = () => {
    const weeks = {};
    const now = new Date();
    
    // Initialize last 6 weeks
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeks[weekKey] = 0;
    }
    
    // Sum revenue by week
    trips.forEach(trip => {
      if (trip.status === 'completed' && trip.fare) {
        const tripDate = new Date(trip.trip_date);
        const weekKey = tripDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (weeks[weekKey] !== undefined) {
          weeks[weekKey] += trip.fare;
        }
      }
    });
    
    return Object.entries(weeks).map(([week, revenue]) => ({
      week,
      revenue: Math.round(revenue * 100) / 100,
    }));
  };

  // Calculate daily trips (last 14 days)
  const getDailyTrips = () => {
    const days = {};
    const now = new Date();
    
    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      days[dayKey] = 0;
    }
    
    // Count trips by day
    trips.forEach(trip => {
      if (trip.status === 'completed') {
        const tripDate = new Date(trip.trip_date);
        const dayKey = tripDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (days[dayKey] !== undefined) {
          days[dayKey]++;
        }
      }
    });
    
    return Object.entries(days).map(([day, count]) => ({
      day,
      trips: count,
    }));
  };

  // Calculate peak hours heatmap
  const getPeakHours = () => {
    const hours = Array(24).fill(0).map((_, i) => ({
      hour: i,
      label: `${i}:00`,
      trips: 0,
      revenue: 0,
    }));
    
    trips.forEach(trip => {
      if (trip.trip_date) {
        const tripDate = new Date(trip.trip_date);
        const hour = tripDate.getHours();
        hours[hour].trips++;
        if (trip.fare && trip.status === 'completed') {
          hours[hour].revenue += trip.fare;
        }
      }
    });
    
    return hours;
  };

  const weeklyRevenue = getWeeklyRevenue();
  const dailyTrips = getDailyTrips();
  const peakHours = getPeakHours();

  // Calculate summary stats
  const totalRevenue = trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.fare || 0), 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const avgTripsPerDay = completedTrips / 14;
  const avgRevenuePerTrip = completedTrips > 0 ? totalRevenue / completedTrips : 0;
  const activeDrivers = drivers.filter(d => d.status === 'active' || d.status === 'on_trip').length;

  // Find peak hour
  const peakHour = peakHours.reduce((max, h) => h.trips > max.trips ? h : max, peakHours[0]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Driver performance and fleet insights</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} delay={0} />
        <StatsCard title="Avg Trips/Day" value={avgTripsPerDay.toFixed(1)} icon={Car} accent delay={0.1} />
        <StatsCard title="Avg Revenue/Trip" value={`$${avgRevenuePerTrip.toFixed(2)}`} icon={TrendingUp} delay={0.2} />
        <StatsCard title="Active Drivers" value={activeDrivers} icon={Users} delay={0.3} />
      </div>

      {/* Weekly Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-base">Weekly Revenue Trend</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="week" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily Trips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-accent" />
          <h2 className="font-heading font-semibold text-base">Daily Trips Completed</h2>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrips}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value) => [value, 'Trips']}
              />
              <Bar dataKey="trips" radius={[4, 4, 0, 0]}>
                {dailyTrips.map((entry, index) => (
                  <Cell key={index} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Peak Hours Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card rounded-2xl border border-border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-chart-4" />
            <h2 className="font-heading font-semibold text-base">Peak Hours Analysis</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            Peak: <span className="font-semibold text-foreground">{peakHour.label}</span> ({peakHour.trips} trips)
          </div>
        </div>
        <div className="grid grid-cols-6 lg:grid-cols-8 gap-3">
          {peakHours.map((hour, index) => {
            const intensity = Math.min(hour.trips / Math.max(1, peakHour.trips), 1);
            const bgOpacity = 0.2 + (intensity * 0.8);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + (index * 0.02) }}
                className="flex flex-col items-center p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-default"
                style={{
                  backgroundColor: `hsla(var(--primary), ${bgOpacity})`,
                }}
              >
                <span className="text-xs font-medium text-foreground mb-1">{hour.label}</span>
                <span className="text-lg font-bold text-primary">{hour.trips}</span>
                <span className="text-[10px] text-muted-foreground">
                  ${hour.revenue.toFixed(0)}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Low Activity</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
              <div
                key={i}
                className="w-6 h-3 rounded"
                style={{ backgroundColor: `hsla(var(--primary), ${opacity})` }}
              />
            ))}
          </div>
          <span>High Activity</span>
        </div>
      </motion.div>
    </div>
  );
}