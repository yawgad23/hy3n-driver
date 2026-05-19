import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter location",
  type = "pickup"
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value && value.length > 2) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const fetchSuggestions = async (query) => {
    setLoading(true);
    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
          <ScrollArea className="h-full">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-border last:border-b-0",
                  "flex items-start gap-2"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
              >
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{suggestion.name}</p>
                  {suggestion.address && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        suggestion.address.road,
                        suggestion.address.city,
                        suggestion.address.state,
                        suggestion.address.country
                      ].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}