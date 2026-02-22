import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/routes';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem('access_token');

  // 1. If the AuthProvider is still fetching the user data, STAY HERE.
  // This prevents the "flicker" that sends you to the login page.
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">
            Securing Protocol...
          </p>
        </div>
      </div>
    );
  }

  // 2. STAGE ONE: Authentication Check
  // If there is no token at all, they are definitely not logged in.
  if (!token) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. STAGE TWO: Data Integrity Check
  // If we have a token but 'user' is null, it means the API call failed 
  // or the token is invalid. 
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 4. STAGE THREE: Authorization (Role) Check
  const userRole = user.role?.toUpperCase();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If they are logged in but don't have permission for this specific page,
    // send them to their specific dashboard instead of the login page.
    const redirectPath = userRole === 'ADMIN' 
      ? '/admin' 
      : '/reception';
      
    return <Navigate to={redirectPath} replace />;
  }

  // 5. SUCCESS: Render the requested page
  return <Outlet />;
};

export default ProtectedRoute;