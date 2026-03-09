import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import GarmentSidebar from '../components/GarmentSidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlineBars3BottomLeft,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckBadge,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineCube
} from 'react-icons/hi2';
import api from '../api/api';
import { formatRelativeTime } from '../utils/helpers';
import { useLanguage } from '../context/LanguageContext';

const DashboardLayout = () => {
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // 1. Sync Role and Theme on Mount and location change
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

    // Fetch notifications
    fetchNotifications();

    // Fetch completed orders for garment users
    if (storedRole?.toLowerCase() === 'garment') {
      fetchCompletedOrders();
    }
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/accounts/user/notifications/', { params: { limit: 10 } });
      const notifs = response.data?.results || response.data || [];
      setNotifications(notifs);
      setPendingCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch completed orders for garment users
  const fetchCompletedOrders = async () => {
    if (userRole !== 'garment') return;
    setIsLoadingCompleted(true);
    try {
      const response = await api.get('/orders/garment/completed/');
      const orders = response.data?.results || response.data || [];
      setCompletedOrders(orders);
    } catch (error) {
      console.error('Error fetching completed orders:', error);
    } finally {
      setIsLoadingCompleted(false);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (notifId) => {
    try {
      await api.patch(`/accounts/user/notifications/${notifId}/`, { read: true });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setPendingCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
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
        {userRole === 'garment' ? (
          <GarmentSidebar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            completedOrders={completedOrders}
            isLoadingOrders={isLoadingCompleted}
          />
        ) : (
          <AdminReceptionSidebar
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />
        )}

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
              <div className="flex items-center">
                <LanguageSwitcher />
              </div>

              {/* Desktop Search Bar (hidden on garment views to avoid duplicate search) */}
              {!location.pathname.startsWith('/garment') && (
                <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-transparent focus-within:border-red-600/50 transition-all group">
                  <HiOutlineMagnifyingGlass className="text-gray-500 dark:text-gray-400 group-focus-within:text-red-600" size={18} />
                  <input
                    type="text"
                    placeholder="SEARCH PROTOCOL..."
                    className="bg-transparent border-none text-[9px] font-black px-3 outline-none text-gray-900 dark:text-white w-40 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              )}

              {/* Notification Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-3 rounded-2xl transition-all ${showNotifications ? 'bg-red-600 text-white shadow-xl shadow-red-600/40' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  <HiOutlineBell size={20} />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute top-16 right-0 w-80 bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-6 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
                          {t('messages')}
                        </h3>
                        <span className="bg-red-600/10 text-red-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase">
                          {pendingCount} {t('pending')}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map((notif, idx) => (
                            <div
                              key={notif.id || idx}
                              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                              className={`cursor-pointer ${!notif.read ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                            >
                              <NotificationItem
                                icon={getNotificationIcon(notif.type)}
                                text={notif.message || notif.title || t('messages')}
                                time={formatRelativeTime(notif.created_at)}
                                isRead={notif.read}
                              />
                            </div>
                          ))
                        ) : (
                          <NotificationItem icon={<HiOutlineBell />} text={t('noData')} time="" />
                        )}
                      </div>

                      <button className="w-full mt-6 py-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-[8px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:text-white hover:bg-red-600 transition-all">
                        {t('view')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Identity & Logout */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-100 dark:border-white/5">
                <div className="hidden sm:flex flex-col items-end">
                  <button
                    onClick={() => navigate(userRole === 'admin' ? '/admin/profile' : userRole === 'garment' ? '/garment/profile' : '/reception/profile')}
                    className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-wider hover:text-red-500 transition-colors"
                  >
                    {t('profile')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[7px] font-bold text-red-500 uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all flex items-center gap-1"
                  >
                    {t('logout')} <HiOutlineArrowRightOnRectangle />
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
              className="p-6 md:p-10 max-w-[1600px] mx-auto w-full pb-20"
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
  switch (type?.toLowerCase()) {
    case 'order':
      return <HiOutlineShoppingBag />;
    case 'payment':
      return <HiOutlineCurrencyDollar />;
    case 'inventory':
      return <HiOutlineCube />;
    case 'system':
      return <HiOutlineCheckBadge />;
    default:
      return <HiOutlineBell />;
  }
};

export default DashboardLayout;