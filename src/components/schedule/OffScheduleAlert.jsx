import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, User, X, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function OffScheduleAlert({ alert, onDismiss, onClockIn }) {
  const [loading, setLoading] = useState(false);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      await onClockIn?.(alert.shift_id);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    onDismiss?.(alert.id);
  };

  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm text-red-700">Off-Schedule Activity Detected</h3>
                <p className="text-xs text-red-600 mt-1">
                  {alert.driver_name} went active at {format(new Date(alert.detected_at), "h:mm a")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded border border-red-200">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3 h-3" />
                  Scheduled
                </div>
                <p className="text-sm font-semibold">{alert.scheduled_start} - {alert.scheduled_end}</p>
              </div>
              <div className="p-2 bg-white rounded border border-red-200">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <User className="w-3 h-3" />
                  Status
                </div>
                <p className="text-sm font-semibold text-red-600">Active (Unscheduled)</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleClockIn}
                disabled={loading}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Clock In Now
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}