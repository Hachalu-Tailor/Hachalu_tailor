import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-sm uppercase tracking-wider">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const token = localStorage.getItem('access_token');
  if (!token || !user) {
    // Redirect to login, saving the attempted location
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Check if the user's role is included in the allowed list for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.RECEPTION_DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
