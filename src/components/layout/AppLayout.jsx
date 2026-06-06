import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

import { Link } from "react-router-dom";
import useFleetNotifications from "@/hooks/useFleetNotifications";

export default function AppLayout() {
  // Initialize real-time notifications
  useFleetNotifications();
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40 safe-top">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="https://media.base44.com/images/public/6a0c20d4cd4c2ab03134bc86/0e79de0ab_ChatGPTImageMay19202602_44_02AM.png"
              alt="HY3N Driver Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-heading text-base font-bold tracking-tight">HY3N DRIVER</span>
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