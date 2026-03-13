import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCube, HiOutlineShoppingBag, HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup, HiOutlineBanknotes, HiOutlineArrowLeftOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineMegaphone, HiOutlineSquares2X2,
  HiOutlineXMark, HiOutlineChartBar, HiOutlineUser, HiOutlineClipboardDocumentList,
  HiOutlineEnvelope, HiOutlineCurrencyDollar, HiOutlineScissors
} from 'react-icons/hi2';
import { useLanguage } from '../context/LanguageContext';

const AdminReceptionSidebar = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('');

  // 1. SYNC ROLE AND THEME WITH LOGGING
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');

    const rawRole = localStorage.getItem('user_role');
    if (rawRole) {
      setRole(rawRole.toLowerCase().trim());
    }
  }, [location.pathname, setDarkMode]);

  // Get role directly for filtering (fallback to state)
  const currentRole = localStorage.getItem('user_role')?.toLowerCase().trim() || role;

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const menuItems = [
    // Admin Section
    { path: '/admin', label: t('dashboard'), icon: <HiOutlineSquares2X2 />, roles: ['admin'] },
    { path: '/admin/analytics', label: t('analytics'), icon: <HiOutlineChartBar />, roles: ['admin'] },
    { path: '/admin/staff', label: t('staff'), icon: <HiOutlineUserGroup />, roles: ['admin'] },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: <HiOutlineClipboardDocumentList />, roles: ['admin'] },

    // Reception Section
    { path: '/reception', label: t('dashboard'), icon: <HiOutlineSquares2X2 />, roles: ['receptionist'] },
    { path: '/reception/orders', label: t('orders'), icon: <HiOutlineShoppingBag />, roles: ['receptionist'] },
    { path: '/reception/inventory', label: t('inventory'), icon: <HiOutlineCube />, roles: ['receptionist'] },
    { path: '/reception/clients', label: t('clients'), icon: <HiOutlineUserGroup />, roles: ['receptionist'] },
    { path: '/reception/announcement', label: 'Bulletins', icon: <HiOutlineMegaphone />, roles: ['receptionist'] },

    // Garment/Tailor Section
    { path: '/garment', label: 'Workshop', icon: <HiOutlineScissors />, roles: ['garment'] },
    { path: '/garment/orders', label: t('orders'), icon: <HiOutlineClipboardDocumentList />, roles: ['garment'] },
    { path: '/garment/messages', label: t('messages'), icon: <HiOutlineChatBubbleLeftRight />, roles: ['garment'] },
    { path: '/garment/profile', label: t('profile'), icon: <HiOutlineUser />, roles: ['garment'] },

    // Shared/Common Sections (Admin & Receptionist)
    { path: '/reception/payments', label: t('payments'), icon: <HiOutlineBanknotes />, roles: ['admin', 'receptionist'] },
    { path: '/reception/messages', label: t('messages'), icon: <HiOutlineChatBubbleLeftRight />, roles: ['admin', 'receptionist'] },
    { path: '/admin/profile', label: t('profile'), icon: <HiOutlineUser />, roles: ['admin'] },
    { path: '/reception/profile', label: t('profile'), icon: <HiOutlineUser />, roles: ['receptionist'] },
  ];

  // 2. DEBUG FILTER LOGIC
  const filteredMenu = menuItems.filter(item => {
    const hasAccess = item.roles.includes(currentRole);
    return hasAccess;
  });

  const handleLogout = () => {
    localStorage.clear();
    setRole('');
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-20 lg:w-64 bg-white dark:bg-[#080808] border-r border-gray-100 dark:border-white/5 flex-col p-4 lg:p-6 h-screen sticky top-0 left-0 z-50 transition-colors duration-500">

        <div className="mb-12 flex justify-center lg:justify-start items-center gap-4 px-2">
          <div className="h-12 w-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-600/30 shrink-0">
            <span className="font-black text-2xl italic">H</span>
          </div>
          <div className="hidden lg:block truncate">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic leading-none">Protocol</h2>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Active: <span className="text-red-600">{currentRole || 'NO ROLE DETECTED'}</span>
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
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                `}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
              </NavLink>
            ))
          ) : (
            <div className="py-10 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                Access Denied
              </p>
            </div>
          )}
        </nav>

        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 space-y-3">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-white/5 rounded-2xl transition-all">
            <div className={`p-2 rounded-xl transition-all flex-1 flex justify-center ${!darkMode ? 'bg-white text-amber-500 shadow-md ring-1 ring-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
              <HiOutlineSun size={18} />
            </div>
            <div className={`p-2 rounded-xl transition-all flex-1 flex justify-center ${darkMode ? 'bg-zinc-800 text-sky-400 shadow-md ring-1 ring-white/10' : 'text-gray-500 dark:text-gray-400'}`}>
              <HiOutlineMoon size={18} />
            </div>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-4 p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-all hover:translate-x-1">
            <HiOutlineArrowLeftOnRectangle size={24} />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="md:hidden fixed top-0 left-0 w-64 bg-white dark:bg-[#080808] border-r border-gray-100 dark:border-white/5 flex flex-col p-4 h-screen z-50"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="font-black text-xl italic">H</span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase italic">Protocol</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl">
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto">
                {filteredMenu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin' || item.path === '/reception'}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `
                      w-full flex items-center gap-4 p-4 rounded-2xl transition-all
                      ${isActive
                        ? 'bg-red-600 text-white shadow-xl shadow-red-600/40'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                <button onClick={toggleTheme} className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-white/5 rounded-2xl">
                  <div className={`p-2 rounded-xl flex-1 flex justify-center ${!darkMode ? 'bg-white text-amber-500 shadow-md ring-1 ring-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    <HiOutlineSun size={18} />
                  </div>
                  <div className={`p-2 rounded-xl flex-1 flex justify-center ${darkMode ? 'bg-zinc-800 text-sky-400 shadow-md ring-1 ring-white/10' : 'text-gray-500 dark:text-gray-400'}`}>
                    <HiOutlineMoon size={18} />
                  </div>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-all">
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
