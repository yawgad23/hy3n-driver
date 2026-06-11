import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * AuthRedirectRoute — wraps public-only pages (login, register).
 * If the user is already authenticated, redirects them to /driver-app
 * so they don't have to log in again.
 */
export default function AuthRedirectRoute({ children }) {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  // While auth state is loading, render nothing (avoids flash of login page)
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  // Already logged in — go straight to the driver app
  if (isAuthenticated) {
    return <Navigate to="/driver-app" replace />;
  }

  return children;
}
