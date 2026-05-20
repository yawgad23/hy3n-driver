import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const TabStateContext = createContext(null);

const TABS = ["dashboard", "drivers", "trips"];

const ROOT_PATHS = new Set(["/", "/drivers", "/trips", "/map", "/schedule", "/analytics", "/shifts", "/found-items", "/earnings", "/safety-alerts"]);

function pathToTab(pathname) {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/drivers")) return "drivers";
  if (pathname.startsWith("/trips")) return "trips";
  return null;
}

export function TabStateProvider({ children }) {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const [tabStates, setTabStates] = useState(() => {
    const saved = localStorage.getItem("hy3n-tab-states");
    return saved ? JSON.parse(saved) : {
      dashboard: { path: "/", scroll: 0 },
      drivers: { path: "/drivers", scroll: 0 },
      trips: { path: "/trips", scroll: 0 },
    };
  });

  const [currentTab, setCurrentTab] = useState(() => pathToTab(location.pathname) || "dashboard");

  useEffect(() => {
    const pathname = location.pathname;
    const prevPath = prevPathRef.current;
    const prevTab = pathToTab(prevPath);

    // Save scroll of where we're leaving
    if (prevTab) {
      const scrollY = window.scrollY;
      setTabStates(prev => {
        const updated = {
          ...prev,
          [prevTab]: { ...prev[prevTab], path: prevPath, scroll: scrollY },
        };
        localStorage.setItem("hy3n-tab-states", JSON.stringify(updated));
        return updated;
      });
    }

    const tab = pathToTab(pathname);
    if (tab) setCurrentTab(tab);
    prevPathRef.current = pathname;

    // Restore scroll when navigating back to a root tab
    const isRoot = ROOT_PATHS.has(pathname);
    if (isRoot && tab) {
      const savedScroll = JSON.parse(localStorage.getItem("hy3n-tab-states") || "{}")?.[tab]?.scroll || 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScroll, behavior: "instant" });
      });
    }
  }, [location.pathname]);

  return (
    <TabStateContext.Provider value={{ tabStates, currentTab }}>
      {children}
    </TabStateContext.Provider>
  );
}

export function useTabState() {
  const context = useContext(TabStateContext);
  if (!context) throw new Error("useTabState must be used within TabStateProvider");
  return context;
}