import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlineBars3BottomLeft,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineUsers
} from 'react-icons/hi2';
import api from '../api/api';
import { formatRelativeTime } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const getRoleBasePath = (roleRaw) => {
  const role = String(roleRaw || '').toLowerCase().trim();
  if (role === 'admin') return '/admin';
  if (role === 'garment') return '/garment';
  // Stored role is typically "receptionist" but routes use "/reception"
  if (role === 'receptionist' || role === 'reception') return '/reception';
  return '/reception';
};

const DashboardLayout = () => {
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
  // Track dismissed notification IDs to filter them out
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch notifications - filter out dismissed ones
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/accounts/user/notifications/', { params: { limit: 10 } });
      let notifs = response.data?.results || response.data || [];
      // Filter out dismissed notifications
      notifs = notifs.filter(n => !dismissedIds.has(n.id));
      setNotifications(notifs);
      // Use is_read to match backend field name
      setPendingCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [dismissedIds]);

  // Fetch completed orders for garment users
  const fetchCompletedOrders = useCallback(async () => {
    if (userRole !== 'garment') return;
    setIsLoadingCompleted(true);
    try {
      const response = await api.get('/orders/orders/list/', { params: { status: 'COMPLETED' } });
      const orders = response.data?.results || response.data || [];
      setCompletedOrders(orders);
    } catch {
      // console.error('Error fetching completed orders:', error);
    } finally {
      setIsLoadingCompleted(false);
    }
  }, [userRole]);

  // 1. Sync Role and Theme on Mount only (not on every navigation)
  useEffect(() => {
    // Try to get role from multiple sources
    let storedRole = localStorage.getItem('user_role');

    // Fallback: check user_data if user_role is not set
    if (!storedRole) {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          storedRole = parsed.role;
        } catch (e) {
          console.error('Failed to parse user_data:', e);
        }
      }
    }

    if (storedRole) setUserRole(storedRole.toLowerCase());

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(prefersDark);
    localStorage.setItem('theme', prefersDark ? 'dark' : 'light');

    // Fetch notifications only on mount
    // fetchNotifications();

    // Fetch completed orders for garment users
    if (storedRole?.toLowerCase() === 'garment') {
      fetchCompletedOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Fetch latest notifications only when user opens the notifications panel.
  // useEffect(() => {
  //   if (showNotifications) {
  //     fetchNotifications();
  //   }
  // }, [showNotifications]); // Removed fetchNotifications from dependency to prevent re-fetching

  // Mark notification as complete - hide locally (frontend only)
  const handleMarkAsRead = (notifId) => {
    // Add to dismissed IDs so it won't show again even after refresh
    setDismissedIds(prev => new Set([...prev, notifId]));
    setPendingCount(prev => Math.max(0, prev - 1));
  };

  // 2. Dynamic Title Logic: Clean up the URL for the header
  const getPageTitle = () => {
    const path = location.pathname.split('/').filter(Boolean).pop();
    if (!path || path === 'admin' || path === 'reception') return t('overview');
    return path.replace('-', ' ');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} selection:bg-red-500 selection:text-white`}>
      <div className="flex h-screen bg-[#F8F9FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden font-sans">

        {/* SIDEBAR COMPONENT */}
          <AdminReceptionSidebar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

          {/* HEADER SECTION */}
          <header className="h-16 flex-shrink-0 border-b border-gray-100 dark:border-white/5 bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between z-40">

            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <HiOutlineBars3BottomLeft size={26} />
              </button>

              <div className="flex flex-col">
                <h1 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white italic">
                  {getPageTitle()} <span className="text-red-600 font-sans ml-1">/</span>
                </h1>
                <span className="text-[7px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.4em] hidden sm:block mt-1">
                  Terminal: <span className={userRole === 'admin' ? 'text-red-500' : userRole === 'garment' ? 'text-red-500' : 'text-blue-500'}>
                    {userRole === 'admin' ? 'SECURE_MASTER_NODE' : userRole === 'garment' ? 'GARMENT_WORKSHOP' : 'STAFF_ACCESS_PT'}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 md:gap-6">

              {/* Language Switcher */}
              {/* <div className="flex items-center">
                <LanguageSwitcher />
              </div> */}

              {/* Desktop Search Bar (hidden on garment views to avoid duplicate search) */}
              {/* {!location.pathname.startsWith('/garment') && (
                <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-transparent focus-within:border-red-600/50 transition-all group">
                  <HiOutlineMagnifyingGlass className="text-gray-500 dark:text-gray-400 group-focus-within:text-red-600" size={18} />
                  <input
                    type="text"
                    placeholder="SEARCH PROTOCOL..."
                    className="bg-transparent border-none text-[9px] font-black px-3 outline-none text-gray-900 dark:text-white w-40 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              )} */}

              {/* User Identity & Logout */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-100 dark:border-white/5">
                <div className="hidden sm:flex flex-col items-end">
                  <button
                    onClick={() => navigate(userRole === 'admin' ? '/admin/profile' : userRole === 'garment' ? '/garment/profile' : '/reception/profile')}
                    className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-wider hover:text-red-500 transition-colors"
                  >
                    {t('profile')}
                  </button>
                </div>
                <button
                  onClick={() => navigate(userRole === 'admin' ? '/admin/profile' : userRole === 'garment' ? '/garment/profile' : '/reception/profile')}
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white shadow-xl shadow-red-600/20 group hover:rotate-3 transition-all cursor-pointer"
                  title="View Profile"
                >
                  <HiOutlineUserCircle size={28} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </header>

          {/* DYNAMIC CONTENT SCROLL AREA */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 md:p-10 max-w-[] mx-auto w-full pb-20"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: NOTIFICATION ITEM --- */
const NotificationItem = ({ icon, text, time, isRead }) => (
  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-[1.5rem] transition-all cursor-pointer border border-transparent hover:border-red-600/10 group">
    <div className={`${isRead ? 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400' : 'bg-red-600/10 text-red-600'} p-2 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[10px] font-black text-gray-900 dark:text-gray-200 uppercase truncate tracking-tight">{text}</p>
      {time && <p className="text-[8px] text-gray-600 dark:text-gray-500 font-bold uppercase mt-0.5">{time}</p>}
    </div>
  </div>
);

/* --- HELPER: Get notification icon based on type --- */
const getNotificationIcon = (type) => {
  const normalizedType = type?.toLowerCase() || '';
  switch (normalizedType) {
    case 'order':
    case 'order_created':
    case 'order_update':
    case 'order_rejected':
    case 'order_expired':
      return <HiOutlineShoppingBag />;
    case 'payment':
    case 'payment_submitted':
    case 'payment_approved':
    case 'payment_rejected':
      return <HiOutlineCurrencyDollar />;
    case 'inventory':
    case 'inventory_low':
    case 'inventory_updated':
      return <HiOutlineCube />;
    case 'system':
    case 'general':
      return <HiOutlineCheckBadge />;
    case 'staff':
    case 'staff_created':
    case 'user':
      return <HiOutlineUsers />;
    default:
      return <HiOutlineBell />;
  }
};

export default DashboardLayout;