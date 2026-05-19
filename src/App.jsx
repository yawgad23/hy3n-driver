import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TabStateProvider } from './lib/TabStateContext';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import DriverDetails from './pages/DriverDetails';
import TripDetails from './pages/TripDetails';
import MapDashboard from './pages/MapDashboard';
import Analytics from './pages/Analytics';
import Schedule from './pages/Schedule';
import Shifts from './pages/Shifts';
import DriverApp from './pages/DriverApp';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <TabStateProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/drivers/:id" element={<DriverDetails />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetails />} />
          <Route path="/map" element={<MapDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/driver-app" element={<DriverApp />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </TabStateProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App