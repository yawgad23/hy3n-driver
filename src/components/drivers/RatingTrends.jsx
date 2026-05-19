import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export default function RatingTrends({ ratingHistory = [] }) {
  // If no history provided, generate sample data based on current rating
  const data = ratingHistory.length > 0 ? ratingHistory : [
    { month: "Jan", rating: 4.2 },
    { month: "Feb", rating: 4.3 },
    { month: "Mar", rating: 4.5 },
    { month: "Apr", rating: 4.4 },
    { month: "May", rating: 4.6 },
  ];

  const currentRating = data[data.length - 1]?.rating || 0;
  const previousRating = data[data.length - 2]?.rating || 0;
  const trend = currentRating - previousRating;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-sm">Rating Trends</h2>
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          <TrendingUp className={`w-3 h-3 ${trend < 0 && "rotate-180"}`} />
          <span>{trend >= 0 ? "+" : ""}{trend.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="month" 
              fontSize={12} 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              domain={[0, 5]} 
              fontSize={12} 
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}