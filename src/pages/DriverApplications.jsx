import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Clock, Search, User, Car, Phone, FileText, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "Pending Review", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function DriverApplications() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: applications = [] } = useQuery({
    queryKey: ["driver-applications"],
    queryFn: () => base44.entities.DriverProfile.list("-created_date", 100),
  });

  const filtered = applications.filter((a) => {
    const matchFilter = filter === "all" || (a.status || "Pending").toLowerCase() === filter;
    const matchSearch = !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()) || a.phone?.includes(search) || a.license_plate?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = applications.filter((a) => (a.status || "Pending").toLowerCase() === "pending").length;

  const handleApprove = async (app) => {
    setLoading(true);
    try {
      await base44.entities.DriverProfile.update(app.id, {
        status: "Active",
      });
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      toast.success(`${app.full_name} has been approved as a driver.`);
      setSelected(null);
    } catch (err) {
      toast.error("Failed to approve application");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (app) => {
    setLoading(true);
    try {
      await base44.entities.DriverProfile.update(app.id, {
        status: "Inactive",
      });
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      toast.success("Application rejected.");
      setSelected(null);
      setRejectionReason("");
    } catch (err) {
      toast.error("Failed to reject application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Driver Applications</h1>
        <p className="text-muted-foreground text-sm">
          {pendingCount > 0 ? `${pendingCount} application${pendingCount > 1 ? "s" : ""} awaiting review` : "No pending applications"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search applicants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        {["pending", "approved", "rejected", "all"].map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No applications found.</CardContent></Card>
        ) : (
          filtered.map((app) => (
            <Card key={app.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>
                        {app.vehicle_model && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{app.vehicle_model}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={STATUS_CONFIG[(app.status || "Pending").toLowerCase()]?.color}>{STATUS_CONFIG[(app.status || "Pending").toLowerCase()]?.label || app.status || "Pending"}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setSelected(app)}>
                      <Eye className="w-4 h-4 mr-1" />Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Application — {selected.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{selected.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{selected.phone}</p></div>
                <div><p className="text-muted-foreground text-xs">Vehicle</p><p className="font-medium">{selected.vehicle_model || "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Plate</p><p className="font-medium">{selected.vehicle_plate || "—"}</p></div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <p className="font-semibold text-sm">Uploaded Documents</p>
                {[
                  { label: "Ghana Card / National ID", url: selected.ghana_card_url },
                  { label: "Driver's License", url: selected.drivers_license_url },
                  { label: "Vehicle Registration", url: selected.vehicle_registration_url },
                  { label: "Insurance", url: selected.insurance_url },
                  { label: "Road Worthy", url: selected.roadworthy_url },
                ].map(({ label, url }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={label} className="w-full h-36 object-cover rounded-lg border border-border hover:opacity-90 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        <FileText className="w-4 h-4 mr-2" />Not uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(selected.status || "Pending").toLowerCase() === "pending" && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-2">
                    <Label>Rejection Reason (optional)</Label>
                    <Textarea
                      placeholder="If rejecting, briefly explain why..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selected)} disabled={loading}>
                      <CheckCircle className="w-4 h-4 mr-2" />Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleReject(selected)} disabled={loading}>
                      <XCircle className="w-4 h-4 mr-2" />Reject
                    </Button>
                  </div>
                </div>
              )}

              {(selected.status || "Pending").toLowerCase() !== "pending" && (
                <div className="pt-2 border-t border-border">
                  <Badge className={(STATUS_CONFIG[(selected.status || "Pending").toLowerCase()]?.color || "") + " text-sm"}>
                    {STATUS_CONFIG[(selected.status || "Pending").toLowerCase()]?.label || selected.status}
                  </Badge>
                  {selected.rejection_reason && (
                    <p className="text-sm text-muted-foreground mt-2">Reason: {selected.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}