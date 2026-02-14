import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../api/api';
import { 
  HiOutlineBell, 
  HiOutlineMagnifyingGlass, 
  HiOutlineUserCircle,
  HiOutlineBars3BottomLeft,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckBadge,
  HiOutlineArrowRightOnRectangle
} from 'react-icons/hi2';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Get user role from auth context
  const userRole = user?.role || 'receptionist';

  // Sync Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  // Dynamic Title Logic
  const getPageTitle = () => {
    const path = location.pathname.split('/').filter(Boolean).pop();
    if (!path || path === 'admin' || path === 'reception') return 'Overview';
    return path.replace('-', ' ');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <header className="h-20 flex-shrink-0 border-b border-gray-100 dark:border-white/5 bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl px-6 md:px-10 flex items-center justify-between z-40">
            
            {/* Left: Mobile Toggle & Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="md:hidden p-2 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <HiOutlineBars3BottomLeft size={26} />
              </button>
              
              <div className="flex flex-col">
                <h1 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] dark:text-white italic">
                  {getPageTitle()} <span className="text-red-600 font-sans ml-1">/</span>
                </h1>
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.4em] hidden sm:block mt-1">
                  Terminal: <span className={userRole === 'admin' ? 'text-red-500' : 'text-blue-500'}>
                    {userRole === 'admin' ? 'SECURE_MASTER_NODE' : 'STAFF_ACCESS_PT'}
                  </span>
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 md:gap-6">
              
              {/* Desktop Search Bar */}
              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-transparent focus-within:border-red-600/50 transition-all group">
                <HiOutlineMagnifyingGlass className="text-gray-400 group-focus-within:text-red-600" size={18} />
                <input 
                  type="text" 
                  placeholder="SEARCH PROTOCOL..." 
                  className="bg-transparent border-none text-[9px] font-black px-3 outline-none dark:text-white w-40 placeholder:text-gray-500" 
                />
              </div>

              {/* Notification Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                >
                  <HiOutlineBell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-80 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-gray-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>
                        ) : (
                          notifications.slice(0, 5).map((notif, i) => (
                            <div key={i} className="p-4 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                              <p className="text-xs dark:text-white">{notif.message}</p>
                              <p className="text-[9px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold dark:text-white uppercase">{user?.email || 'User'}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">{userRole}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-500 dark:text-white hover:bg-red-600 hover:text-white rounded-xl transition-all"
                  title="Logout"
                >
                  <HiOutlineArrowRightOnRectangle size={22} />
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
