import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, Gauge, Activity, CornerDownRight,
  MessageSquare, CheckCircle, ChevronDown, ChevronUp,
  Clock, MapPin, User
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  low:      { label: "Low",      className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  medium:   { label: "Medium",   className: "bg-orange-500/10 text-orange-600 border-orange-500/30" },
  high:     { label: "High",     className: "bg-red-500/10 text-red-600 border-red-500/30" },
  critical: { label: "Critical", className: "bg-red-700/20 text-red-400 border-red-600/40" },
};

const STATUS_CONFIG = {
  open:           { label: "Open",           className: "bg-primary/10 text-primary border-primary/30" },
  reviewed:       { label: "Reviewed",       className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  feedback_sent:  { label: "Feedback Sent",  className: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  resolved:       { label: "Resolved",       className: "bg-green-500/10 text-green-500 border-green-500/30" },
};

export default function SafetyAlertCard({ alert, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(alert.feedback_message || "");
  const [notes, setNotes] = useState(alert.manager_notes || "");
  const [loading, setLoading] = useState(false);

  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const status = STATUS_CONFIG[alert.status] || STATUS_CONFIG.open;

  const handleMarkReviewed = async () => {
    setLoading(true);
    await base44.entities.SafetyAlert.update(alert.id, {
      status: "reviewed",
      manager_notes: notes,
      reviewed_at: new Date().toISOString(),
    });
    toast.success("Alert marked as reviewed");
    onUpdate();
    setLoading(false);
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter a feedback message");
      return;
    }
    setLoading(true);
    await base44.entities.SafetyAlert.update(alert.id, {
      status: "feedback_sent",
      feedback_message: feedback,
      feedback_sent_at: new Date().toISOString(),
      manager_notes: notes,
    });
    toast.success(`Feedback sent to ${alert.driver_name}`);
    onUpdate();
    setLoading(false);
  };

  const handleResolve = async () => {
    setLoading(true);
    await base44.entities.SafetyAlert.update(alert.id, {
      status: "resolved",
      manager_notes: notes,
    });
    toast.success("Alert resolved");
    onUpdate();
    setLoading(false);
  };

  return (
    <Card className={cn(
      "border transition-all duration-200",
      alert.severity === "critical" && "border-red-500/40",
      alert.severity === "high" && "border-red-400/20",
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              alert.severity === "critical" ? "bg-red-500/20" :
              alert.severity === "high" ? "bg-orange-500/20" : "bg-yellow-500/10"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                alert.severity === "critical" ? "text-red-400" :
                alert.severity === "high" ? "text-orange-500" : "text-yellow-500"
              )} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading font-semibold text-sm">{alert.driver_name}</span>
                <Badge variant="outline" className={cn("text-xs", severity.className)}>
                  {severity.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                {alert.trip_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(alert.trip_date), "MMM d, yyyy HH:mm")}
                  </span>
                )}
                {alert.pickup_location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {alert.pickup_location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Violations pills */}
        <div className="flex flex-wrap gap-2">
          {(alert.violations || []).map((v, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full border border-destructive/20">
              <AlertTriangle className="w-3 h-3" />
              {v}
            </span>
          ))}
        </div>

        {/* Safety metrics row */}
        <div className="grid grid-cols-4 gap-2">
          {alert.safety_score !== null && alert.safety_score !== undefined && (
            <div className="text-center rounded-lg bg-secondary/60 p-2">
              <p className="text-[10px] text-muted-foreground">Score</p>
              <p className={cn("font-bold text-sm font-heading",
                alert.safety_score < 40 ? "text-red-400" :
                alert.safety_score < 60 ? "text-orange-400" : "text-yellow-400"
              )}>{alert.safety_score}</p>
            </div>
          )}
          {alert.max_speed !== null && alert.max_speed !== undefined && (
            <div className="text-center rounded-lg bg-secondary/60 p-2">
              <p className="text-[10px] text-muted-foreground">Max Speed</p>
              <p className="font-bold text-sm font-heading">{alert.max_speed} <span className="text-[9px] text-muted-foreground">km/h</span></p>
            </div>
          )}
          {alert.hard_braking_events !== null && alert.hard_braking_events !== undefined && (
            <div className="text-center rounded-lg bg-secondary/60 p-2">
              <p className="text-[10px] text-muted-foreground">Braking</p>
              <p className="font-bold text-sm font-heading">{alert.hard_braking_events}</p>
            </div>
          )}
          {alert.sharp_turns !== null && alert.sharp_turns !== undefined && (
            <div className="text-center rounded-lg bg-secondary/60 p-2">
              <p className="text-[10px] text-muted-foreground">Turns</p>
              <p className="font-bold text-sm font-heading">{alert.sharp_turns}</p>
            </div>
          )}
        </div>

        {/* Expanded: manager actions */}
        {expanded && (
          <div className="border-t border-border/50 pt-3 space-y-3">
            {/* Manager notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Internal Notes
              </label>
              <Textarea
                placeholder="Add internal notes about this incident..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Driver feedback */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Driver Feedback Message
              </label>
              <Textarea
                placeholder={`Write feedback for ${alert.driver_name}...`}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {alert.status === "open" && (
                <Button size="sm" variant="outline" onClick={handleMarkReviewed} disabled={loading}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Reviewed
                </Button>
              )}
              {(alert.status === "open" || alert.status === "reviewed") && (
                <Button size="sm" onClick={handleSendFeedback} disabled={loading}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Send Feedback
                </Button>
              )}
              {alert.status !== "resolved" && (
                <Button size="sm" variant="secondary" onClick={handleResolve} disabled={loading}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve
                </Button>
              )}
            </div>

            {/* Existing feedback preview */}
            {alert.feedback_message && alert.status !== "open" && (
              <div className="text-xs bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                <p className="text-muted-foreground font-medium mb-1">Feedback sent:</p>
                <p className="text-foreground/80">{alert.feedback_message}</p>
                {alert.feedback_sent_at && (
                  <p className="text-muted-foreground mt-1">{format(new Date(alert.feedback_sent_at), "MMM d, HH:mm")}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}