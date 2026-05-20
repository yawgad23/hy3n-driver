import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  ShieldAlert, AlertTriangle, CheckCircle, Clock,
  Filter, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SafetyAlertCard from "@/components/safety/SafetyAlertCard";
import StatsCard from "@/components/dashboard/StatsCard";

const STATUS_FILTERS = [
  { key: "all",          label: "All" },
  { key: "open",         label: "Open" },
  { key: "reviewed",     label: "Reviewed" },
  { key: "feedback_sent",label: "Feedback Sent" },
  { key: "resolved",     label: "Resolved" },
];

const SEVERITY_FILTERS = [
  { key: "all",      label: "All Severities" },
  { key: "critical", label: "Critical" },
  { key: "high",     label: "High" },
  { key: "medium",   label: "Medium" },
  { key: "low",      label: "Low" },
];

export default function SafetyAlerts() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["safety-alerts"],
    queryFn: () => base44.entities.SafetyAlert.list("-created_date"),
  });

  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["safety-alerts"] });
  };

  const filtered = alerts.filter(a => {
    const statusOk = statusFilter === "all" || a.status === statusFilter;
    const severityOk = severityFilter === "all" || a.severity === severityFilter;
    return statusOk && severityOk;
  });

  // Stats
  const openCount     = alerts.filter(a => a.status === "open").length;
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const resolvedCount = alerts.filter(a => a.status === "resolved").length;
  const pendingFeedback = alerts.filter(a => a.status === "reviewed").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-destructive" />
            Safety Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated safety interventions — review flagged trips and send driver feedback
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpdate}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Open Alerts"       value={openCount}        icon={AlertTriangle} accent delay={0} />
        <StatsCard title="Critical"          value={criticalCount}    icon={ShieldAlert}   delay={0.05} />
        <StatsCard title="Pending Feedback"  value={pendingFeedback}  icon={Clock}         delay={0.1} />
        <StatsCard title="Resolved"          value={resolvedCount}    icon={CheckCircle}   delay={0.15} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Status filter */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    statusFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* Severity filter */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Severity</p>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_FILTERS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setSeverityFilter(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    severityFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <CheckCircle className="w-14 h-14 mx-auto text-green-500/50 mb-4" />
            <p className="font-heading font-semibold text-base">No alerts found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {statusFilter !== "all" || severityFilter !== "all"
                ? "Try adjusting your filters"
                : "All trips are within safety parameters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {alerts.length} alerts
          </p>
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <SafetyAlertCard alert={alert} onUpdate={handleUpdate} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}