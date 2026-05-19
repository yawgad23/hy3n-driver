import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Target, Clock, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, startOfDay } from "date-fns";

export default function DriverEarningsDashboard() {
  const [timeRange, setTimeRange] = useState("week");

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => base44.entities.Trip.list("-created_date"),
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.Driver.list(),
  });

  // Filter completed trips for earnings calculation
  const completedTrips = trips.filter(t => t.status === "completed");
  
  // Calculate earnings metrics
  const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
  const totalTrips = completedTrips.length;
  const avgPerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;
  
  // Calculate weekly earnings
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const weeklyTrips = completedTrips.filter(t => {
    const tripDate = new Date(t.trip_date || t.created_date);
    return tripDate >= weekStart && tripDate <= weekEnd;
  });
  
  const weeklyEarnings = weeklyTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
  
  // Calculate daily earnings for the chart
  const generateDailyData = () => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map(day => {
      const dayTrips = completedTrips.filter(t => {
        const tripDate = new Date(t.trip_date || t.created_date);
        return startOfDay(tripDate).getTime() === startOfDay(day).getTime();
      });
      const earnings = dayTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
      return {
        day: format(day, "EEE"),
        date: format(day, "MMM d"),
        earnings: earnings,
        trips: dayTrips.length
      };
    });
  };

  const dailyData = generateDailyData();

  // Calculate weekly trends (last 4 weeks)
  const generateWeeklyTrends = () => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      
      const weekTrips = completedTrips.filter(t => {
        const tripDate = new Date(t.trip_date || t.created_date);
        return tripDate >= weekStart && tripDate <= weekEnd;
      });
      
      const earnings = weekTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
      
      weeks.push({
        week: `Week ${4 - i}`,
        earnings: earnings,
        trips: weekTrips.length
      });
    }
    return weeks;
  };

  const weeklyTrendData = generateWeeklyTrends();

  // Pending earnings (trips in progress)
  const inProgressTrips = trips.filter(t => t.status === "in_progress");
  const pendingEarnings = inProgressTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);

  if (tripsLoading || driversLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Earnings Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your earnings and trip performance</p>
        </div>
        <Tabs defaultValue="week" value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">Monthly Trend</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Earnings Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time revenue</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${weeklyEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{weeklyTrips.length} trips</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="w-4 h-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{inProgressTrips.length} active trips</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Trip</CardTitle>
            <Target className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgPerTrip.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average fare</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Earnings Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Earnings - This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value) => [`$${value.toFixed(2)}`, "Earnings"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Trends Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Weekly Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value) => [`$${value.toFixed(2)}`, "Earnings"]}
                    />
                    <Bar dataKey="earnings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trip Completion Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-secondary" />
              Trip Completion Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">{totalTrips}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Trips</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-primary/10">
                <p className="text-3xl font-bold text-primary">{weeklyTrips.length}</p>
                <p className="text-xs text-muted-foreground mt-1">This Week</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-accent/10">
                <p className="text-3xl font-bold text-accent">{avgPerTrip.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Fare ($)</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-chart-4/10">
                <p className="text-3xl font-bold text-chart-4">{inProgressTrips.length}</p>
                <p className="text-xs text-muted-foreground mt-1">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Completed Trips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Recent Completed Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTrips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{trip.pickup_location} → {trip.dropoff_location}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip.trip_date ? format(new Date(trip.trip_date), "MMM d, h:mm a") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">${trip.fare?.toFixed(2) || "0.00"}</p>
                    <p className="text-xs text-muted-foreground">{trip.distance_km?.toFixed(1) || "0"} km</p>
                  </div>
                </div>
              ))}
              {completedTrips.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No completed trips yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}