import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Items from './pages/Items';
import Services from './pages/Services';
import About from './pages/About';
import Login from './pages/Login';

// Staff/Admin Pages
import ReceptionDashboard from './pages/ReceptionDashboard';
import AdminDashboard from './pages/AdminDashboard';

import DashboardLayout from './layouts/DashboardLayout';
import Inventory from './features/receptionist/Inventory';
// import Orders from './features/receptionist/Orders';
import Clients from './features/receptionist/Clients';
import Announcement from './features/receptionist/Announcement';

import Orders from './pages/Orders';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- 1. LOGIN (No Layout) --- */}
        <Route path="/login" element={<Login />} />

        {/* --- 2. PUBLIC ROUTES (MainLayout) --- */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="items" element={<Items />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="my-orders" element={<Orders />} />
        </Route>

        {/* RECEPTIONIST NESTED ROUTES */}
        {/* <Route path="/reception" element={<DashboardLayout />}>
          <Route index  element={<ReceptionDashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="announcement" element={<Announcement />} />
          <Route path="clients" element={<Clients />} />
        </Route> */}

        {/* --- 4. ADMIN ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Add more admin pages here like /admin/users, /admin/reports */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;