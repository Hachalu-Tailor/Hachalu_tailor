import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role'); // Should be 'admin' or 'receptionist'

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is included in the allowed list for this route
  return allowedRoles.includes(userRole) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace /> // Send back to home if unauthorized
  );
};

export default ProtectedRoute;