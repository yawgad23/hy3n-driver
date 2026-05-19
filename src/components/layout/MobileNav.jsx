import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, Map, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabState } from "@/lib/TabStateContext";

const navItems = [
  { label: "Home", path: "/", icon: LayoutDashboard, tab: "dashboard" },
  { label: "Drivers", path: "/drivers", icon: Users, tab: "drivers" },
  { label: "Trips", path: "/trips", icon: MapPin, tab: "trips" },
  { label: "Map", path: "/map", icon: Map, tab: "map" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, tab: "analytics" },
];

export default function MobileNav() {
  const location = useLocation();
  const { currentTab } = useTabState();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab || location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}