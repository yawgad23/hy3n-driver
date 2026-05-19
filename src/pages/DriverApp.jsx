import { useState, useEffect } from "react";
import DriverDashboard from "@/components/driver/DriverDashboard";
import AddDriverProfileDialog from "@/components/driver/AddDriverProfileDialog";
import SplashScreen from "@/components/driver/SplashScreen";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export default function DriverApp() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const { data: driver, isLoading } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: async () => {
      const drivers = await base44.entities.Driver.filter({});
      return drivers[0] || null;
    },
  });

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Driver App</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Accept trips and track your earnings
          </p>
        </div>
        {!driver && <AddDriverProfileDialog />}
      </div>

      {!driver ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-heading font-semibold text-lg mb-2">No Driver Profile</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create a driver profile to start receiving trip requests
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/driver-register">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up as Driver
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DriverDashboard />
      )}
    </div>
  );
}