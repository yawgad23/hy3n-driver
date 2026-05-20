import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, Calendar, Target, Clock, Award, Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  subWeeks, startOfDay, subDays
} from "date-fns";
import HourlyRateChart from "@/components/earnings/HourlyRateChart";
import TripPerformanceTable from "@/components/earnings/TripPerformanceTable";
import EarningsPrediction from "@/components/earnings/EarningsPrediction";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function DriverEarningsDashboard() {
  const [timeRange, setTimeRange] = useState("week");

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => base44.entities.Trip.list("-created_date"),
  });

  const COMMISSION_RATE = 0.15;
  const driverShare = (fare) => (fare || 0) * (1 - COMMISSION_RATE);

  const now = new Date();
  const completedTrips = trips.filter((t) => t.status === "completed");

  // ── KPIs ──────────────────────────────────────────────────
  const totalEarnings = completedTrips.reduce((s, t) => s + driverShare(t.fare), 0);
  const totalDurationHrs = completedTrips.reduce((s, t) => s + (t.duration_min || 0), 0) / 60;
  const overallHourlyRate = totalDurationHrs > 0 ? totalEarnings / totalDurationHrs : 0;

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const weeklyTrips = completedTrips.filter((t) => {
    const d = new Date(t.trip_date || t.created_date);
    return d >= weekStart && d <= weekEnd;
  });
  const weeklyEarnings = weeklyTrips.reduce((s, t) => s + driverShare(t.fare), 0);

  const todayStart = startOfDay(now);
  const todayTrips = completedTrips.filter((t) => new Date(t.trip_date || t.created_date) >= todayStart);
  const todayEarnings = todayTrips.reduce((s, t) => s + driverShare(t.fare), 0);

  const inProgressTrips = trips.filter((t) => t.status === "in_progress");
  const avgPerTrip = completedTrips.length > 0 ? totalEarnings / completedTrips.length : 0;

  // ── Chart: Daily this week ─────────────────────────────────
  const dailyData = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((day) => {
    const dayTrips = completedTrips.filter(
      (t) => startOfDay(new Date(t.trip_date || t.created_date)).getTime() === startOfDay(day).getTime()
    );
    return {
      day: format(day, "EEE"),
      earnings: dayTrips.reduce((s, t) => s + driverShare(t.fare), 0),
      trips: dayTrips.length,
    };
  });

  // ── Chart: Weekly trend (last 4 weeks) ────────────────────
  const weeklyTrendData = Array.from({ length: 4 }, (_, i) => {
    const ws = startOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
    const we = endOfWeek(subWeeks(now, 3 - i), { weekStartsOn: 1 });
    const wTrips = completedTrips.filter((t) => {
      const d = new Date(t.trip_date || t.created_date);
      return d >= ws && d <= we;
    });
    return {
      week: i === 3 ? "This week" : `${3 - i}w ago`,
      earnings: wTrips.reduce((s, t) => s + driverShare(t.fare), 0),
      trips: wTrips.length,
    };
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Earnings Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track performance · predict revenue · optimize routes</p>
          <p className="text-xs text-yellow-500/80 mt-0.5">After 15% HY3N commission deducted</p>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">4-Week Trend</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Today's Earnings",
            value: `₵${todayEarnings.toFixed(2)}`,
            sub: `${todayTrips.length} trips today`,
            icon: DollarSign,
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "This Week",
            value: `₵${weeklyEarnings.toFixed(2)}`,
            sub: `${weeklyTrips.length} trips`,
            icon: Calendar,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Avg Hourly Rate",
            value: `₵${overallHourlyRate.toFixed(2)}/hr`,
            sub: `₵${avgPerTrip.toFixed(2)} per trip`,
            icon: Gauge,
            color: "text-chart-3",
            bg: "bg-chart-3/10",
          },
          {
            label: "In Progress",
            value: `₵${inProgressTrips.reduce((s, t) => s + driverShare(t.fare), 0).toFixed(2)}`,
            sub: `${inProgressTrips.length} active trips`,
            icon: Clock,
            color: "text-chart-4",
            bg: "bg-chart-4/10",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold font-heading ${color}`}>{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* AI Prediction */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <EarningsPrediction trips={trips} />
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                {timeRange === "week" ? "Daily Earnings — This Week" : "4-Week Earnings Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {timeRange === "week" ? (
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="gEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₵${v}`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`₵${v.toFixed(2)}`, "Earnings"]} />
                      <Area type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gEarnings)" />
                      </AreaChart>
                      ) : (
                      <BarChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `₵${v}`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`₵${v.toFixed(2)}`, "Earnings"]} />
                      <Bar dataKey="earnings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <HourlyRateChart trips={trips} />
        </motion.div>
      </div>

      {/* Trip Performance Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <TripPerformanceTable trips={trips} />
      </motion.div>

      {/* Summary Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4 text-chart-3" />
              All-Time Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: `₵${totalEarnings.toFixed(2)}`, color: "text-accent" },
                { label: "Completed Trips", value: completedTrips.length, color: "text-primary" },
                { label: "Avg ₵/hr", value: `₵${overallHourlyRate.toFixed(2)}`, color: "text-chart-3" },
                { label: "Avg Fare", value: `₵${avgPerTrip.toFixed(2)}`, color: "text-chart-4" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-4 rounded-xl bg-secondary/40">
                  <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}