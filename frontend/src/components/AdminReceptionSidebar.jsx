import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineCube, HiOutlineShoppingBag, HiOutlineChatBubbleLeftRight, 
  HiOutlineUserGroup, HiOutlineBanknotes, HiOutlineArrowLeftOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineMegaphone, HiOutlineSquares2X2,
  HiOutlineXMark
} from 'react-icons/hi2';

const AdminReceptionSidebar = ({ darkMode, setDarkMode, isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('');

  // 1. SYNC ROLE AND THEME WITH LOGGING
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setDarkMode(savedTheme === 'dark');

    const getStoredRole = () => {
      const rawRole = localStorage.getItem('user_role');
      // console.log("1. Raw Role from LocalStorage:", rawRole);

      if (rawRole) {
        const cleanedRole = rawRole.toLowerCase().trim();
        // console.log("2. Cleaned Role being set to state:", cleanedRole);
        setRole(cleanedRole);
      } else {
        // console.warn("2. No 'user_role' found in LocalStorage!");
        setRole('');
      }
    };

    getStoredRole();
  }, [location, setDarkMode]);

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
  { path: '/reception/inventory', label: 'Inventory', icon: <HiOutlineCube />, roles: ['receptionist', 'admin'] },
  { path: '/reception/orders', label: 'Orders', icon: <HiOutlineShoppingBag />, roles: ['receptionist'] },
  { path: '/reception/clients', label: 'Clients', icon: <HiOutlineUserGroup />, roles: ['receptionist'] },
  // { path: '/reception/announcement', label: 'Bulletins', icon: <HiOutlineMegaphone />, roles: ['admin', 'receptionist'] },

  // Finance Section
  { path: '/reception/payments', label: 'Finance', icon: <HiOutlineBanknotes />, roles: ['receptionist'] },
  // { path: '/reception/messages', label: 'Messages', icon: <HiOutlineChatBubbleLeftRight />, roles: ['admin', 'receptionist'] },
];

  // 2. DEBUG FILTER LOGIC
  const filteredMenu = menuItems.filter(item => {
    const hasAccess = item.roles.includes(role);
    return hasAccess;
  });

  const handleLogout = () => {
    localStorage.clear();
    setRole('');
    navigate('/login');
  };

  return (
    <>
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
        // ADD THIS PROP HERE:
        // It ensures /admin isn't active when you are at /admin/admin-reception
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
    <div className="py-10 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
       <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
        Access Denied
       </p>
    </div>
  )}
</nav>

        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-white/5 space-y-3">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-white/5 rounded-2xl transition-all">
            <div className={`p-2 rounded-xl transition-all flex-1 flex justify-center ${!darkMode ? 'bg-white text-orange-500 shadow-md' : 'text-gray-500'}`}>
              <HiOutlineSun size={18} />
            </div>
            <div className={`p-2 rounded-xl transition-all flex-1 flex justify-center ${darkMode ? 'bg-zinc-800 text-blue-400 shadow-md' : 'text-gray-500'}`}>
              <HiOutlineMoon size={18} />
            </div>
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 text-gray-400 hover:text-red-600 transition-all hover:translate-x-1">
            <HiOutlineArrowLeftOnRectangle size={24} />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminReceptionSidebar;