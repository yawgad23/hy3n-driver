import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Gauge,
  Zap,
  RotateCcw,
  Star,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SafetyReportDialog({
  open,
  onOpenChange,
  safetyData,
  tripDuration,
  distance,
  onSubmit,
}) {
  const getSafetyGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-500/10' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-500/10' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-500/10' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-500/10' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-500/10' };
  };

  const safetyGrade = getSafetyGrade(safetyData?.safetyScore || 0);
  const totalEvents = (safetyData?.hardBraking || 0) + (safetyData?.rapidAcceleration || 0) + (safetyData?.sharpTurns || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Trip Safety Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className={cn("inline-flex items-center justify-center w-24 h-24 rounded-full mb-3", safetyGrade.bg)}>
              <span className={cn("text-5xl font-bold font-heading", safetyGrade.color)}>
                {safetyGrade.grade}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold">{safetyData?.safetyScore || 0}</span>
              <span className="text-muted-foreground">/ 100</span>
            </div>
            <Badge className={cn(safetyGrade.color, "border-0")}>
              {safetyData?.safetyScore >= 80 ? "Excellent Driving" : 
               safetyData?.safetyScore >= 60 ? "Good Driving" : 
               "Needs Improvement"}
            </Badge>
          </motion.div>

          {/* Trip Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-heading font-semibold text-sm mb-3">Trip Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Gauge className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Avg Speed</p>
                  <p className="font-heading font-semibold">{safetyData?.averageSpeed || 0} km/h</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-heading font-semibold">{distance || 0} km</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-heading font-semibold">{tripDuration || 0} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Events */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-heading font-semibold text-sm mb-3">Safety Events</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">Hard Braking</p>
                      <p className="text-xs text-muted-foreground">Sudden stops detected</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-500 border-red-500/30">
                    {safetyData?.hardBraking || 0} events
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-sm">Rapid Acceleration</p>
                      <p className="text-xs text-muted-foreground">Quick speed increases</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500/30">
                    {safetyData?.rapidAcceleration || 0} events
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-sm">Sharp Turns</p>
                      <p className="text-xs text-muted-foreground">Aggressive cornering</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                    {safetyData?.sharpTurns || 0} events
                  </Badge>
                </div>
              </div>

              {totalEvents === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center"
                >
                  <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-green-500">Perfect Safety Record!</p>
                  <p className="text-xs text-green-500/80 mt-1">No safety events detected during this trip</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Safety Performance</span>
              <span className="text-sm text-muted-foreground">
                {totalEvents === 0 ? "Perfect" : `${totalEvents} events`}
              </span>
            </div>
            <Progress 
              value={safetyData?.safetyScore || 0} 
              className="h-3"
              indicatorClassName={cn(
                safetyData?.safetyScore >= 80 ? "bg-green-500" :
                safetyData?.safetyScore >= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onSubmit}
            className="bg-primary hover:bg-primary/90 w-full"
          >
            Complete & Save Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}