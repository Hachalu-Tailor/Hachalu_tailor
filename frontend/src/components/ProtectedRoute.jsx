import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  // this could be get from Auth Context or LocalStorage
  const user = JSON.parse(localStorage.getItem('user')); 

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Send back home if they don't have permission
  }

  return <Outlet />;
};

export default ProtectedRoute;
