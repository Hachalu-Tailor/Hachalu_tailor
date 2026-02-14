import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import { 
  HiOutlineBell, 
  HiOutlineMagnifyingGlass, 
  HiOutlineUserCircle,
  HiOutlineBars3BottomLeft,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckBadge
} from 'react-icons/hi2';

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = localStorage.getItem('user_role') || 'receptionist';
  const pageTitle = location.pathname.split('/').pop()?.replace('-', ' ') || 'Overview';

  return (
    <div className={`${darkMode ? 'dark' : ''} selection:bg-red-500 selection:text-white`}>
      <div className="flex h-screen bg-[#F8F9FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden">
        
        {/* FIXED SIDEBAR */}
        <AdminReceptionSidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          userRole={userRole}
        />
        
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* FIXED HEADER */}
          <header className="h-20 flex-shrink-0 border-b border-gray-100 dark:border-white/5 bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl px-6 md:px-10 flex items-center justify-between z-40">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-500 dark:text-white">
                <HiOutlineBars3BottomLeft size={26} />
              </button>
              <div className="flex flex-col">
                <h1 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] dark:text-white italic">
                  {pageTitle} <span className="text-red-600 font-sans">/</span>
                </h1>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                  Terminal ID: {userRole === 'admin' ? 'MASTER_01' : 'STAFF_04'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-5">
              {/* Search Icon (Mobile) / Search Bar (Desktop) */}
              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-xl border border-transparent focus-within:border-red-600 transition-all group">
                <HiOutlineMagnifyingGlass className="text-gray-400 group-focus-within:text-red-600" />
                <input type="text" placeholder="CMD+K TO SEARCH" className="bg-transparent border-none text-[9px] font-black px-3 outline-none dark:text-white w-32" />
              </div>

              {/* Notification System */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-600'}`}
                >
                  <HiOutlineBell size={22} />
                  {!showNotifications && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-[#080808]" />}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
                      className="absolute top-14 right-0 w-80 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-2xl p-6 z-50 overflow-hidden"
                    >
                      <h3 className="text-[10px] font-black uppercase tracking-widest dark:text-white mb-4 flex items-center justify-between">
                        Live Feeds <span className="text-red-600 text-[8px]">3 New</span>
                      </h3>
                      <div className="space-y-3">
                        <NotificationItem icon={<HiOutlineChatBubbleLeftEllipsis/>} text="New message from Reception" time="2m ago" />
                        <NotificationItem icon={<HiOutlineCheckBadge/>} text="Inventory backup completed" time="15m ago" />
                        <NotificationItem icon={<HiOutlineBell/>} text="Low stock alert: Velvet Blue" time="1h ago" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar */}
              <button className="h-11 w-11 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-lg shadow-red-600/20 group overflow-hidden">
                 <HiOutlineUserCircle size={28} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </header>

          {/* SCROLLABLE VIEWPORT */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-transparent">
            <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full pb-20">
              <Outlet /> 
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const NotificationItem = ({ icon, text, time }) => (
  <div className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-red-600/20">
    <div className="text-red-600">{icon}</div>
    <div className="flex-1 overflow-hidden">
      <p className="text-[10px] font-black dark:text-gray-200 uppercase truncate">{text}</p>
      <p className="text-[8px] text-gray-500 font-bold uppercase">{time}</p>
    </div>
  </div>
);

export default DashboardLayout;