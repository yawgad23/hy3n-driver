import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

export default function RatingDistribution({ rating = 0, totalReviews = 0, distribution = {} }) {
  const defaultDistribution = {
    5: distribution[5] || 0,
    4: distribution[4] || 0,
    3: distribution[3] || 0,
    2: distribution[2] || 0,
    1: distribution[1] || 0,
  };

  const total = Object.values(defaultDistribution).reduce((a, b) => a + b, 0) || totalReviews || 1;

  return (
    <Card className="p-5">
      <h2 className="font-heading font-semibold text-sm mb-4">Rating Distribution</h2>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-heading font-bold">{rating.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">{total} reviews</div>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = defaultDistribution[stars] || 0;
            const percentage = (count / total) * 100;
            
            return (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex items-center gap-1 w-12">
                  <Star className="w-3 h-3 text-chart-4 fill-chart-4" />
                  <span className="text-xs font-medium">{stars}</span>
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}