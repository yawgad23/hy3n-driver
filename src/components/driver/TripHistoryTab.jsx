import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car, MapPin, Clock, Star, Calendar, DollarSign,
  Search, TrendingUp, CheckCircle, XCircle, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, startOfWeek, isWithinInterval, endOfWeek } from "date-fns";

const STATUS_CONFIG = {
  completed: { label: "Completed", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Navigation },
  driver_arriving: { label: "Arriving", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Car },
  driver_arrived: { label: "Arrived", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: MapPin },
};

function formatTripDate(trip) {
  const d = new Date(trip.trip_date || trip.created_date);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "EEE, MMM d · h:mm a");
}

function TripCard({ trip }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[trip.status] || STATUS_CONFIG.completed;
  const Icon = cfg.icon;
  const fare = trip.fare || trip.fare_estimate || 0;
  const passengerName = trip.rider_name || trip.passenger_name || "Rider";

  return (
    <Card className="overflow-hidden cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setExpanded(p => !p)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm">{passengerName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {formatTripDate(trip)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-accent text-lg">₵{Math.round(fare)}</p>
            <Badge variant="outline" className={cn("text-[10px] mt-1 gap-1", cfg.color)}>
              <Icon className="w-3 h-3" />
              {cfg.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
            <div className="w-0.5 h-5 bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-foreground leading-tight truncate">{trip.pickup_address || trip.pickup_location || "—"}</p>
            <p className="text-xs text-foreground leading-tight truncate">{trip.destination_address || trip.dropoff_location || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          {trip.distance_km && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.distance_km} km</span>}
          {(trip.duration_min || trip.duration_minutes) && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{trip.duration_min || trip.duration_minutes} min</span>}
          {trip.passenger_rating && (
            <span className="flex items-center gap-1 ml-auto"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />{trip.passenger_rating}/5</span>
          )}
          {trip.category && <Badge variant="outline" className="text-[10px] ml-auto">{trip.category}</Badge>}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
            {trip.driver_feedback && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Passenger Feedback</p>
                <p>{trip.driver_feedback}</p>
              </div>
            )}
            {trip.payment_method && (
              <div className="flex items-center justify-between">
                <span>Payment</span>
                <span className="font-medium text-foreground capitalize">{trip.payment_method}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Trip ID</span>
              <span className="font-mono text-[10px]">{trip.id?.slice(0, 12)}…</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const FILTERS = [
  { key: "all", label: "All Trips" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function TripHistoryTab({ trips = [] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const filtered = trips.filter(t => {
    const d = new Date(t.trip_date || t.created_date);
    const matchSearch = !search ||
      (t.rider_name || t.passenger_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.pickup_address || t.pickup_location || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.destination_address || t.dropoff_location || "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "today") return isToday(d);
    if (filter === "week") return isWithinInterval(d, { start: weekStart, end: weekEnd });
    if (filter === "completed") return t.status === "completed";
    if (filter === "cancelled") return t.status === "cancelled";
    return true;
  });

  const completedTrips = trips.filter(t => t.status === "completed");
  const todayEarnings = completedTrips.filter(t => isToday(new Date(t.trip_date || t.created_date))).reduce((s, t) => s + (t.fare || 0), 0);
  const weekEarnings = completedTrips.filter(t => isWithinInterval(new Date(t.trip_date || t.created_date), { start: weekStart, end: weekEnd })).reduce((s, t) => s + (t.fare || 0), 0);

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-3 text-center">
            <DollarSign className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="font-heading font-bold text-accent text-base">₵{Math.round(todayEarnings)}</p>
            <p className="text-[10px] text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="font-heading font-bold text-primary text-base">₵{Math.round(weekEarnings)}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="font-heading font-bold text-base">{completedTrips.length}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by rider, pickup or dropoff…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map(f => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)} className="shrink-0 h-8 text-xs rounded-full px-4">
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Car className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-heading font-semibold text-sm">No trips found</p>
            <p className="text-muted-foreground text-xs mt-1">{search ? "Try a different search term" : "Your completed trips will appear here"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground px-1">
            {filtered.length} trip{filtered.length !== 1 ? "s" : ""}
            {filter !== "all" && ` · ₵${Math.round(filtered.filter(t => t.status === "completed").reduce((s, t) => s + (t.fare || 0), 0))} earned`}
          </p>
          {filtered
            .sort((a, b) => new Date(b.trip_date || b.created_date) - new Date(a.trip_date || a.created_date))
            .map(trip => <TripCard key={trip.id} trip={trip} />)
          }
        </div>
      )}
    </div>
  );
}
