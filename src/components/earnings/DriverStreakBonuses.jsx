import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Gift, CheckCircle, Lock, Trophy, Star } from "lucide-react";
import { startOfDay, differenceInCalendarDays, subDays, format } from "date-fns";
import { motion } from "framer-motion";

const STREAK_MILESTONES = [
  { days: 3,  bonus: 10,  label: "3-Day Streak",   icon: "⚡", color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/30" },
  { days: 5,  bonus: 20,  label: "5-Day Streak",   icon: "🔥", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  { days: 7,  bonus: 35,  label: "7-Day Streak",   icon: "🏆", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  { days: 14, bonus: 80,  label: "14-Day Streak",  icon: "💎", color: "text-cyan-400",   bg: "bg-cyan-400/10",   border: "border-cyan-400/30" },
  { days: 30, bonus: 200, label: "30-Day Streak",  icon: "👑", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
];

const TRIP_MILESTONES = [
  { trips: 10,  bonus: 15,  label: "10 Trips",   icon: "🚗" },
  { trips: 50,  bonus: 50,  label: "50 Trips",   icon: "🚀" },
  { trips: 100, bonus: 120, label: "100 Trips",  icon: "💯" },
  { trips: 250, bonus: 300, label: "250 Trips",  icon: "🌟" },
  { trips: 500, bonus: 700, label: "500 Trips",  icon: "🏅" },
];

function calcStreak(trips) {
  if (!trips.length) return 0;
  const completedDays = new Set(
    trips
      .filter((t) => t.status === "completed")
      .map((t) => format(startOfDay(new Date(t.trip_date || t.created_date)), "yyyy-MM-dd"))
  );
  const today = startOfDay(new Date());
  let streak = 0;
  let current = today;
  // Check if drove today or yesterday (grace period)
  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
  if (!completedDays.has(todayStr) && !completedDays.has(yesterdayStr)) return 0;
  // Walk backwards
  while (true) {
    const dateStr = format(current, "yyyy-MM-dd");
    if (completedDays.has(dateStr)) {
      streak++;
      current = subDays(current, 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function DriverStreakBonuses({ trips = [] }) {
  const completedTrips = trips.filter((t) => t.status === "completed");
  const totalTrips = completedTrips.length;
  const currentStreak = useMemo(() => calcStreak(trips), [trips]);

  // Next streak milestone
  const nextStreakMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  const lastStreakMilestone = [...STREAK_MILESTONES].reverse().find((m) => m.days <= currentStreak);

  // Next trip milestone
  const nextTripMilestone = TRIP_MILESTONES.find((m) => m.trips > totalTrips);
  const lastTripMilestone = [...TRIP_MILESTONES].reverse().find((m) => m.trips <= totalTrips);

  return (
    <div className="relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
        <div className="text-center px-6">
          <span className="inline-block bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Coming Soon</span>
          <p className="text-white font-bold text-lg">Streak &amp; Bonus Rewards</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs">
            Bonus rewards will be activated when HY3N introduces percentage-based commission. Stay tuned!
          </p>
        </div>
      </div>
    <Card className="border-border bg-card opacity-40 pointer-events-none select-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Streak &amp; Bonus Rewards
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">Drive daily to earn bonus rewards on top of your fares</p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Current Streak Banner */}
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${
            currentStreak >= 7
              ? "bg-yellow-400/10 border-yellow-400/30"
              : currentStreak >= 3
              ? "bg-orange-400/10 border-orange-400/30"
              : "bg-secondary border-border"
          }`}
        >
          <div className="text-4xl">{currentStreak >= 7 ? "👑" : currentStreak >= 3 ? "🔥" : "⚡"}</div>
          <div className="flex-1">
            <p className="font-heading font-bold text-xl">
              {currentStreak} day{currentStreak !== 1 ? "s" : ""} streak
            </p>
            <p className="text-xs text-muted-foreground">
              {currentStreak === 0
                ? "Drive today to start your streak!"
                : nextStreakMilestone
                ? `${nextStreakMilestone.days - currentStreak} more day${nextStreakMilestone.days - currentStreak !== 1 ? "s" : ""} to earn GH₵${nextStreakMilestone.bonus} bonus`
                : "Maximum streak achieved! 🎉"}
            </p>
          </div>
          {lastStreakMilestone && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last bonus</p>
              <p className="font-bold text-green-400">+GH₵{lastStreakMilestone.bonus}</p>
            </div>
          )}
        </motion.div>

        {/* Streak Milestones */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Streak Milestones</p>
          <div className="space-y-2">
            {STREAK_MILESTONES.map((m) => {
              const achieved = currentStreak >= m.days;
              const isNext = nextStreakMilestone?.days === m.days;
              const progress = Math.min((currentStreak / m.days) * 100, 100);
              return (
                <div
                  key={m.days}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    achieved
                      ? `${m.bg} ${m.border}`
                      : isNext
                      ? "bg-secondary border-primary/40"
                      : "bg-secondary/40 border-border opacity-60"
                  }`}
                >
                  <span className="text-xl w-7 text-center">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold ${achieved ? m.color : "text-foreground"}`}>{m.label}</p>
                      <p className={`text-sm font-bold ${achieved ? "text-green-400" : "text-muted-foreground"}`}>
                        +GH₵{m.bonus}
                      </p>
                    </div>
                    {isNext && (
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {achieved
                    ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    : <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Trip Count Milestones */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">
            Trip Milestones · {totalTrips} trips completed
          </p>
          <div className="grid grid-cols-1 gap-2">
            {TRIP_MILESTONES.map((m) => {
              const achieved = totalTrips >= m.trips;
              const isNext = nextTripMilestone?.trips === m.trips;
              const progress = Math.min((totalTrips / m.trips) * 100, 100);
              return (
                <div
                  key={m.trips}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    achieved
                      ? "bg-green-500/10 border-green-500/30"
                      : isNext
                      ? "bg-secondary border-primary/40"
                      : "bg-secondary/40 border-border opacity-60"
                  }`}
                >
                  <span className="text-xl w-7 text-center">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-semibold ${achieved ? "text-green-400" : "text-foreground"}`}>{m.label}</p>
                      <p className={`text-sm font-bold ${achieved ? "text-green-400" : "text-muted-foreground"}`}>
                        +GH₵{m.bonus}
                      </p>
                    </div>
                    {isNext && (
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {achieved
                    ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    : <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  }
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-3">
          Bonus rewards are credited to your account after admin verification. Contact support to claim earned bonuses.
        </p>
      </CardContent>
    </Card>
    </div>
  );
}
