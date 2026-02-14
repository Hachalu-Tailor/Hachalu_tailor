import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineCube, HiOutlineShoppingBag, HiOutlineChatBubbleLeftRight, 
  HiOutlineUserGroup, HiOutlineBanknotes, HiOutlineArrowLeftOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineMegaphone, HiOutlineSquares2X2,
  HiOutlineXMark
} from 'react-icons/hi2';

const AdminReceptionSidebar = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Get role from auth context
  const role = user?.role || '';

  // Sync Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');
  }, [setDarkMode]);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const menuItems = [
    // Admin Section
    { path: '/admin', label: 'Dashboard', icon: <HiOutlineSquares2X2 />, roles: ['admin'] },
    { path: '/admin/admin-reception', label: 'Reception Management', icon: <HiOutlineUserGroup />, roles: ['admin'] },
    
    // Reception Section
    { path: '/reception', label: 'Dashboard', icon: <HiOutlineSquares2X2 />, roles: ['receptionist'] },
    { path: '/reception/inventory', label: 'Inventory', icon: <HiOutlineCube />, roles: ['receptionist', 'admin'] },
    { path: '/reception/orders', label: 'Orders', icon: <HiOutlineShoppingBag />, roles: ['receptionist', 'admin'] },
    { path: '/reception/clients', label: 'Clients', icon: <HiOutlineUserGroup />, roles: ['receptionist', 'admin'] },
    { path: '/reception/announcement', label: 'Bulletins', icon: <HiOutlineMegaphone />, roles: ['admin', 'receptionist'] },
  ];

  // Filter menu items based on user role
  const filteredMenu = menuItems.filter(item => {
    return item.roles.includes(role);
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, setIsOpen]);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-24 lg:w-72 bg-white dark:bg-[#080808] border-r border-gray-100 dark:border-white/5 flex-col p-6 h-screen sticky top-0 left-0 z-50 transition-colors duration-500">
        
        <div className="mb-12 flex justify-center lg:justify-start items-center gap-4 px-2">
          <div className="h-12 w-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/30 shrink-0">
            <span className="font-black text-2xl italic">H</span>
          </div>
          <div className="hidden lg:block truncate">
            <h2 className="text-xl font-black dark:text-white tracking-tighter uppercase italic leading-none">Protocol</h2>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Active: <span className="text-red-600">{role || 'NO ROLE DETECTED'}</span>
            </p>
          </div>
        </div>

        {/* DYNAMIC MENU LINKS */}
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {filteredMenu.length > 0 ? (
            filteredMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin' || item.path === '/reception'} 
                className={({ isActive }) => `
                  w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl transition-all group
                  ${isActive 
                    ? 'bg-red-600 text-white shadow-xl shadow-red-600/40 ring-1 ring-red-400/20' 
                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}
                `}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              </NavLink>
            ))
          ) : (
            <div className="text-center text-gray-400 text-xs p-4">No menu items available</div>
          )}
        </nav>

        {/* BOTTOM ACTIONS */}
        <div className="mt-auto space-y-2 pt-4 border-t border-gray-100 dark:border-white/5">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white transition-all"
          >
            {darkMode ? <HiOutlineSun className="text-2xl" /> : <HiOutlineMoon className="text-2xl" />}
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em]">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-gray-400 hover:bg-red-600 hover:text-white transition-all"
          >
            <HiOutlineArrowLeftOnRectangle className="text-2xl" />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em]">Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-[#080808] z-50 p-6 flex flex-col md:hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
                    <span className="font-black text-xl italic">H</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black dark:text-white tracking-tighter uppercase italic">Protocol</h2>
                    <p className="text-[8px] font-black text-red-600 uppercase">{role}</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-red-600">
                  <HiOutlineXMark size={24} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {filteredMenu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin' || item.path === '/reception'}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `
                      w-full flex items-center gap-4 p-4 rounded-xl transition-all
                      ${isActive 
                        ? 'bg-red-600 text-white' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-white'}
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-gray-400 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  {darkMode ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <HiOutlineArrowLeftOnRectangle size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminReceptionSidebar;
