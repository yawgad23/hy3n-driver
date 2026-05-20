import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, Car, Star, Clock, TrendingUp, Target, Award, Flame
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const COMMISSION_RATE = 0.15;

export default function DriverEarningsSnapshot({ driver, todayTrips = [] }) {
  const todayEarnings = todayTrips
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + (t.fare || 0) * (1 - COMMISSION_RATE), 0);

  const todayCompleted = todayTrips.filter(t => t.status === "completed").length;
  const dailyGoal = 150;
  const goalProgress = Math.min((todayEarnings / dailyGoal) * 100, 100);

  const onlineHours = driver?.total_trips ? Math.round(driver.total_trips * 0.4) : 0;

  return (
    <div className="space-y-3">
      {/* Today summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-accent mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold text-accent">
              ₵{todayEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Today's Earnings</p>
            <p className="text-[10px] text-yellow-500/70 mt-0.5">After 15% commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-heading font-bold">{todayCompleted}</p>
            <p className="text-xs text-muted-foreground">Trips Today</p>
          </CardContent>
        </Card>
      </div>

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
              : `₵${(dailyGoal - todayEarnings).toFixed(2)} more to hit today's goal`}
          </p>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
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
        <Card>
          <CardContent className="p-3 text-center">
            <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
            <p className="font-heading font-bold">
              {driver?.safety_metrics?.overall_safety_score || 98}%
            </p>
            <p className="text-[10px] text-muted-foreground">Safety</p>
          </CardContent>
        </Card>
      </div>

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