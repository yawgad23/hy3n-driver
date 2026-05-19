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
import { Star, Package, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PassengerRatingDialog({
  open,
  onOpenChange,
  passengerName,
  tripId,
  onSubmit,
}) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [foundItem, setFoundItem] = useState(false);
  const [itemDescription, setItemDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        remarks,
        foundItem,
        itemDescription: foundItem ? itemDescription : null,
      });
      // Reset form
      setRating(0);
      setRemarks("");
      setFoundItem(false);
      setItemDescription("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            Rate Passenger
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Passenger Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{passengerName}</p>
              <p className="text-xs text-muted-foreground">Complete trip to rate</p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">How was the passenger?</p>
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
            {rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3"
              >
                <Badge className={cn(
                  rating >= 4 ? "bg-green-500" : rating >= 3 ? "bg-yellow-500" : "bg-red-500"
                )}>
                  {rating >= 4 ? "Excellent" : rating >= 3 ? "Good" : "Poor"}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Remarks (optional)
            </label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Share your experience with this passenger..."
              className="h-20"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {remarks.length}/200
            </p>
          </div>

          {/* Found Item */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-accent" />
                <span className="font-medium text-sm">Found an item?</span>
              </div>
              <Button
                variant={foundItem ? "default" : "outline"}
                size="sm"
                onClick={() => setFoundItem(!foundItem)}
                className={cn(foundItem && "bg-accent hover:bg-accent/90")}
              >
                {foundItem ? "Yes" : "No"}
              </Button>
            </div>

            {foundItem && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="text-sm font-medium mb-2 block">
                  Describe the found item
                </label>
                <Textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="e.g., Black wallet, phone charger, umbrella..."
                  className="h-20"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {itemDescription.length}/300
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}