import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getHourLabel(h) {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function getColor(value, max) {
  if (max === 0 || value === 0) return "bg-secondary/40 text-transparent";
  const ratio = value / max;
  if (ratio < 0.2) return "bg-blue-900/40";
  if (ratio < 0.4) return "bg-blue-700/60";
  if (ratio < 0.6) return "bg-yellow-600/70";
  if (ratio < 0.8) return "bg-orange-500/80";
  return "bg-red-500 shadow-sm shadow-red-500/40";
}

export default function EarningsHeatMap({ trips = [] }) {
  const heatData = useMemo(() => {
    // grid[dayIndex][hour] = { earnings, count }
    const grid = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({ earnings: 0, count: 0 }))
    );

    trips
      .filter((t) => t.status === "completed" && t.fare > 0)
      .forEach((t) => {
        const d = new Date(t.trip_date || t.created_date);
        // getDay: 0=Sun,1=Mon...6=Sat → remap to Mon=0..Sun=6
        const rawDay = d.getDay();
        const dayIdx = rawDay === 0 ? 6 : rawDay - 1;
        const hour = d.getHours();
        grid[dayIdx][hour].earnings += t.fare || 0;
        grid[dayIdx][hour].count += 1;
      });

    return grid;
  }, [trips]);

  const maxEarnings = useMemo(() => {
    let m = 0;
    heatData.forEach((row) => row.forEach((cell) => { if (cell.earnings > m) m = cell.earnings; }));
    return m;
  }, [heatData]);

  // Best time slot
  const bestSlot = useMemo(() => {
    let best = { day: 0, hour: 0, earnings: 0 };
    heatData.forEach((row, d) => row.forEach((cell, h) => {
      if (cell.earnings > best.earnings) best = { day: d, hour: h, earnings: cell.earnings };
    }));
    return best;
  }, [heatData]);

  // Show only every 3 hours as labels to avoid crowding
  const hourLabels = HOURS.filter((h) => h % 3 === 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="w-4 h-4 text-orange-500" />
          Earnings Heat Map
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Best times to drive — darker = more earnings
          {maxEarnings > 0 && (
            <span className="ml-2 text-orange-400 font-semibold">
              🔥 Best: {DAYS[bestSlot.day]} {getHourLabel(bestSlot.hour)}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        {maxEarnings === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Complete more trips to see your earnings heat map.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Hour axis labels */}
              <div className="flex mb-1 ml-10">
                {HOURS.map((h) => (
                  <div key={h} className="flex-1 text-center">
                    {h % 3 === 0 ? (
                      <span className="text-[9px] text-muted-foreground">{getHourLabel(h)}</span>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {DAYS.map((day, dayIdx) => (
                <div key={day} className="flex items-center gap-0.5 mb-0.5">
                  <span className="w-9 text-[10px] text-muted-foreground text-right pr-2 flex-shrink-0">{day}</span>
                  {HOURS.map((h) => {
                    const cell = heatData[dayIdx][h];
                    return (
                      <div
                        key={h}
                        title={`${day} ${getHourLabel(h)}: ₵${cell.earnings.toFixed(0)} (${cell.count} trips)`}
                        className={`flex-1 h-6 rounded-sm transition-all cursor-default ${getColor(cell.earnings, maxEarnings)}`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-muted-foreground">Low</span>
                {["bg-secondary/40", "bg-blue-900/40", "bg-blue-700/60", "bg-yellow-600/70", "bg-orange-500/80", "bg-red-500"].map((c, i) => (
                  <div key={i} className={`w-5 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
