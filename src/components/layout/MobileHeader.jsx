/**
 * Smart Mobile Header
 * - On root tab paths (/  /drivers  /trips  /map  /schedule  /analytics  etc.) → shows logo + brand
 * - On child screens (/drivers/:id  /trips/:id  etc.) → shows back button + page title
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Paths that are "root" tabs — show logo on these
const ROOT_PATHS = new Set(["/", "/drivers", "/trips", "/map", "/schedule", "/shifts", "/analytics", "/found-items", "/driver-app", "/earnings", "/safety-alerts"]);

function isRootPath(pathname) {
  return ROOT_PATHS.has(pathname);
}

// Derive a human-readable title from the pathname for child screens
function childTitle(pathname) {
  if (pathname.startsWith("/drivers/")) return "Driver Details";
  if (pathname.startsWith("/trips/")) return "Trip Details";
  return "";
}

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = isRootPath(location.pathname);

  return (
    <header className="lg:hidden flex items-center px-5 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40 safe-top min-h-[60px]">
      {isRoot ? (
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="https://media.firebaseClient.com/images/public/6a0c20d4cd4c2ab03134bc86/0e79de0ab_ChatGPTImageMay19202602_44_02AM.png"
            alt="HY3N Driver Logo"
            className="w-8 h-8 rounded-lg object-cover"
          />
          <span className="font-heading text-base font-bold tracking-tight">HY3N DRIVER</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-heading font-semibold text-base">{childTitle(location.pathname)}</span>
        </div>
      )}
    </header>
  );
}