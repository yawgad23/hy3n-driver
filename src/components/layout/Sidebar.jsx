import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, Map, BarChart3, Calendar, Clock, Smartphone, Wallet, Package, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Drivers", path: "/drivers", icon: Users },
  { label: "Trips", path: "/trips", icon: MapPin },
  { label: "Map", path: "/map", icon: Map },
  { label: "Schedule", path: "/schedule", icon: Calendar },
  { label: "Shifts", path: "/shifts", icon: Clock },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Found Items", path: "/found-items", icon: Package },
  { label: "Driver App", path: "/driver-app", icon: Smartphone },
  { label: "Earnings", path: "/earnings", icon: Wallet },
  { label: "Safety Alerts", path: "/safety-alerts", icon: ShieldAlert },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border min-h-screen p-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-10">
        <img
          src="https://media.base44.com/images/public/6a0c20d4cd4c2ab03134bc86/0e79de0ab_ChatGPTImageMay19202602_44_02AM.png"
          alt="HY3N Driver Logo"
          className="w-12 h-12 rounded-xl object-cover"
        />
        <div>
          <h1 className="font-heading text-lg font-bold text-sidebar-foreground tracking-tight">
            HY3N DRIVER
          </h1>
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