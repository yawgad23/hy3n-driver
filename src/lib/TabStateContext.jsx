import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const TabStateContext = createContext(null);

const TABS = ["dashboard", "drivers", "trips"];

export function TabStateProvider({ children }) {
  const location = useLocation();
  const [tabStates, setTabStates] = useState(() => {
    const saved = localStorage.getItem("hy3n-tab-states");
    return saved ? JSON.parse(saved) : {
      dashboard: { path: "/", scroll: 0 },
      drivers: { path: "/drivers", scroll: 0 },
      trips: { path: "/trips", scroll: 0 },
    };
  });

  const [currentTab, setCurrentTab] = useState("dashboard");

  useEffect(() => {
    const pathname = location.pathname;
    let tab = "dashboard";
    if (pathname.startsWith("/drivers")) tab = "drivers";
    else if (pathname.startsWith("/trips")) tab = "trips";
    
    setCurrentTab(tab);

    // Save scroll position when leaving current tab
    setTabStates(prev => {
      const updated = {
        ...prev,
        [currentTab]: {
          ...prev[currentTab],
          path: pathname,
          scroll: window.scrollY,
        },
      };
      localStorage.setItem("hy3n-tab-states", JSON.stringify(updated));
      return updated;
    });
  }, [location.pathname]);

  // Restore scroll when navigating within same tab
  useEffect(() => {
    const tab = TABS.find(t => location.pathname.startsWith(t === "dashboard" ? "/" : `/${t}`));
    if (tab && tabStates[tab]) {
      window.scrollTo({ top: tabStates[tab].scroll, behavior: "smooth" });
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
  if (!context) {
    throw new Error("useTabState must be used within TabStateProvider");
  }
  return context;
}