import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Star, 
  Package, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Gauge,
  Zap,
  RotateCcw,
  Award
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TripSummaryDialog({
  open,
  onOpenChange,
  passengerName,
  safetyData,
  tripDuration,
  distance,
  onSubmit,
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [foundItem, setFoundItem] = useState(false);
  const [itemDescription, setItemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        remarks,
        foundItem,
        itemDescription: foundItem ? itemDescription : null,
        safetyReport: safetyData
      });
      // Reset form
      setRating(0);
      setRemarks("");
      setFoundItem(false);
      setItemDescription("");
    } catch (error) {
      console.error("Failed to submit summary:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Trip Summary & Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ── Section 1: Safety Report ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Safety Performance</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-secondary/30 border-none">
                <CardContent className="p-4 text-center">
                  <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-full mb-2", safetyGrade.bg)}>
                    <span className={cn("text-2xl font-bold font-heading", safetyGrade.color)}>
                      {safetyGrade.grade}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Safety Score</p>
                  <p className="font-bold text-lg">{safetyData?.safetyScore || 0}/100</p>
                </CardContent>
              </Card>
              
              <Card className="bg-secondary/30 border-none">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Gauge className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Speed</p>
                  <p className="font-bold text-lg">{safetyData?.averageSpeed || 0} km/h</p>
                </CardContent>
              </Card>
            </div>

            {totalEvents > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {safetyData?.hardBraking > 0 && (
                  <Badge variant="outline" className="bg-red-500/5 text-red-500 border-red-500/20 shrink-0">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {safetyData.hardBraking} Hard Braking
                  </Badge>
                )}
                {safetyData?.rapidAcceleration > 0 && (
                  <Badge variant="outline" className="bg-orange-500/5 text-orange-500 border-orange-500/20 shrink-0">
                    <Zap className="w-3 h-3 mr-1" /> {safetyData.rapidAcceleration} Rapid Accel
                  </Badge>
                )}
                {safetyData?.sharpTurns > 0 && (
                  <Badge variant="outline" className="bg-yellow-500/5 text-yellow-500 border-yellow-500/20 shrink-0">
                    <RotateCcw className="w-3 h-3 mr-1" /> {safetyData.sharpTurns} Sharp Turns
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                <Award className="w-5 h-5 text-green-500" />
                <p className="text-xs font-medium text-green-600">Perfect driving! No safety events detected.</p>
              </div>
            )}
          </div>

          {/* ── Section 2: Passenger Rating ── */}
          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Rate Passenger</h3>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium mb-3">How was {passengerName}?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "w-10 h-10 transition-colors",
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "fill-muted text-muted"
                      )}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks about the passenger..."
                className="h-20 bg-secondary/30 border-none rounded-xl"
                maxLength={200}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Found an item?</span>
              </div>
              <Button
                variant={foundItem ? "default" : "outline"}
                size="sm"
                onClick={() => setFoundItem(!foundItem)}
                className={cn("h-8 rounded-lg", foundItem && "bg-primary hover:bg-primary/90")}
              >
                {foundItem ? "Yes" : "No"}
              </Button>
            </div>

            {foundItem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Describe the item (e.g. Black wallet)..."
                  className="h-20 bg-secondary/30 border-none rounded-xl"
                  maxLength={300}
                />
              </motion.div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="bg-primary hover:bg-primary/90 w-full h-14 text-base font-bold rounded-2xl"
          >
            {submitting ? "Submitting..." : "Submit & Finish Trip"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
