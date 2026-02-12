import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HiOutlineCube, HiOutlineShoppingBag, HiOutlineChatBubbleLeftRight, 
  HiOutlineUserGroup, HiOutlineBanknotes, HiOutlineArrowLeftOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineMegaphone, HiOutlineAdjustmentsHorizontal
} from 'react-icons/hi2';

const AdminReceptionSidebar = ({ darkMode, setDarkMode }) => {
  const menuItems = [
    // { path: 'dashboard', label: 'Dashboard', icon: <HiOutlineAdjustmentsHorizontal /> },
    { path: 'inventory', label: 'Inventory', icon: <HiOutlineCube /> },
    { path: 'orders', label: 'Orders', icon: <HiOutlineShoppingBag /> },
    { path: 'clients', label: 'Clients', icon: <HiOutlineUserGroup /> },
    { path: 'payments', label: 'Finance', icon: <HiOutlineBanknotes /> },
    { path: 'announcement', label: 'Bulletins', icon: <HiOutlineMegaphone /> },
    { path: 'messages', label: 'Chat', icon: <HiOutlineChatBubbleLeftRight /> },
  ];

  // Helper for Active Link Styling
  const activeStyle = "bg-red-600 text-white shadow-xl shadow-red-600/30 ring-1 ring-red-400/50";
  const inactiveStyle = "text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-black dark:hover:text-white";

  return (
    <>
      {/* DESKTOP SIDEBAR (Adaptive for Tablet/Laptop) */}
      <aside className="hidden md:flex w-20 lg:w-72 border-r border-gray-100 dark:border-white/5 bg-white dark:bg-[#080808] flex-col p-4 lg:p-7 h-screen sticky top-0 transition-all duration-500 z-50">
        
        {/* BRAND LOGO */}
        <div className="mb-12 flex justify-center lg:justify-start items-center gap-4 px-2">
          <div className="h-11 w-11 bg-red-600 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/20">H</div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-black text-black dark:text-white tracking-tighter uppercase italic leading-none">Protocol</h2>
            <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.3em] mt-1">Management</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/reception/${item.path}`}
              className={({ isActive }) => `
                w-full flex items-center justify-center lg:justify-start gap-4 p-3.5 lg:px-5 lg:py-4 rounded-2xl transition-all duration-300 group
                ${isActive ? activeStyle : inactiveStyle}
              `}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="hidden lg:block text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM UTILS */}
        <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center lg:justify-between p-3 lg:px-5 lg:py-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-500 dark:text-gray-400 hover:ring-1 ring-gray-200 dark:ring-white/10 transition-all"
          >
            <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest">Toggle Theme</span>
            {darkMode ? <HiOutlineSun size={20} /> : <HiOutlineMoon size={20} />}
          </button>

          <button className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-5 text-gray-400 hover:text-red-600 transition-colors">
            <HiOutlineArrowLeftOnRectangle size={24} />
            <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 flex justify-around p-3 z-[100] rounded-3xl shadow-2xl">
        {menuItems.slice(0, 5).map((item) => (
          <NavLink 
            key={item.path}
            to={`/reception/${item.path}`}
            className={({ isActive }) => `
              p-3 rounded-2xl transition-all
              ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' : 'text-gray-400'}
            `}
          >
            {React.cloneElement(item.icon, { size: 22 })}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default AdminReceptionSidebar;