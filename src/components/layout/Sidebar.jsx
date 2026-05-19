import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, Car, Map, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Drivers", path: "/drivers", icon: Users },
  { label: "Trips", path: "/trips", icon: MapPin },
  { label: "Map", path: "/map", icon: Map },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border min-h-screen p-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Car className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-sidebar-foreground tracking-tight">
            Hy3N
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50 font-medium">
            Driver
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-6 border-t border-sidebar-border">
        <p className="text-[11px] text-sidebar-foreground/30 font-body">
          © 2026 Hy3N Driver
        </p>
      </div>
    </aside>
  );
}