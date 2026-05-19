import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, X, Download, Calendar, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BulkTripActions({ selectedTrips, onBulkUpdate }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState(null);
  const queryClient = useQueryClient();

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedTrips.length === 0) return;
    
    setActionType(newStatus);
    setShowConfirm(true);
  };

  const confirmBulkUpdate = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedTrips.map(tripId =>
          base44.entities.Trip.update(tripId, { status: actionType })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      onBulkUpdate?.();
      toast.success(`Updated ${selectedTrips.length} trip(s) to ${actionType}`);
      setShowConfirm(false);
    } catch (error) {
      toast.error("Failed to update trips");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.info("Exporting selected trips...");
    // Could implement CSV/PDF export
  };

  const handleBulkSchedule = () => {
    toast.info("Bulk scheduling feature coming soon");
  };

  if (selectedTrips.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span>{selectedTrips.length} selected</span>
        </div>
        
        <DropdownMenuSeparator orientation="vertical" className="h-6" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <MapPin className="w-4 h-4 mr-2" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleBulkStatusChange("pending")}>
              Mark as Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatusChange("in_progress")}>
              Mark as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatusChange("completed")}>
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatusChange("cancelled")}>
              Mark as Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="sm" className="h-8" onClick={handleBulkSchedule}>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule
        </Button>
        
        <Button variant="ghost" size="sm" className="h-8" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        
        <DropdownMenuSeparator orientation="vertical" className="h-6" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => {
            setActionType("clear");
            setShowConfirm(true);
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "clear" 
                ? "Clear Selection" 
                : `Confirm Bulk Update`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "clear"
                ? `Clear selection of ${selectedTrips.length} trip(s)?`
                : `This will update ${selectedTrips.length} trip(s) to "${actionType}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === "clear" ? () => onBulkUpdate?.() : confirmBulkUpdate}
              disabled={loading}
            >
              {loading ? "Processing..." : actionType === "clear" ? "Clear" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}