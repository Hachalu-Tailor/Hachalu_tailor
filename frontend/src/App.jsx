import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Items from './pages/Items';
import Services from './pages/Services';
import About from './pages/About';
import Login from './pages/Login';
import Orders from './pages/Orders'; // Public tracking
import NotFound from './pages/NotFound';
import DiscountPage from './pages/DiscountPage';

// Staff/Admin Pages
import ReceptionDashboard from './pages/ReceptionDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DashboardLayout from './layouts/DashboardLayout';
import Profile from './pages/Profile';

// Receptionist Features
import Inventory from './features/receptionist/Inventory';
import OrdersManagement from './features/receptionist/Orders';
import Clients from './features/receptionist/Clients';
import Announcement from './features/receptionist/Announcement';
import PaymentManagement from './features/receptionist/PaymentManagement';
import Messages from './features/receptionist/Messages';

// Admin Features
import StaffManagement from './features/admin/StaffManagement';
import Analytics from './features/admin/Analytics';
import AuditLogs from './features/admin/AuditLogs';

// Customer Features
import MeasurementForm from './features/customer/MeasurmentForm';
import PaymentForm from './features/customer/PaymentForm';

// Route Constants
import { ROUTES, ROLES } from './utils/constants';
// Scroll to top
import ScrollToTop from './utils/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* --- 1. LOGIN --- */}
        <Route path={ROUTES.LOGIN} element={<Login />} />

        {/* --- 2. PUBLIC ROUTES --- */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="items" element={<Items />} />
          <Route path="items/:category" element={<Items />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          {/* <Route path="my-orders" element={<Orders />} /> */}
          <Route path="measurements" element={<MeasurementForm />} />
          <Route path="submit-payment" element={<PaymentForm />} />
          <Route path="services/discount" element={<DiscountPage />} />
        </Route>

        {/* --- 3. STAFF AREA (Shared) --- */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RECEPTIONIST]} />}>
          {/* The Parent is /reception */}
          <Route path="/reception" element={<DashboardLayout />}>
            <Route index element={<ReceptionDashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="clients" element={<Clients />} />
            <Route path="announcement" element={<Announcement />} />
            <Route path="payments" element={<PaymentManagement />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* --- 4. ADMIN EXCLUSIVE AREA --- */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          {/* The Parent is /admin */}
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* --- 5. 404 NOT FOUND --- */}
        <Route path="/not-found" element={<NotFound />} />

        {/* --- 6. REDIRECTS --- */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
