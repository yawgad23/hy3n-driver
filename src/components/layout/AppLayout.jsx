import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Car } from "lucide-react";
import { Link } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight">Hy3N Driver</span>
          </Link>
        </header>
        
        <main className="flex-1 p-5 lg:p-8 pb-24 lg:pb-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}