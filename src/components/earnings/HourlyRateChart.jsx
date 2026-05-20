import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock } from "lucide-react";

export default function HourlyRateChart({ trips }) {
  // Build hourly buckets (0–23)
  const hourlyBuckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`,
    earnings: 0,
    trips: 0,
    totalDuration: 0,
  }));

  trips.forEach((trip) => {
    if (trip.status !== "completed" || !trip.trip_date) return;
    const h = new Date(trip.trip_date).getHours();
    hourlyBuckets[h].earnings += trip.fare || 0;
    hourlyBuckets[h].trips += 1;
    hourlyBuckets[h].totalDuration += trip.duration_min || 0;
  });

  const hourlyRates = hourlyBuckets.map((b) => ({
    ...b,
    rate: b.totalDuration > 0 ? (b.earnings / (b.totalDuration / 60)) : 0,
  }));

  const maxRate = Math.max(...hourlyRates.map((h) => h.rate), 1);
  const now = new Date().getHours();

  // Show only 6am–midnight range for cleaner view
  const displayHours = hourlyRates.filter((h) => h.hour >= 6 || h.hour <= 2);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-primary" />
          Hourly Rate ($/hr)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayHours} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [`$${value.toFixed(2)}/hr`, "Rate"]}
                labelFormatter={(label) => `Hour: ${label}`}
              />
              <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                {displayHours.map((entry) => (
                  <Cell
                    key={entry.hour}
                    fill={
                      entry.hour === now
                        ? "hsl(var(--accent))"
                        : entry.rate > maxRate * 0.75
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Current hour highlighted in teal · Peak hours in blue
        </p>
      </CardContent>
    </Card>
  );
}