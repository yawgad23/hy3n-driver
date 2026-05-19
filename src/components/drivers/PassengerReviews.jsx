import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import RatingStars from "./RatingStars";

export default function PassengerReviews({ reviews = [], onAddReview, onDeleteReview }) {
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newReview.comment.trim()) return;
    
    setIsSubmitting(true);
    await onAddReview?.({
      ...newReview,
      date: new Date().toISOString(),
      passenger_name: "Anonymous Passenger"
    });
    setNewReview({ rating: 5, comment: "" });
    setIsSubmitting(false);
  };

  return (
    <Card className="p-5">
      <h2 className="font-heading font-semibold text-sm mb-4">Passenger Reviews</h2>
      
      {/* Add Review */}
      <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
        <div className="mb-3">
          <RatingStars
            rating={newReview.rating}
            interactive
            onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
            size="lg"
          />
        </div>
        <Textarea
          placeholder="Write a review..."
          value={newReview.comment}
          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          className="mb-3 min-h-[80px]"
        />
        <Button 
          onClick={handleSubmit} 
          disabled={!newReview.comment.trim() || isSubmitting}
          size="sm"
        >
          Submit Review
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.passenger_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(review.date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                  <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                </div>
                {onDeleteReview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteReview(index)}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}