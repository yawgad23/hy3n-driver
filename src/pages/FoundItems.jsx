import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Package, Search, Phone, User, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function FoundItems() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: trips, isLoading } = useQuery({
    queryKey: ["found-items"],
    queryFn: async () => {
      const allTrips = await base44.entities.Ride.filter({});
      return allTrips.filter(trip => trip.found_item_reported === true);
    },
  });

  const filteredItems = trips?.filter(trip => 
    trip.found_item_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Found Items</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Items reported by drivers after trips
          </p>
        </div>
        <Badge className="bg-accent">
          <Package className="w-4 h-4 mr-1" />
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by item description, passenger, or driver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Found Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-heading font-semibold text-lg mb-2">
              {searchTerm ? "No matching items found" : "No found items reported"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm ? "Try a different search term" : "Items reported by drivers will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((trip) => (
            <Card key={trip.id} className="border-l-4 border-l-accent">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="font-heading text-base">
                        {trip.found_item_description || "Unidentified item"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reported {trip.found_item_reported_at 
                          ? format(new Date(trip.found_item_reported_at), "MMM d, yyyy • h:mm a")
                          : "Recently"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-accent/10 text-accent">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Unclaimed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {/* Passenger Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Passenger:</span>
                      <span>{trip.passenger_name || "Unknown"}</span>
                    </div>
                    {trip.passenger_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${trip.passenger_phone}`}
                          className="text-primary hover:underline"
                        >
                          {trip.passenger_phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dropoff:</p>
                        <p className="font-medium">{trip.dropoff_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Driver:</span>
                      <span>{trip.driver_name}</span>
                    </div>
                    {trip.driver_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${trip.driver_phone}`}
                          className="text-primary hover:underline"
                        >
                          {trip.driver_phone}
                        </a>
                      </div>
                    )}
                    {trip.passenger_rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-xs text-muted-foreground">Passenger rating:</span>
                        <Badge variant="outline" className="text-xs">
                          ⭐ {trip.passenger_rating}/5
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                {trip.passenger_remarks && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Driver's remarks:</p>
                    <p className="text-sm">{trip.passenger_remarks}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  {trip.passenger_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${trip.passenger_phone}`}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Passenger
                    </Button>
                  )}
                  {trip.driver_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `tel:${trip.driver_phone}`}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Driver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}