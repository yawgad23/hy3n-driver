import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Car, Star, Clock, TrendingUp, Target, Award, Flame, CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Flat daily commission: GH₵50 for car, GH₵30 for okada/delivery
// Driver keeps 100% of fares — commission is paid separately as a daily flat fee
export default function DriverEarningsSnapshot({ driver, todayTrips = [], onNavigate }) {
  const todayEarnings = todayTrips
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + (t.fare || t.fare_estimate || 0), 0);

  const todayCompleted = todayTrips.filter(t => t.status === "completed").length;
  const dailyGoal = 200;
  const goalProgress = Math.min((todayEarnings / dailyGoal) * 100, 100);

  // Determine daily commission based on service type
  const serviceType = driver?.service_type || "car";
  const dailyCommission = (serviceType === "okada" || serviceType === "delivery") ? 30 : 50;
  const netAfterCommission = Math.max(0, todayEarnings - dailyCommission);

  const onlineHours = driver?.total_trips ? Math.round(driver.total_trips * 0.4) : 0;

  return (
    <div className="space-y-3">
      {/* Today summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="border-accent/30 bg-accent/5 cursor-pointer active:scale-95 transition-transform"
          onClick={() => onNavigate && onNavigate('earnings')}
        >
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-accent">
              GH₵{todayEarnings.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Today's Earnings</p>
            <p className="text-[10px] text-green-500/80 mt-0.5">Tap to view details →</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer active:scale-95 transition-transform"
          onClick={() => onNavigate && onNavigate('history')}
        >
          <CardContent className="p-4 text-center">
            <Car className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{todayCompleted}</p>
            <p className="text-xs text-muted-foreground">Trips Today</p>
            <p className="text-[10px] text-primary/60 mt-0.5">Tap to view →</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily commission reminder */}
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-yellow-400">Daily HY3N Fee</p>
            <p className="text-[10px] text-muted-foreground">
              {serviceType === "okada" || serviceType === "delivery"
                ? "Okada / Delivery — flat daily fee"
                : "Car — flat daily fee"}
            </p>
          </div>
          <p className="text-xl font-heading font-bold text-yellow-400">₵{dailyCommission}</p>
        </CardContent>
      </Card>

      {/* Daily goal */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Daily Goal</span>
            </div>
            <span className="text-sm font-heading font-bold">
              ₵{todayEarnings.toFixed(0)} / ₵{dailyGoal}
            </span>
          </div>
          <Progress value={goalProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-2">
            {goalProgress >= 100
              ? "🎉 Goal reached! Keep going!"
              : `₵${(dailyGoal - todayEarnings).toFixed(0)} more to hit today's goal`}
          </p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
            <p className="font-heading font-bold">{driver?.rating?.toFixed(1) || "5.0"}</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="font-heading font-bold">{driver?.total_trips || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total Trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Acceptance Rate */}
      <Card className={cn(
        "border",
        (driver?.acceptance_rate || 0) >= 80 ? "border-green-500/30 bg-green-500/5" :
        (driver?.acceptance_rate || 0) >= 60 ? "border-yellow-500/30 bg-yellow-500/5" :
        "border-red-500/30 bg-red-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className={cn(
                "w-4 h-4",
                (driver?.acceptance_rate || 0) >= 80 ? "text-green-500" :
                (driver?.acceptance_rate || 0) >= 60 ? "text-yellow-500" : "text-red-500"
              )} />
              <span className="font-medium text-sm">Acceptance Rate</span>
            </div>
            <span className={cn(
              "text-lg font-heading font-bold",
              (driver?.acceptance_rate || 0) >= 80 ? "text-green-500" :
              (driver?.acceptance_rate || 0) >= 60 ? "text-yellow-500" : "text-red-500"
            )}>
              {driver?.acceptance_rate !== undefined ? `${driver.acceptance_rate}%` : "—"}
            </span>
          </div>
          <Progress
            value={driver?.acceptance_rate || 0}
            className="h-2"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {(driver?.acceptance_rate || 0) >= 80
              ? "Great! High acceptance keeps you a priority driver."
              : (driver?.acceptance_rate || 0) >= 60
              ? "Accepting more rides improves your dispatch priority."
              : "Low acceptance rate — try to accept more rides."}
          </p>
        </CardContent>
      </Card>

      {/* Streak */}
      {driver?.total_trips >= 5 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-heading font-bold text-sm">
                🔥 {Math.min(driver.total_trips, 7)}-day streak!
              </p>
              <p className="text-xs text-muted-foreground">
                Keep it up for a bonus reward
              </p>
            </div>
            <Badge className="ml-auto bg-orange-500 text-white">+₵5</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
