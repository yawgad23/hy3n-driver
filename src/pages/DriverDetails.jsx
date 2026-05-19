import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Phone, Mail, Car, MapPin, Star, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import RatingStars from "../components/drivers/RatingStars";
import RatingDistribution from "../components/drivers/RatingDistribution";
import PassengerReviews from "../components/drivers/PassengerReviews";
import RatingTrends from "../components/drivers/RatingTrends";

const statusStyles = {
  active: "bg-accent/10 text-accent border-accent/20",
  on_trip: "bg-primary/10 text-primary border-primary/20",
  offline: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function DriverDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => base44.entities.Driver.get(id),
    enabled: !!id,
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Driver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", id] });
    },
  });

  const handleAddReview = async (review) => {
    const newRating = ((driver.rating || 0) * (driver.total_trips || 0) + review.rating) / ((driver.total_trips || 0) + 1);
    updateDriverMutation.mutate({
      id: driver.id,
      data: {
        rating: newRating,
        total_trips: (driver.total_trips || 0) + 1,
      },
    });
  };

  if (isLoading || !driver) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold">{driver.full_name}</h1>
          <p className="text-sm text-muted-foreground">Driver Profile</p>
        </div>
      </motion.div>

      {/* Avatar & Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {driver.avatar_url ? (
                <img src={driver.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {driver.rating && (
                  <RatingStars rating={driver.rating} size="md" />
                )}
                <span className="text-sm text-muted-foreground">{driver.total_trips || 0} trips</span>
              </div>
              <Badge variant="outline" className={cn(statusStyles[driver.status] || "")}>
                {driver.status === "on_trip" ? "On Trip" : driver.status}
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Contact Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5 space-y-3">
          <h2 className="font-heading font-semibold text-sm mb-3">Contact Information</h2>
          {driver.phone && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <span>{driver.phone}</span>
            </div>
          )}
          {driver.email && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <span>{driver.email}</span>
            </div>
          )}
          {driver.license_number && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span>License: {driver.license_number}</span>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Vehicle Info */}
      {(driver.vehicle_model || driver.vehicle_plate) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 space-y-3">
            <h2 className="font-heading font-semibold text-sm mb-3">Vehicle</h2>
            {driver.vehicle_model && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Car className="w-4 h-4 text-primary" />
                </div>
                <span>{driver.vehicle_model}</span>
              </div>
            )}
            {driver.vehicle_plate && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="font-mono">{driver.vehicle_plate}</span>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Earnings */}
      {driver.total_earnings > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="font-heading font-bold text-lg">${driver.total_earnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Rating Analytics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="grid gap-6">
          <RatingDistribution 
            rating={driver.rating || 0} 
            totalReviews={driver.total_trips || 0}
          />
          <RatingTrends />
          <PassengerReviews 
            reviews={[]}
            onAddReview={handleAddReview}
          />
        </div>
      </motion.div>
    </div>
  );
}