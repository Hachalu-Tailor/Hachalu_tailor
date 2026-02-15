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

// Staff/Admin Pages
import ReceptionDashboard from './pages/ReceptionDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DashboardLayout from './layouts/DashboardLayout';
import AdminReception from './pages/admin/AdminReception';

// Features
import Inventory from './features/receptionist/Inventory';
import Clients from './features/receptionist/Clients';
import Announcement from './features/receptionist/Announcement';
// import Payments from './features/admin/Payments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- 1. LOGIN --- */}
        <Route path="/login" element={<Login />} />

        {/* --- 2. PUBLIC ROUTES --- */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="items" element={<Items />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="my-orders" element={<Orders />} />
        </Route>

        {/* --- 3. STAFF AREA (Shared) --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist']} />}>
          {/* The Parent is /reception */}
          <Route path="/reception" element={<DashboardLayout />}>
            <Route index element={<ReceptionDashboard />} />
            <Route path="inventory" element={<Inventory />} />  {/* URL: /reception/inventory */}
            <Route path="orders" element={<Orders />} />        {/* URL: /reception/orders */}
            <Route path="announcement" element={<Announcement />} />
            <Route path="clients" element={<Clients />} />
            {/* <Route path="payments" element={<Payments />} /> */}
            
          </Route>
        </Route>

        {/* --- 4. ADMIN EXCLUSIVE AREA --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          {/* The Parent is /admin */}
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            {/* REMOVED the leading slash from "admin-reception" */}
            <Route path="admin-reception" element={<AdminReception />} /> {/* URL: /admin/admin-reception */}
          </Route>
        </Route>

        {/* --- 5. REDIRECTS & 404 --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;