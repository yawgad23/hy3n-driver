import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { TabStateProvider } from './lib/TabStateContext';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
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
import DriverEarningsDashboard from './pages/DriverEarningsDashboard';
import DriverRegister from './pages/DriverRegister';
import FoundItems from './pages/FoundItems';
import SafetyAlerts from './pages/SafetyAlerts';
import CommissionTracking from './pages/CommissionTracking';
import DriverApplications from './pages/DriverApplications';
import SplashScreen from './pages/SplashScreen';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Role-based redirect: non-admin users → driver app
  if (isAuthenticated && user && user.role !== 'admin') {
    const isDriverRoute = location.pathname.startsWith('/driver-') || location.pathname === '/earnings';
    if (!isDriverRoute) {
      return <Navigate to="/driver-app" replace />;
    }
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
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ width: "100%", minHeight: "100vh" }}
        >
          <Routes location={location}>
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/driver-app" element={<DriverApp />} />
            <Route path="/driver-register" element={<DriverRegister />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
            <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/drivers/:id" element={<DriverDetails />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/:id" element={<TripDetails />} />
              <Route path="/map" element={<MapDashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/shifts" element={<Shifts />} />
              <Route path="/found-items" element={<FoundItems />} />
              <Route path="/safety-alerts" element={<SafetyAlerts />} />
              <Route path="/commission" element={<CommissionTracking />} />
              <Route path="/driver-applications" element={<DriverApplications />} />
            </Route>
            </Route>
            </Route>
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route path="/earnings" element={<DriverEarningsDashboard />} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
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