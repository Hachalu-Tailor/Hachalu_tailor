import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminReceptionSidebar from '../components/AdminReceptionSidebar';
import ChatFloat from '../components/ChatFloat';
import { HiOutlineBell, HiMiniSpeakerWave as HiOutlineSearch, HiOutlineUser } from 'react-icons/hi2';

const DashboardLayout = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Extract page title from URL
  const pageTitle = location.pathname.split('/').pop() || 'Overview';

  return (
    <div className={`${darkMode ? 'dark' : ''} selection:bg-red-500 selection:text-white`}>
      <div className="flex min-h-screen bg-[#fcfcfc] dark:bg-[#050505] transition-colors duration-500">
        
        {/* SIDEBAR Component */}
        <AdminReceptionSidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* DYNAMIC HEADER */}
          <header className="h-20 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#080808]/80 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 dark:text-white"
              >
                <div className="w-6 h-0.5 bg-current mb-1" />
                <div className="w-4 h-0.5 bg-current mb-1" />
                <div className="w-6 h-0.5 bg-current" />
              </button>
              <div>
                <h1 className="text-sm font-black uppercase tracking-widest dark:text-white italic">{pageTitle}</h1>
                <p className="hidden md:block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hachalu Protocol &gt; Terminal</p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-full border border-transparent focus-within:border-red-600 transition-all">
                <HiOutlineSearch className="text-gray-400" />
                <input type="text" placeholder="Search Data..." className="bg-transparent border-none text-[10px] uppercase font-bold px-3 outline-none dark:text-white" />
              </div>
              <button className="relative p-2 text-gray-500 hover:text-red-600 transition-colors">
                <HiOutlineBell size={20} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-600 rounded-full border-2 border-white dark:border-[#080808]" />
              </button>
              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center dark:text-white hover:border-red-600 transition-colors cursor-pointer group">
                 <HiOutlineUser className="group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </header>

          {/* PAGE CONTENT WINDOW */}
          <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-[1600px] mx-auto w-full">
            <Outlet /> 
          </div>
        </main>
        
        <ChatFloat />
      </div>
    </div>
  );
};

export default DashboardLayout;