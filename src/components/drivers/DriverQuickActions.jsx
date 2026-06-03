import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Phone, MessageCircle, MapPin, Calendar, UserX, CheckCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function DriverQuickActions({ driver, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleCall = () => {
    if (driver.phone) {
      window.open(`tel:${driver.phone}`, "_blank");
    } else {
      toast.error("No phone number available");
    }
  };

  const handleMessage = () => {
    if (driver.phone) {
      window.open(`https://wa.me/${driver.phone.replace(/[^0-9]/g, "")}`, "_blank");
    } else {
      toast.error("No phone number available");
    }
  };

  const handleAssignTrip = () => {
    toast.info("Opening trip assignment...");
    // Could open a modal or navigate
  };

  const handleScheduleShift = () => {
    navigate("/shifts");
  };

  const handleSuspend = async () => {
    if (!confirm(`Suspend ${driver.full_name}?`)) return;
    
    setLoading(true);
    try {
      await base44.entities.DriverProfile.update(driver.id, { status: "suspended" });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      onStatusChange?.("suspended");
      toast.success("Driver suspended");
    } catch (error) {
      toast.error("Failed to suspend driver");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await base44.entities.DriverProfile.update(driver.id, { status: "active" });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      onStatusChange?.("active");
      toast.success("Driver activated");
    } catch (error) {
      toast.error("Failed to activate driver");
    } finally {
      setLoading(false);
    }
  };

  const getStatusAction = () => {
    if (driver.status === "suspended") {
      return (
        <DropdownMenuItem onClick={handleActivate} disabled={loading}>
          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
          Activate Driver
        </DropdownMenuItem>
      );
    }
    
    return (
      <DropdownMenuItem onClick={handleSuspend} disabled={loading} className="text-destructive">
        <UserX className="w-4 h-4 mr-2" />
        Suspend Driver
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCall}>
          <Phone className="w-4 h-4 mr-2" />
          Call Driver
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMessage}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAssignTrip}>
          <MapPin className="w-4 h-4 mr-2" />
          Assign Trip
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleScheduleShift}>
          <Clock className="w-4 h-4 mr-2" />
          Assign Shift
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {getStatusAction()}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}