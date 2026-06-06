import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { firebaseClient } from "@/api/firebaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const initialFormState = {
  full_name: "",
  phone: "",
  email: "",
  license_number: "",
  vehicle_model: "",
  vehicle_plate: "",
  status: "active",
};

export default function AddDriverDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const queryClient = useQueryClient();

  const createDriverMutation = useMutation({
    mutationFn: async (data) => {
      return await firebaseClient.entities.DriverProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
      toast.success("Driver profile created successfully!");
      setOpen(false);
      setFormData(initialFormState);
    },
    onError: (error) => {
      toast.error("Failed to create driver profile");
      console.error(error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createDriverMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Driver Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Create Driver Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
              placeholder="DL123456789"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vehicle_model">Vehicle Model</Label>
            <Input
              id="vehicle_model"
              value={formData.vehicle_model}
              onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
              placeholder="Toyota Camry 2022"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vehicle_plate">License Plate</Label>
            <Input
              id="vehicle_plate"
              value={formData.vehicle_plate}
              onChange={(e) => setFormData({ ...formData, vehicle_plate: e.target.value })}
              placeholder="ABC 1234"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createDriverMutation.isPending}
          >
            {createDriverMutation.isPending ? "Creating..." : "Create Profile"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}