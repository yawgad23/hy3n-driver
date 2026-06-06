import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import TripRowWithCheckbox from "../components/trips/TripRowWithCheckbox";
import AddTripDialog from "../components/trips/AddTripDialog";
import BulkTripActions from "../components/trips/BulkTripActions";
import PullToRefresh from "@/components/PullToRefresh";
import MobileSelect from "@/components/ui/MobileSelect";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Trips() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTrips, setSelectedTrips] = useState([]);
  const queryClient = useQueryClient();

  const toggleSelectTrip = (tripId) => {
    setSelectedTrips(prev =>
      prev.includes(tripId)
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  };

  const clearSelection = () => setSelectedTrips([]);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => firebaseClient.entities.Ride.list("-created_date"),
  });

  const filtered = trips.filter(t => {
    const matchSearch = !search ||
      t.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.passenger_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.pickup_location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["trips"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight">Trips</h1>
            <p className="text-muted-foreground text-sm mt-1">{trips.length} trips logged</p>
          </div>
          <AddTripDialog onTripAdded={() => queryClient.invalidateQueries({ queryKey: ["trips"] })} />
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <MobileSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Status"
            options={STATUS_OPTIONS}
            triggerClassName="w-full sm:w-40"
          />
        </div>

        {/* Trip List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((trip, index) => (
              <TripRowWithCheckbox
                key={trip.id}
                trip={trip}
                index={index}
                isSelected={selectedTrips.includes(trip.id)}
                onToggleSelect={toggleSelectTrip}
              />
            ))}
          </div>
        )}

        {/* Bulk Actions Bar */}
        <BulkTripActions
          selectedTrips={selectedTrips}
          onBulkUpdate={clearSelection}
        />
      </div>
    </PullToRefresh>
  );
}