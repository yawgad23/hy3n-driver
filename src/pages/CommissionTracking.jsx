import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { firebaseClient } from "@/api/firebaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, AlertTriangle, DollarSign, Phone, Search, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import GenerateCommissionDialog from "@/components/commission/GenerateCommissionDialog";

const MOMO_NUMBER = "0546728330";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Clock },
  paid: { label: "Paid", color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  disputed: { label: "Disputed", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: AlertTriangle },
};

export default function CommissionTracking() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showGenerate, setShowGenerate] = useState(false);
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["commission-records"],
    queryFn: () => firebaseClient.entities.CommissionRecord.list("-created_date", 100),
  });

  const filtered = records.filter(r => {
    const matchSearch = !search || r.driver_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = records.filter(r => r.status === "pending" || r.status === "overdue")
    .reduce((s, r) => s + (r.commission_amount || 0), 0);
  const totalCollected = records.filter(r => r.status === "paid")
    .reduce((s, r) => s + (r.commission_amount || 0), 0);

  const handleMarkPaid = async (record) => {
    const ref = prompt("Enter MoMo transaction reference (optional):");
    await firebaseClient.entities.CommissionRecord.update(record.id, {
      status: "paid",
      payment_method: "MTN MoMo",
      payment_reference: ref || "",
      paid_at: new Date().toISOString(),
    });
    toast.success(`Marked as paid for ${record.driver_name}`);
    queryClient.invalidateQueries({ queryKey: ["commission-records"] });
  };

  const handleMarkOverdue = async (record) => {
    await firebaseClient.entities.CommissionRecord.update(record.id, { status: "overdue" });
    toast.warning(`Marked overdue for ${record.driver_name}`);
    queryClient.invalidateQueries({ queryKey: ["commission-records"] });
  };

  const handleCall = (phone) => {
    if (phone) window.location.href = `tel:${phone}`;
    else toast.error("No phone number");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Commission Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            HY3N MoMo: <span className="text-primary font-bold">{MOMO_NUMBER}</span> (MTN MoMo)
          </p>
        </div>
        <Button onClick={() => setShowGenerate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Generate Weekly Records
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Collection</p>
              <p className="text-xl font-heading font-bold text-yellow-400">₵{totalPending.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-xl font-heading font-bold text-green-400">₵{totalCollected.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Records</p>
              <p className="text-xl font-heading font-bold">{records.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MoMo Reminder Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Phone className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Remind drivers to send commission via MTN MoMo</p>
            <p className="text-xs text-muted-foreground">Send to: <strong className="text-primary">{MOMO_NUMBER}</strong> — Name: HY3N</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(MOMO_NUMBER); toast.success("Number copied!"); }}>
            Copy Number
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search driver..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["commission-records"] })}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Records Table */}
      <div className="space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No records found. Generate weekly commission records to get started.
            </CardContent>
          </Card>
        ) : (
          filtered.map(record => {
            const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <Card key={record.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <p className="font-semibold text-sm">{record.driver_name}</p>
                      <p className="text-xs text-muted-foreground">{record.week_label}</p>
                      {record.driver_phone && (
                        <p className="text-xs text-muted-foreground">{record.driver_phone}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Fare</p>
                      <p className="font-bold text-sm">₵{(record.total_fare || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Commission (20%)</p>
                      <p className="font-bold text-sm text-primary">₵{(record.commission_amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Driver Earns</p>
                      <p className="font-bold text-sm text-green-400">₵{(record.driver_earnings || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Trips</p>
                      <p className="font-bold text-sm">{record.trip_count || 0}</p>
                    </div>
                    <Badge className={`${cfg.color} gap-1`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </Badge>
                    <div className="flex gap-2">
                      {record.driver_phone && (
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleCall(record.driver_phone)}>
                          <Phone className="w-3 h-3" />
                        </Button>
                      )}
                      {record.status === "pending" && (
                        <>
                          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-xs" onClick={() => handleMarkPaid(record)}>
                            Mark Paid
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" onClick={() => handleMarkOverdue(record)}>
                            Overdue
                          </Button>
                        </>
                      )}
                      {record.status === "overdue" && (
                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-xs" onClick={() => handleMarkPaid(record)}>
                          Mark Paid
                        </Button>
                      )}
                      {record.status === "paid" && record.payment_reference && (
                        <p className="text-xs text-muted-foreground self-center">Ref: {record.payment_reference}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <GenerateCommissionDialog open={showGenerate} onOpenChange={setShowGenerate} />
    </div>
  );
}